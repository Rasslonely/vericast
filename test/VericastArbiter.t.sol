// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/VERI.sol";
import "../contracts/VericastArbiter.sol";
import "../contracts/VericastAgentID.sol";
import "../interfaces/IVericastArbiter.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/// @title VericastArbiter Test Suite
/// @notice Comprehensive Foundry tests for all Phase 1 contracts
/// @dev Run: forge test -vvv --gas-report
///      Traceable to: SYSTEM_INTERFACES_internal.md §1.1, §1.2, §1.3
contract VericastArbiterTest is Test {
    VERI public veri;
    VericastArbiter public arbiter;
    VericastAgentID public agentId;

    address public owner;
    address public sequencer;
    address public challenger;

    // Test constants
    bytes32 constant STREAM_ID = keccak256("game");
    bytes32 constant KEY = keccak256("match_1_tick_1");
    bytes32 constant STATE_ROOT = keccak256("state_root_data");
    bytes32 constant TEE_SEAL = keccak256("tee_seal_from_gpt_oss_120b");
    bytes32 constant PROOF_HASH = keccak256("risc_zero_proof");

    function setUp() public {
        owner = address(this);
        sequencer = makeAddr("sequencer");
        challenger = makeAddr("challenger");

        // Deploy VERI token
        veri = new VERI(owner);

        // Deploy VericastArbiter via UUPS proxy
        VericastArbiter arbiterImpl = new VericastArbiter();
        bytes memory arbiterData = abi.encodeWithSelector(
            VericastArbiter.initialize.selector,
            owner,
            owner,       // zkVerifier mock = owner (EOA — low-level call will fail)
            address(veri)
        );
        ERC1967Proxy arbiterProxy = new ERC1967Proxy(address(arbiterImpl), arbiterData);
        arbiter = VericastArbiter(address(arbiterProxy));

        // Deploy VericastAgentID via UUPS proxy
        VericastAgentID agentImpl = new VericastAgentID();
        bytes memory agentData = abi.encodeWithSelector(
            VericastAgentID.initialize.selector,
            owner
        );
        ERC1967Proxy agentProxy = new ERC1967Proxy(address(agentImpl), agentData);
        agentId = VericastAgentID(address(agentProxy));

        // Fund sequencer and challenger with VERI for testing
        veri.mint(sequencer, 100 * 1e18);
        veri.mint(challenger, 100 * 1e18);
    }

    // ========================
    // ARBITER TESTS
    // ========================

    function test_deploy_and_initialize() public view {
        assertEq(arbiter.owner(), owner);
        assertEq(arbiter.zkVerifier(), owner); // mock
        assertEq(arbiter.veriToken(), address(veri));
        assertEq(arbiter.DISPUTE_WINDOW(), 150);
        assertEq(arbiter.MIN_STAKE(), 1e18);
        assertEq(arbiter.STAKE_LOCK(), 300);
    }

    function test_submitStateRoot() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        assertEq(arbiter.commitCount(), 1);
    }

    function test_batchSubmit() public {
        IVericastArbiter.Submission[] memory subs = new IVericastArbiter.Submission[](3);
        subs[0] = IVericastArbiter.Submission(STREAM_ID, keccak256("k1"), STATE_ROOT, TEE_SEAL, PROOF_HASH);
        subs[1] = IVericastArbiter.Submission(STREAM_ID, keccak256("k2"), STATE_ROOT, TEE_SEAL, PROOF_HASH);
        subs[2] = IVericastArbiter.Submission(STREAM_ID, keccak256("k3"), STATE_ROOT, TEE_SEAL, PROOF_HASH);

        vm.prank(sequencer);
        arbiter.batchSubmit(subs);

        assertEq(arbiter.commitCount(), 3);
    }

    function test_dispute() public {
        // Submit a state root
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        // Calculate commitId
        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        // Challenger approves VERI stake and disputes
        vm.startPrank(challenger);
        veri.approve(address(arbiter), 1e18);
        arbiter.dispute(commitId, 1e18);
        vm.stopPrank();

        // Verify disputed
        IVericastArbiter.StateCommit memory commit = arbiter.getCommit(commitId);
        assertTrue(commit.disputed);
        assertEq(arbiter.challengers(commitId), challenger);
    }

    function test_dispute_reverts_insufficient_stake() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        vm.startPrank(challenger);
        veri.approve(address(arbiter), 0.5e18);
        vm.expectRevert();
        arbiter.dispute(commitId, 0.5e18);
        vm.stopPrank();
    }

    function test_dispute_reverts_already_disputed() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        vm.startPrank(challenger);
        veri.approve(address(arbiter), 2e18);
        arbiter.dispute(commitId, 1e18);
        vm.expectRevert();
        arbiter.dispute(commitId, 1e18);
        vm.stopPrank();
    }

    function test_finalize() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        // Roll past dispute window (150 blocks)
        vm.roll(block.number + 151);

        arbiter.finalize(commitId);
        assertTrue(arbiter.isFinalized(commitId));
    }

    function test_finalize_reverts_before_window() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        // Don't roll — still in dispute window
        vm.expectRevert();
        arbiter.finalize(commitId);
    }

    function test_finalize_reverts_if_disputed() public {
        vm.prank(sequencer);
        arbiter.submitStateRoot(STREAM_ID, KEY, STATE_ROOT, TEE_SEAL, PROOF_HASH);

        bytes32 commitId = keccak256(
            abi.encodePacked(STREAM_ID, KEY, STATE_ROOT, block.number)
        );

        vm.startPrank(challenger);
        veri.approve(address(arbiter), 1e18);
        arbiter.dispute(commitId, 1e18);
        vm.stopPrank();

        vm.roll(block.number + 151);
        vm.expectRevert();
        arbiter.finalize(commitId);
    }

    // ========================
    // VERI TOKEN TESTS
    // ========================

    function test_VERI_initial_state() public view {
        assertEq(veri.name(), "VERI Token");
        assertEq(veri.symbol(), "VERI");
        assertEq(veri.MAX_SUPPLY(), 100_000_000 * 1e18);
        // Initial mint: 10M to owner + 100 each to sequencer/challenger = 10,000,200
        assertEq(veri.balanceOf(owner), 10_000_000 * 1e18);
    }

    function test_VERI_mint_owner() public {
        veri.mint(sequencer, 1000 * 1e18);
        assertEq(veri.balanceOf(sequencer), 1100 * 1e18); // 100 from setUp + 1000
    }

    function test_VERI_mint_reverts_non_owner() public {
        vm.prank(sequencer);
        vm.expectRevert();
        veri.mint(sequencer, 1000 * 1e18);
    }

    function test_VERI_max_supply_enforcement() public {
        // Try to mint more than remaining supply
        uint256 remaining = veri.MAX_SUPPLY() - veri.totalSupply();
        vm.expectRevert();
        veri.mint(owner, remaining + 1);
    }

    // ========================
    // AGENT ID TESTS
    // ========================

    function test_AgentID_mint() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("initial_memory");

        uint256 tokenId = agentId.mintAgent(metadata, memoryRoot, 1); // AI type
        assertEq(tokenId, 1);
        assertEq(agentId.ownerOf(1), address(this));
        assertEq(agentId.agentTypes(1), 1);
        assertEq(agentId.memoryRoots(1), memoryRoot);
    }

    function test_AgentID_mint_all_types() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("memory");

        agentId.mintAgent(metadata, memoryRoot, 0); // human
        agentId.mintAgent(metadata, memoryRoot, 1); // AI
        agentId.mintAgent(metadata, memoryRoot, 2); // IoT

        assertEq(agentId.agentTypes(1), 0);
        assertEq(agentId.agentTypes(2), 1);
        assertEq(agentId.agentTypes(3), 2);
    }

    function test_AgentID_invalid_type_reverts() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("memory");

        vm.expectRevert();
        agentId.mintAgent(metadata, memoryRoot, 3); // invalid
    }

    function test_AgentID_updateMemory_owner() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("v1");
        agentId.mintAgent(metadata, memoryRoot, 1);

        bytes32 newRoot = keccak256("v2");
        agentId.updateMemory(1, newRoot);
        assertEq(agentId.memoryRoots(1), newRoot);
    }

    function test_AgentID_updateMemory_authorized() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("v1");
        agentId.mintAgent(metadata, memoryRoot, 1);

        // Authorize sequencer
        agentId.authorizeUsage(1, sequencer);

        // Sequencer can now update memory
        vm.prank(sequencer);
        bytes32 newRoot = keccak256("v2");
        agentId.updateMemory(1, newRoot);
        assertEq(agentId.memoryRoots(1), newRoot);
    }

    function test_AgentID_updateMemory_unauthorized_reverts() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("v1");
        agentId.mintAgent(metadata, memoryRoot, 1);

        vm.prank(challenger); // not authorized
        vm.expectRevert();
        agentId.updateMemory(1, keccak256("v2"));
    }

    function test_AgentID_clone() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("original");
        agentId.mintAgent(metadata, memoryRoot, 2); // IoT

        bytes memory newMetadata = hex"cafebabe";
        bytes32 newMemory = keccak256("cloned");
        uint256 cloneId = agentId.cloneAgent(1, newMetadata, newMemory);

        assertEq(cloneId, 2);
        assertEq(agentId.agentTypes(2), 2); // same type as source
        assertEq(agentId.memoryRoots(2), newMemory);
    }

    function test_AgentID_totalMinted() public {
        bytes memory metadata = hex"deadbeef";
        bytes32 memoryRoot = keccak256("memory");

        agentId.mintAgent(metadata, memoryRoot, 0);
        agentId.mintAgent(metadata, memoryRoot, 1);
        agentId.mintAgent(metadata, memoryRoot, 2);

        assertEq(agentId.totalMinted(), 3);
    }
}

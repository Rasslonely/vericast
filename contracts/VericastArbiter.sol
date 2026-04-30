// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuardTransient.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IVericastArbiter.sol";

/// @title VericastArbiter — Optimistic Settlement with ZK Dispute Resolution
/// @notice Accepts state roots sealed by TEE (gpt-oss-120b), allows dispute via RISC Zero ZK proof
/// @dev UUPS proxy. DISPUTE_WINDOW=150 blocks. MIN_STAKE=1 VERI. STAKE_LOCK=300 blocks.
///      Traceable to: SYSTEM_INTERFACES_internal.md §1.1, Manifest §1.1, §9
contract VericastArbiter is
    IVericastArbiter,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardTransient
{
    /// @notice Dispute window: 150 blocks (~300s at ~2s/block on 0G Chain)
    uint32 public constant DISPUTE_WINDOW = 150;

    /// @notice Minimum stake to open a dispute: 1 VERI token (1e18 wei)
    uint256 public constant MIN_STAKE = 1e18;

    /// @notice Stake lock period: 300 blocks
    uint32 public constant STAKE_LOCK = 300;

    /// @notice RISC Zero verifier contract address
    /// @dev Hackathon fallback: deployer address (mock — always succeeds) [§9]
    address public zkVerifier;

    /// @notice VERI token contract address (for dispute staking)
    address public veriToken;

    /// @notice All state commits by commitId
    mapping(bytes32 => StateCommit) private _commits;

    /// @notice Sequencer (submitter) per commitId
    mapping(bytes32 => address) public sequencers;

    /// @notice Challenger per commitId (who opened the dispute)
    mapping(bytes32 => address) public challengers;

    /// @notice Commit count (for external tracking)
    uint256 public commitCount;

    error CommitAlreadyExists(bytes32 commitId);
    error CommitNotFound(bytes32 commitId);
    error CommitAlreadyFinalized(bytes32 commitId);
    error CommitAlreadyDisputed(bytes32 commitId);
    error CommitStillInDisputeWindow(bytes32 commitId, uint32 disputeEnd);
    error CommitIsDisputed(bytes32 commitId);
    error InsufficientStake(uint256 provided, uint256 required);
    error ZKVerificationFailed(bytes32 commitId);
    error StakeTransferFailed();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the UUPS proxy
    /// @param _owner Contract owner
    /// @param _zkVerifier RISC Zero verifier address (or deployer for hackathon mock)
    /// @param _veriToken VERI token contract address
    function initialize(
        address _owner,
        address _zkVerifier,
        address _veriToken
    ) external initializer {
        __Ownable_init(_owner);
        zkVerifier = _zkVerifier;
        veriToken = _veriToken;
    }

    /// @inheritdoc IVericastArbiter
    function submitStateRoot(
        bytes32 streamId,
        bytes32 key,
        bytes32 stateRoot,
        bytes32 teeSeal,
        bytes32 proofHash
    ) external {
        _submitSingle(streamId, key, stateRoot, teeSeal, proofHash);
    }

    /// @inheritdoc IVericastArbiter
    function batchSubmit(Submission[] calldata subs) external {
        for (uint256 i = 0; i < subs.length; i++) {
            _submitSingle(
                subs[i].streamId,
                subs[i].key,
                subs[i].stateRoot,
                subs[i].teeSeal,
                subs[i].proofHash
            );
        }
    }

    /// @inheritdoc IVericastArbiter
    function dispute(bytes32 commitId, uint256 stake) external nonReentrant {
        StateCommit storage commit = _commits[commitId];
        if (commit.blockHeight == 0) revert CommitNotFound(commitId);
        if (commit.finalized) revert CommitAlreadyFinalized(commitId);
        if (commit.disputed) revert CommitAlreadyDisputed(commitId);
        if (stake < MIN_STAKE) revert InsufficientStake(stake, MIN_STAKE);

        // Transfer VERI stake from challenger
        bool transferred = IERC20(veriToken).transferFrom(msg.sender, address(this), stake);
        if (!transferred) revert StakeTransferFailed();

        commit.disputed = true;
        challengers[commitId] = msg.sender;

        emit DisputeOpened(commitId, msg.sender, stake);
    }

    /// @inheritdoc IVericastArbiter
    function resolveDispute(
        bytes32 commitId,
        bytes calldata seal,
        bytes calldata journal
    ) external nonReentrant {
        StateCommit storage commit = _commits[commitId];
        if (commit.blockHeight == 0) revert CommitNotFound(commitId);
        if (!commit.disputed) revert CommitNotFound(commitId);

        // Call RISC Zero verifier via low-level call (mock-friendly)
        // Signature: verify(bytes seal, bytes journal, bytes32 proofHash)
        (bool success, ) = zkVerifier.call(
            abi.encodeWithSignature(
                "verify(bytes,bytes,bytes32)",
                seal,
                journal,
                commit.proofHash
            )
        );

        if (success) {
            // Original submission was valid — slash challenger
            // Burn the challenger's stake
            IERC20(veriToken).transfer(address(0xdead), MIN_STAKE);
            commit.disputed = false;
            emit DisputeResolved(commitId, true, msg.sender);
        } else {
            // Original submission was invalid — refund challenger, delete commit
            address challenger = challengers[commitId];
            IERC20(veriToken).transfer(challenger, MIN_STAKE);
            delete _commits[commitId];
            delete sequencers[commitId];
            delete challengers[commitId];
            emit DisputeResolved(commitId, false, msg.sender);
        }
    }

    /// @inheritdoc IVericastArbiter
    function finalize(bytes32 commitId) external {
        StateCommit storage commit = _commits[commitId];
        if (commit.blockHeight == 0) revert CommitNotFound(commitId);
        if (commit.finalized) revert CommitAlreadyFinalized(commitId);
        if (commit.disputed) revert CommitIsDisputed(commitId);
        if (block.number < commit.disputeEnd) {
            revert CommitStillInDisputeWindow(commitId, commit.disputeEnd);
        }

        commit.finalized = true;
        emit StateFinalized(commitId);
    }

    /// @inheritdoc IVericastArbiter
    function getCommit(bytes32 commitId) external view returns (StateCommit memory) {
        return _commits[commitId];
    }

    /// @inheritdoc IVericastArbiter
    function isFinalized(bytes32 commitId) external view returns (bool) {
        return _commits[commitId].finalized;
    }

    // ========================
    // INTERNAL
    // ========================

    /// @dev Submit a single state root
    function _submitSingle(
        bytes32 streamId,
        bytes32 key,
        bytes32 stateRoot,
        bytes32 teeSeal,
        bytes32 proofHash
    ) internal {
        bytes32 commitId = keccak256(
            abi.encodePacked(streamId, key, stateRoot, block.number)
        );

        if (_commits[commitId].blockHeight != 0) {
            revert CommitAlreadyExists(commitId);
        }

        _commits[commitId] = StateCommit({
            stateRoot: stateRoot,
            teeSeal: teeSeal,
            proofHash: proofHash,
            blockHeight: uint64(block.number),
            disputeEnd: uint32(block.number + DISPUTE_WINDOW),
            disputed: false,
            finalized: false
        });

        sequencers[commitId] = msg.sender;
        commitCount++;

        emit StateSubmitted(commitId, stateRoot, teeSeal, msg.sender);
    }

    /// @dev UUPS upgrade authorization — owner only
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

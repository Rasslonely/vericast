// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title IVericastArbiter — Canonical interface for Vericast Omega settlement
/// @notice Defines the optimistic settlement protocol with ZK dispute resolution
/// @dev Traceable to: SYSTEM_INTERFACES_internal.md §1.1
///      Constants: MIN_STAKE=1e18, DISPUTE_WINDOW=150 blocks (~300s), STAKE_LOCK=300 blocks
interface IVericastArbiter {
    /// @notice Batch submission payload
    struct Submission {
        bytes32 streamId;    // Stream category identifier (game/social/depin)
        bytes32 key;         // State key within stream
        bytes32 stateRoot;   // SHA256 of canonical state
        bytes32 teeSeal;     // X-TEE-Signature from gpt-oss-120b [§4.3]
        bytes32 proofHash;   // RISC Zero journal hash [§9]
    }

    /// @notice On-chain state commitment record
    struct StateCommit {
        bytes32 stateRoot;   // SHA256 of canonical state
        bytes32 teeSeal;     // X-TEE-Signature from gpt-oss-120b [§4.3]
        bytes32 proofHash;   // RISC Zero journal hash [§9]
        uint64 blockHeight;  // Block number at submission
        uint32 disputeEnd;   // block.timestamp + DISPUTE_WINDOW (150 blocks)
        bool disputed;       // Whether a dispute has been opened
        bool finalized;      // Whether state has been finalized
    }

    /// @notice Emitted when a new state root is submitted
    event StateSubmitted(bytes32 indexed commitId, bytes32 stateRoot, bytes32 teeSeal, address indexed sequencer);
    /// @notice Emitted when a dispute is opened against a commit
    event DisputeOpened(bytes32 indexed commitId, address indexed challenger, uint256 stake);
    /// @notice Emitted when a dispute is resolved via ZK proof
    event DisputeResolved(bytes32 indexed commitId, bool valid, address indexed resolver);
    /// @notice Emitted when a commit is finalized after dispute window
    event StateFinalized(bytes32 indexed commitId);

    /// @notice Initialize the UUPS proxy (called once)
    function initialize(address _owner, address _zkVerifier, address _veriToken) external;

    /// @notice Submit a single state root with TEE seal and proof hash
    function submitStateRoot(bytes32 streamId, bytes32 key, bytes32 stateRoot, bytes32 teeSeal, bytes32 proofHash) external;

    /// @notice Open a dispute against a pending commit. Requires MIN_STAKE (1 VERI) approval.
    function dispute(bytes32 commitId, uint256 stake) external;

    /// @notice Resolve a dispute using RISC Zero ZK proof
    function resolveDispute(bytes32 commitId, bytes calldata seal, bytes calldata journal) external;

    /// @notice Finalize a commit after DISPUTE_WINDOW expires without dispute
    function finalize(bytes32 commitId) external;

    /// @notice Submit multiple state roots in a single transaction
    function batchSubmit(Submission[] calldata subs) external;

    /// @notice Get a commit record by ID
    function getCommit(bytes32 commitId) external view returns (StateCommit memory);

    /// @notice Check if a commit has been finalized
    function isFinalized(bytes32 commitId) external view returns (bool);
}

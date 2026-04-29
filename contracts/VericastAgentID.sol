// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

/// @title VericastAgentID — ERC-7857 Transferable Encrypted NFT for Agent Identity
/// @notice Implements iNFT standard with encrypted metadata (AES-256-GCM)
/// @dev UUPS proxy pattern. MAX_SUPPLY: 10,000. agentType: 0=human, 1=AI, 2=IoT
///      Traceable to: SYSTEM_INTERFACES_internal.md §1.2, Manifest §5
contract VericastAgentID is ERC721Upgradeable, UUPSUpgradeable, OwnableUpgradeable {
    /// @notice Maximum number of agent NFTs
    uint256 public constant MAX_SUPPLY = 10_000;

    /// @notice Next token ID to mint (starts at 1)
    uint256 private _nextTokenId;

    /// @notice Encrypted metadata per token (AES-256-GCM: iv + authTag + ciphertext)
    mapping(uint256 => bytes) public encryptedMetadata;

    /// @notice Memory root hash per token (Merkle root of agent memory)
    mapping(uint256 => bytes32) public memoryRoots;

    /// @notice Agent type per token: 0=human, 1=AI, 2=IoT
    mapping(uint256 => uint8) public agentTypes;

    /// @notice Usage authorization: tokenId => user => authorized
    mapping(uint256 => mapping(address => bool)) public usageAuthorized;

    error MaxSupplyReached();
    error InvalidAgentType(uint8 agentType);
    error NotOwnerOrAuthorized(uint256 tokenId, address caller);
    error TokenDoesNotExist(uint256 tokenId);

    event AgentMinted(uint256 indexed tokenId, address indexed owner, uint8 agentType, bytes32 memoryRoot);
    event AgentCloned(uint256 indexed sourceId, uint256 indexed newId, address indexed owner);
    event MemoryUpdated(uint256 indexed tokenId, bytes32 oldRoot, bytes32 newRoot);
    event UsageAuthorized(uint256 indexed tokenId, address indexed user, bool authorized);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initialize the UUPS proxy
    /// @param initialOwner Contract owner (can upgrade, no special mint privileges)
    function initialize(address initialOwner) external initializer {
        __ERC721_init("Vericast Agent ID", "VAGENT");
        __Ownable_init(initialOwner);
        _nextTokenId = 1;
    }

    /// @notice Mint a new agent NFT with encrypted metadata
    /// @param encryptedData AES-256-GCM encrypted metadata (iv + authTag + ciphertext)
    /// @param memoryRoot Initial Merkle root of agent memory state
    /// @param agentType 0=human, 1=AI, 2=IoT
    /// @return tokenId The newly minted token ID
    function mintAgent(
        bytes calldata encryptedData,
        bytes32 memoryRoot,
        uint8 agentType
    ) external returns (uint256) {
        if (_nextTokenId > MAX_SUPPLY) revert MaxSupplyReached();
        if (agentType > 2) revert InvalidAgentType(agentType);

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        encryptedMetadata[tokenId] = encryptedData;
        memoryRoots[tokenId] = memoryRoot;
        agentTypes[tokenId] = agentType;

        emit AgentMinted(tokenId, msg.sender, agentType, memoryRoot);
        return tokenId;
    }

    /// @notice Clone an existing agent with re-encrypted data and new memory
    /// @param tokenId Source agent to clone
    /// @param reEncryptedData New AES-256-GCM encrypted metadata for the clone
    /// @param newMemoryRoot Memory root for the cloned agent
    /// @return newTokenId The cloned token ID
    function cloneAgent(
        uint256 tokenId,
        bytes calldata reEncryptedData,
        bytes32 newMemoryRoot
    ) external returns (uint256) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (_nextTokenId > MAX_SUPPLY) revert MaxSupplyReached();

        uint256 newTokenId = _nextTokenId++;
        _safeMint(msg.sender, newTokenId);

        encryptedMetadata[newTokenId] = reEncryptedData;
        memoryRoots[newTokenId] = newMemoryRoot;
        agentTypes[newTokenId] = agentTypes[tokenId];

        emit AgentCloned(tokenId, newTokenId, msg.sender);
        return newTokenId;
    }

    /// @notice Update the memory root of an agent. Owner or authorized only.
    /// @param tokenId The agent token to update
    /// @param newRoot New Merkle root of agent memory
    function updateMemory(uint256 tokenId, bytes32 newRoot) external {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender && !usageAuthorized[tokenId][msg.sender]) {
            revert NotOwnerOrAuthorized(tokenId, msg.sender);
        }

        bytes32 oldRoot = memoryRoots[tokenId];
        memoryRoots[tokenId] = newRoot;

        emit MemoryUpdated(tokenId, oldRoot, newRoot);
    }

    /// @notice Authorize or revoke usage rights for an address. Owner only.
    /// @param tokenId The agent token
    /// @param user Address to authorize/revoke
    function authorizeUsage(uint256 tokenId, address user) external {
        if (ownerOf(tokenId) != msg.sender) {
            revert NotOwnerOrAuthorized(tokenId, msg.sender);
        }

        bool newAuth = !usageAuthorized[tokenId][user];
        usageAuthorized[tokenId][user] = newAuth;

        emit UsageAuthorized(tokenId, user, newAuth);
    }

    /// @notice Total number of agents minted so far
    function totalMinted() external view returns (uint256) {
        return _nextTokenId - 1;
    }

    /// @dev UUPS upgrade authorization — owner only
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}
}

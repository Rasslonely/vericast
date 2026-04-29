// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title VERI Token — Vericast Omega Utility Token
/// @notice ERC20 + Burnable + Ownable. Non-upgradeable.
/// @dev MAX_SUPPLY: 100M tokens. Initial mint: 10M to deployer.
///      Used for staking in VericastArbiter dispute mechanism.
contract VERI is ERC20, ERC20Burnable, Ownable {
    /// @notice Maximum token supply: 100,000,000 VERI (with 18 decimals)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;

    /// @notice Initial mint to deployer: 10,000,000 VERI
    uint256 public constant INITIAL_MINT = 10_000_000 * 1e18;

    error ExceedsMaxSupply(uint256 requested, uint256 available);

    /// @param initialOwner Address that receives initial mint and owns mint rights
    constructor(address initialOwner)
        ERC20("VERI Token", "VERI")
        Ownable(initialOwner)
    {
        _mint(initialOwner, INITIAL_MINT);
    }

    /// @notice Mint new tokens. Only owner. Reverts if MAX_SUPPLY exceeded.
    /// @param to Recipient address
    /// @param amount Amount to mint (in wei, 18 decimals)
    function mint(address to, uint256 amount) external onlyOwner {
        if (totalSupply() + amount > MAX_SUPPLY) {
            revert ExceedsMaxSupply(amount, MAX_SUPPLY - totalSupply());
        }
        _mint(to, amount);
    }
}

# VERICAST OMEGA — TESTNET (GALILEO) MIGRATION ANALYSIS

**ANALYSIS DATE:** 2026-05-14
**TARGET:** 0G Galileo Testnet (Chain ID 16602)
**RATIONALE:** User specified lack of 0G mainnet balance. Shifting all infrastructure deployments to testnet.

## 1. INFRASTRUCTURE PIVOT POINTS
To successfully execute on Testnet without touching Mainnet, the following modifications to the architecture are locked in for all execution phases:

### A. Blockchain & Contracts
- **Chain ID:** `16602` (was 16661)
- **RPC Endpoint:** `https://evmrpc-testnet.0g.ai` (was `https://evmrpc.0g.ai`)
- **Block Explorer:** `https://chainscan-galileo.0g.ai` (was `https://chainscan.0g.ai`)
- **Faucet:** Testnet OG can be acquired at `https://faucet.0g.ai`

### B. Backend & Integration
- **Storage/DA:** The Turbo Indexer (`https://indexer-storage-turbo.0g.ai`) supports testnet/mainnet agnostic blobs.
- **Compute (TEE):** Inference proxy (`https://inference.0g.ai`) supports requests regardless of the underlying EVM network as long as the provider address (`0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6` or `0x69Eb5a0BD7d0f4bF39eD5CE9Bd3376c61863aE08`) is funded. If compute requires mainnet OG, we must strictly rely on the fallback mock (mock_seal) or acquire minimal mainnet OG strictly for the broker.
- **KV Storage:** Rest API fallback and in-memory tiers remain unaffected by EVM selection.

### C. Frontend & UI
- **Explorer Links:** All dynamic explorer links must point to `https://chainscan-galileo.0g.ai/tx/{hash}`.
- **Wallet Connection:** Ethers.js MUST enforce network 16602.

## 2. PHASE ALIGNMENT
- **SKIP Phase 7:** "Mainnet Migration" is completely bypassed.
- **ADAPT Phase 6:** "Real Integration — Testnet First" becomes the terminal deployment phase.
- **ADAPT Phase 8:** "Submission Package" will be updated to point to Testnet explorer links and Testnet contract addresses.

## 3. EXECUTION LOCK
As the Apex Execution Node, all future code generation commands for contracts, backend, and frontend will implicitly inject the **Testnet parameters** above, overriding the `VERICAST_OMEGA_Build_Spec.md` mainnet instructions.

"""
ChainClient — 0G Chain On-Chain Settlement
Calls VericastArbiter.submitStateRoot() after every pipeline run.
"""

import json
import logging
import os

from eth_account import Account
from web3 import Web3

logger = logging.getLogger("vericast.chain")

# ABI fragments for VericastArbiter
ARBITER_ABI = [
    {
        "inputs": [
            {"name": "streamId", "type": "bytes32"},
            {"name": "key", "type": "bytes32"},
            {"name": "stateRoot", "type": "bytes32"},
            {"name": "teeSeal", "type": "bytes32"},
            {"name": "proofHash", "type": "bytes32"},
        ],
        "name": "submitStateRoot",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
    {
        "inputs": [{"name": "", "type": "address"}],
        "name": "sequencerStakes",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"name": "commitId", "type": "bytes32"}],
        "name": "getCommit",
        "outputs": [
            {
                "components": [
                    {"name": "stateRoot", "type": "bytes32"},
                    {"name": "teeSeal", "type": "bytes32"},
                    {"name": "proofHash", "type": "bytes32"},
                    {"name": "blockHeight", "type": "uint64"},
                    {"name": "disputeEnd", "type": "uint32"},
                    {"name": "disputed", "type": "bool"},
                    {"name": "finalized", "type": "bool"},
                ],
                "name": "",
                "type": "tuple",
            }
        ],
        "stateMutability": "view",
        "type": "function",
    },
]


class ChainClient:
    """On-chain settlement via VericastArbiter on 0G Chain."""

    def __init__(self):
        self.rpc = os.environ.get("BLOCKCHAIN_RPC", "https://evmrpc.0g.ai")
        self.private_key = os.environ.get("PRIVATE_KEY", "")
        self._w3 = None
        self._account = None
        self._arbiter = None
        self._connected = False

    async def connect(self) -> None:
        """Load deployment.json and connect to 0G Chain."""
        try:
            self._w3 = Web3(Web3.HTTPProvider(self.rpc))
            self._account = Account.from_key(self.private_key)

            # Load deployment.json for contract addresses
            deployment_path = os.path.join(
                os.path.dirname(__file__), "..", "deployment.json"
            )
            if not os.path.exists(deployment_path):
                deployment_path = os.path.join(
                    os.path.dirname(__file__), "deployment.json"
                )

            with open(deployment_path) as f:
                deployment = json.load(f)

            arbiter_addr = deployment["contracts"]["VericastArbiter"]
            self._arbiter = self._w3.eth.contract(
                address=Web3.to_checksum_address(arbiter_addr),
                abi=ARBITER_ABI,
            )

            chain_id = self._w3.eth.chain_id
            balance = self._w3.eth.get_balance(self._account.address)
            logger.info(
                f"ChainClient connected: chain={chain_id}, "
                f"arbiter={arbiter_addr}, balance={Web3.from_wei(balance, 'ether')} OG"
            )
            self._connected = True

        except Exception as e:
            logger.error(f"ChainClient connect failed: {e}")
            self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def submit_state_root(
        self,
        stream_id: str,
        key: str,
        state_root: str,
        tee_seal: str,
        proof_hash: str,
    ) -> dict:
        """Submit state root to VericastArbiter on 0G Chain.

        Returns: {tx_hash, explorer_link, block_number}
        """
        if not self._connected:
            logger.warning("ChainClient not connected — skipping on-chain settlement")
            return {"tx_hash": None, "explorer_link": None}

        try:
            # Convert string identifiers to bytes32
            stream_bytes = Web3.keccak(text=stream_id)
            key_bytes = Web3.keccak(text=key)
            root_bytes = bytes.fromhex(state_root[2:]) if state_root.startswith("0x") else Web3.keccak(text=state_root)
            seal_bytes = Web3.keccak(text=tee_seal) if tee_seal else b'\x00' * 32
            proof_bytes = Web3.keccak(text=proof_hash) if proof_hash else b'\x00' * 32

            # Pad to 32 bytes if needed
            root_bytes = root_bytes.ljust(32, b'\x00')[:32]

            # Build transaction
            nonce = self._w3.eth.get_transaction_count(self._account.address)
            tx = self._arbiter.functions.submitStateRoot(
                stream_bytes, key_bytes, root_bytes, seal_bytes, proof_bytes
            ).build_transaction({
                "from": self._account.address,
                "nonce": nonce,
                "gasPrice": self._w3.eth.gas_price,
                "gas": 200_000,  # submitStateRoot is ~45k gas
            })

            # Sign and send
            signed = self._w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self._w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self._w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)

            tx_hash_hex = receipt.transactionHash.hex()
            if not tx_hash_hex.startswith("0x"):
                tx_hash_hex = f"0x{tx_hash_hex}"

            explorer_base = os.environ.get("EXPLORER_BASE_URL", "https://chainscan.0g.ai")
            explorer_link = f"{explorer_base}/tx/{tx_hash_hex}"

            logger.info(f"On-chain settlement OK: {tx_hash_hex} (block {receipt.blockNumber})")

            return {
                "tx_hash": tx_hash_hex,
                "explorer_link": explorer_link,
                "block_number": receipt.blockNumber,
            }

        except Exception as e:
            logger.error(f"On-chain settlement failed: {e}")
            return {"tx_hash": None, "explorer_link": None, "error": str(e)}

    async def disconnect(self) -> None:
        self._connected = False
        logger.info("ChainClient disconnected")

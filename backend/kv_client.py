"""
KVClient — 0G KV Runtime Client (PATCHED: 2-Tier Fallback)
⚠️ CRITICAL FIX: REST tier REMOVED — kv-node.0g.ai/api/v1/put is undocumented
Tier 1: StorageKv SDK (0g-storage-sdk==0.3.0)
Tier 2: In-memory dict (volatile, demo-only) + idempotency key
"""

import asyncio
import hashlib
import json
import logging
import os

logger = logging.getLogger("vericast.kv")

_memory_cache: dict[str, str] = {}
_idempotency_set: set[str] = set()  # SHA256 keys to prevent double-write


class KVClient:
    """0G KV client — 2-tier fallback (SDK → in-memory)."""

    STREAM_ID = "vericast_state_v1"

    def __init__(self, kv_node_url: str | None = None, indexer_rpc: str | None = None,
                 blockchain_rpc: str | None = None, private_key: str | None = None):
        self.kv_node_url = kv_node_url or os.environ.get("KV_NODE_URL", "https://kv-node.0g.ai")
        self.indexer_rpc = indexer_rpc or os.environ.get("INDEXER_RPC", "https://indexer-storage-turbo.0g.ai")
        self.blockchain_rpc = blockchain_rpc or os.environ.get("BLOCKCHAIN_RPC", "https://evmrpc.0g.ai")
        self.private_key = private_key or os.environ.get("PRIVATE_KEY", "")
        self._kv_node = None
        self._connected = False
        self._tier = "none"

    async def connect(self) -> None:
        try:
            from zerog_storage_python import Indexer
            from zerog_storage_python import StorageKv
            from eth_account import Account

            signer = Account.from_key(self.private_key)
            indexer = Indexer(self.indexer_rpc)
            self._kv_node = StorageKv(node_url=self.kv_node_url, indexer=indexer, signer=signer)
            self._connected = True
            self._tier = "sdk"
            logger.info(f"KVClient Tier 1 (SDK) connected: {self.kv_node_url}")
        except Exception as e:
            logger.warning(f"KVClient SDK failed: {e} — in-memory fallback active")
            self._connected = True
            self._tier = "inmemory"

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def active_tier(self) -> str:
        return self._tier

    async def put(self, key: str, value: dict) -> str:
        # Idempotency check
        idem_key = hashlib.sha256(f"{key}:{json.dumps(value, sort_keys=True)}".encode()).hexdigest()
        if idem_key in _idempotency_set:
            logger.info(f"KV idempotent skip: {key}")
            return f"idempotent_{key}"
        _idempotency_set.add(idem_key)

        # Tier 1: SDK
        if self._kv_node and self._tier == "sdk":
            try:
                for attempt, wait in enumerate([0.5, 1.0]):
                    try:
                        await self._kv_node.put(stream_id=self.STREAM_ID, key=key, value=json.dumps(value, sort_keys=True))
                        logger.info(f"KV SDK put OK: {key}")
                        return f"sdk_ok_{key}"
                    except Exception as e:
                        if attempt == 0:
                            await asyncio.sleep(wait)
                        else:
                            raise
            except Exception as e:
                logger.warning(f"KV SDK exhausted: {e}")
                self._tier = "inmemory"

        # Tier 2: In-memory
        _memory_cache[key] = json.dumps(value)
        self._tier = "inmemory"
        logger.warning(f"KV in-memory: {key}")
        return f"inmemory_{key}"

    async def batch_put(self, entries: list[dict]) -> str:
        results = [await self.put(e["key"], e["value"]) for e in entries]
        return results[-1] if results else ""

    async def get(self, key: str) -> dict | None:
        if self._kv_node and self._tier == "sdk":
            try:
                raw = await self._kv_node.get(stream_id=self.STREAM_ID, key=key)
                return json.loads(raw) if raw else None
            except Exception:
                pass
        cached = _memory_cache.get(key)
        return json.loads(cached) if cached else None

    async def disconnect(self) -> None:
        self._connected = False
        self._kv_node = None
        self._tier = "none"

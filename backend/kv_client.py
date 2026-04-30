"""
KVClient — 0G KV Runtime Client with 3-Tier Fallback
Traceable to: SYSTEM_INTERFACES_internal.md §3.2, SYSTEM_INTERFACES_external.md §3.1
⚠️ FALLBACK_REQUIRED: kv-node.0g.ai is PROBED [Manifest §3.1]
"""

import asyncio
import json
import logging
import os
from typing import Any

import aiohttp
from eth_account import Account

logger = logging.getLogger("vericast.kv")


class KVUnavailableError(Exception):
    """Raised when ALL KV tiers (SDK, REST, in-memory) fail."""
    pass


# Tier 3: In-memory fallback (last resort for demo)
_memory_cache: dict[str, str] = {}


class KVClient:
    """0G KV client with 3-tier fallback cascade.

    Tier 1: StorageKv SDK (0g-storage-sdk==0.3.0) [§2.3]
    Tier 2: REST API (POST kv-node.0g.ai/api/v1/put) [§3.1]
    Tier 3: In-memory dict (volatile, demo-only)
    """

    STREAM_ID = "vericast_state_v1"  # [ENV_REGISTRY §3]

    def __init__(
        self,
        kv_node_url: str | None = None,
        indexer_rpc: str | None = None,
        blockchain_rpc: str | None = None,
        private_key: str | None = None,
    ):
        self.kv_node_url = kv_node_url or os.environ.get("KV_NODE_URL", "https://kv-node.0g.ai")
        self.indexer_rpc = indexer_rpc or os.environ.get("INDEXER_RPC", "https://indexer-storage-turbo.0g.ai")
        self.blockchain_rpc = blockchain_rpc or os.environ.get("BLOCKCHAIN_RPC", "https://evmrpc.0g.ai")
        self.private_key = private_key or os.environ.get("PRIVATE_KEY", "")
        self.kv_api_key = os.environ.get("KV_API_KEY", "")
        self._kv_node = None
        self._connected = False
        self._tier = "none"  # Tracks active tier for health reporting

    async def connect(self) -> None:
        """Initialize StorageKv SDK connection (Tier 1).
        If SDK fails to connect, client still works via REST/in-memory fallback.
        """
        try:
            from zg_storage_sdk import Indexer
            from zg_storage_sdk.core.kv import StorageKv

            signer = Account.from_key(self.private_key)
            indexer = Indexer(self.indexer_rpc)
            self._kv_node = StorageKv(
                node_url=self.kv_node_url,
                indexer=indexer,
                signer=signer,
            )
            self._connected = True
            self._tier = "sdk"
            logger.info(f"KVClient Tier 1 (SDK) connected: {self.kv_node_url}")
        except Exception as e:
            logger.warning(f"KVClient Tier 1 (SDK) failed: {e} — REST/in-memory fallback active")
            self._connected = True  # Still "connected" via fallback tiers
            self._tier = "rest"

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def active_tier(self) -> str:
        return self._tier

    async def put(self, key: str, value: dict) -> str:
        """Write key-value pair. 3-tier cascade: SDK → REST → in-memory.

        Returns: tx_hash or fallback identifier.
        """
        # Tier 1: StorageKv SDK
        if self._kv_node and self._tier == "sdk":
            try:
                result = await self._sdk_put_with_retry(key, value)
                return result
            except Exception as e:
                logger.warning(f"KV Tier 1 (SDK) put failed: {e}")
                self._tier = "rest"

        # Tier 2+3: REST → In-memory
        return await self._fallback_put(key, value)

    async def batch_put(self, entries: list[dict]) -> str:
        """Batch write. Falls through same cascade.

        entries: [{"key": str, "value": dict}, ...]
        """
        results = []
        for entry in entries:
            result = await self.put(entry["key"], entry["value"])
            results.append(result)
        return results[-1] if results else ""

    async def get(self, key: str) -> dict | None:
        """Read key. 3-tier cascade: SDK → REST → in-memory."""
        # Tier 1: StorageKv SDK
        if self._kv_node and self._tier == "sdk":
            try:
                raw = await self._kv_node.get(stream_id=self.STREAM_ID, key=key)
                return json.loads(raw) if raw else None
            except Exception as e:
                logger.warning(f"KV Tier 1 (SDK) get failed: {e}")

        # Tier 2+3: REST → In-memory
        return await self._fallback_get(key)

    async def disconnect(self) -> None:
        """Cleanup."""
        self._connected = False
        self._kv_node = None
        self._tier = "none"
        logger.info("KVClient disconnected")

    # ========================================
    # TIER 1: SDK with retry
    # ========================================

    async def _sdk_put_with_retry(self, key: str, value: dict) -> str:
        """Tier 1: StorageKv SDK put with linear retry (500ms, 1s)."""
        backoff = [0.5, 1.0]
        last_error = None

        for attempt in range(len(backoff)):
            try:
                await self._kv_node.put(
                    stream_id=self.STREAM_ID,
                    key=key,
                    value=json.dumps(value, sort_keys=True),
                )
                logger.info(f"KV SDK put OK: {key}")
                return f"sdk_ok_{key}"
            except Exception as e:
                last_error = e
                if attempt < len(backoff) - 1:
                    await asyncio.sleep(backoff[attempt])
                    logger.warning(f"KV SDK put retry {attempt + 1}: {e}")

        raise last_error  # type: ignore

    # ========================================
    # TIER 2: REST API fallback
    # ========================================

    async def _fallback_put(self, key: str, value: dict) -> str:
        """Tier 2 (REST) → Tier 3 (in-memory) cascade."""
        # Tier 2: REST API
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=5)
            ) as session:
                async with session.post(
                    f"{self.kv_node_url}/api/v1/put",
                    json={
                        "stream_id": self.STREAM_ID,
                        "key": key,
                        "value": json.dumps(value),
                    },
                    headers={"X-API-Key": self.kv_api_key},
                ) as resp:
                    if resp.status == 200:
                        result = await resp.json()
                        self._tier = "rest"
                        logger.info(f"KV REST put OK: {key}")
                        return result.get("tx_hash", "rest_ok")
                    else:
                        logger.warning(f"KV REST failed: HTTP {resp.status}")
        except Exception as e:
            logger.warning(f"KV REST unreachable: {e}")

        # Tier 3: In-memory (volatile)
        _memory_cache[key] = json.dumps(value)
        self._tier = "inmemory"
        logger.warning(f"KV in-memory fallback used for: {key}")
        return f"inmemory_{key}"

    async def _fallback_get(self, key: str) -> dict | None:
        """Tier 2 (REST) → Tier 3 (in-memory) cascade for reads."""
        # Tier 2: REST API
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=5)
            ) as session:
                async with session.get(
                    f"{self.kv_node_url}/api/v1/get",
                    params={"stream_id": self.STREAM_ID, "key": key},
                    headers={"X-API-Key": self.kv_api_key},
                ) as resp:
                    if resp.status == 200:
                        return await resp.json()
        except Exception:
            pass

        # Tier 3: In-memory
        cached = _memory_cache.get(key)
        return json.loads(cached) if cached else None

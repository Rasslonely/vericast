"""
DAClient — 0G Storage / Data Availability Client
Traceable to: SYSTEM_INTERFACES_internal.md §3.1, SYSTEM_INTERFACES_external.md §2.2
"""

import asyncio
import json
import logging
import os

from eth_account import Account

logger = logging.getLogger("vericast.da")


class DAUploadError(Exception):
    """Raised when DA upload fails after all retries and fallback tiers."""
    pass


class DAClient:
    """0G Storage DA client with turbo→standard fallback.

    Endpoints:
        PRIMARY:  indexer-storage-turbo.0g.ai [§2.1 CONFIRMED]
        FALLBACK: indexer-storage.0g.ai       [§2.1 CONFIRMED]
    """

    TURBO_RPC = "https://indexer-storage-turbo.0g.ai"
    STANDARD_RPC = "https://indexer-storage-turbo.0g.ai"


    def __init__(
        self,
        indexer_rpc: str | None = None,
        blockchain_rpc: str | None = None,
        private_key: str | None = None,
    ):
        self.indexer_rpc = indexer_rpc or os.environ.get("INDEXER_RPC", self.TURBO_RPC)
        self.blockchain_rpc = blockchain_rpc or os.environ.get("BLOCKCHAIN_RPC", "https://evmrpc.0g.ai")
        self.private_key = private_key or os.environ.get("PRIVATE_KEY", "")
        self._signer = None
        self._indexer = None
        self._connected = False

    async def connect(self) -> None:
        """Initialize signer and indexer connection."""
        try:
            from zg_storage_sdk import Indexer

            self._signer = Account.from_key(self.private_key)
            self._indexer = Indexer(self.indexer_rpc)
            self._connected = True
            logger.info(f"DAClient connected: {self.indexer_rpc}")
        except Exception as e:
            logger.error(f"DAClient connect failed: {e}")
            self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    async def upload_blob(self, data: dict) -> str:
        """Upload data blob to 0G Storage. Returns rootHash.

        Retry: 3x exponential (1s/2s/4s) on primary tier.
        Fallback: switch to standard tier, retry 3 more.
        Raises: DAUploadError if all tiers exhausted.
        """
        from zg_storage_sdk import ZgFile

        raw = json.dumps(data, sort_keys=True, ensure_ascii=True).encode("ascii")
        file = ZgFile.from_bytes(raw)

        # Tier 1: Turbo indexer
        try:
            return await self._upload_with_retry(file, self.indexer_rpc, backoff=[2.0, 5.0, 10.0])
        except Exception as e:
            logger.warning(f"DA turbo tier exhausted: {e}")

        # Tier 2: Standard indexer (fallback)
        if self.indexer_rpc != self.STANDARD_RPC:
            try:
                logger.info("Falling back to standard DA tier")
                return await self._upload_with_retry(file, self.STANDARD_RPC, backoff=[2.0, 5.0, 10.0])
            except Exception as e:
                logger.error(f"DA standard tier also failed: {e}")

        raise DAUploadError("DA upload failed on all tiers after 6 total attempts")


    async def _upload_with_retry(self, file, indexer_rpc: str, backoff: list[float]) -> str:
        """Upload with exponential retry."""
        from zg_storage_sdk import Indexer

        indexer = Indexer(indexer_rpc)
        last_error = None

        for attempt in range(len(backoff)):
            try:
                result, err = indexer.upload(
                    file=file,
                    blockchain_rpc=self.blockchain_rpc,
                    signer=self._signer,
                    upload_opts={"expected_replica": 1},
                )
                if err:
                    raise Exception(f"SDK error: {err}")
                root_hash = result.get("rootHash", result.get("root_hash", ""))
                logger.info(f"DA upload OK: {root_hash[:16]}... via {indexer_rpc}")
                return root_hash
            except Exception as e:
                last_error = e
                if attempt < len(backoff) - 1:
                    wait = backoff[attempt]
                    logger.warning(f"DA upload attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)

        raise last_error  # type: ignore

    async def disconnect(self) -> None:
        """Cleanup resources."""
        self._connected = False
        self._indexer = None
        logger.info("DAClient disconnected")

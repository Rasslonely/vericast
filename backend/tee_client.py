"""
TEEClient — 0G Compute TEE Inference Client
Traceable to: SYSTEM_INTERFACES_internal.md §3.3, SYSTEM_INTERFACES_external.md §4
⚠️ LOCKED MODEL: gpt-oss-120b ONLY [Manifest §4.3]
⚠️ FORBIDDEN: gemma-3-27b or any other model
"""

import asyncio
import json
import logging
import os
import time

import aiohttp
from eth_account import Account
from eth_account.messages import encode_defunct

logger = logging.getLogger("vericast.tee")

# ⚠️ MODEL LOCK — Non-negotiable
LOCKED_MODEL = "gpt-oss-120b"
FORBIDDEN_MODELS = {"gemma-3-27b", "gemma-2-27b", "gpt-4", "gpt-4o", "claude-3"}


class TEEInferenceError(Exception):
    """Raised when TEE inference fails after all retries."""
    pass


class TEEClient:
    """0G Compute TEE inference client.

    Endpoint: https://inference.0g.ai/v1/proxy/chat/completions [§4.1]
    Model:    gpt-oss-120b (LOCKED) [§4.3]
    TEE Type: TeeML (Intel TDX + NVIDIA H100) — NOT TeeTLS
    """

    ENDPOINT = "https://inference.0g.ai/v1/proxy/chat/completions"

    def __init__(self, private_key: str | None = None):
        self.private_key = private_key or os.environ.get("PRIVATE_KEY", "")
        self._account = None
        self._connected = False
        self._tee_count = 0  # Total TEE verifications for health badge

    async def connect(self) -> None:
        """Initialize signer account."""
        try:
            self._account = Account.from_key(self.private_key)
            self._connected = True
            logger.info(f"TEEClient connected: signer={self._account.address}")
        except Exception as e:
            logger.error(f"TEEClient connect failed: {e}")
            self._connected = False

    @property
    def is_connected(self) -> bool:
        return self._connected

    @property
    def tee_count(self) -> int:
        return self._tee_count

    async def infer(self, prompt: str, model: str = LOCKED_MODEL) -> dict:
        """Run TEE-attested inference.

        Args:
            prompt: Input text for the model
            model: MUST be "gpt-oss-120b" (enforced)

        Returns:
            {response: str, signature: str, model: str, provider: str}

        On failure: returns mock seal (never crashes).
        """
        # MODEL LOCK ENFORCEMENT
        if model != LOCKED_MODEL or model in FORBIDDEN_MODELS:
            logger.error(f"MODEL LOCK VIOLATION: attempted model={model}, forcing {LOCKED_MODEL}")
            model = LOCKED_MODEL

        # Retry: 2 attempts, linear backoff 1s→3s
        backoff = [1.0, 3.0]
        last_error = None

        for attempt in range(len(backoff)):
            try:
                result = await self._call_inference(prompt, model)
                self._tee_count += 1
                return result
            except Exception as e:
                last_error = e
                if attempt < len(backoff) - 1:
                    wait = backoff[attempt]
                    logger.warning(f"TEE inference attempt {attempt + 1} failed, retrying in {wait}s: {e}")
                    await asyncio.sleep(wait)

        # FALLBACK: mock seal
        logger.warning(f"TEE inference exhausted after {len(backoff)} attempts: {last_error}")
        return {
            "response": "",
            "signature": "mock_seal",
            "model": LOCKED_MODEL,
            "provider": "fallback",
        }

    async def _call_inference(self, prompt: str, model: str) -> dict:
        """Execute a single TEE inference call."""
        headers = await self._get_headers(prompt)
        body = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.3,
            "max_tokens": 256,
        }

        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30)
        ) as session:
            async with session.post(
                self.ENDPOINT,
                json=body,
                headers=headers,
            ) as resp:
                if resp.status != 200:
                    text = await resp.text()
                    raise TEEInferenceError(f"HTTP {resp.status}: {text[:200]}")

                # Extract TEE seal from response headers [§4.3]
                tee_signature = resp.headers.get("X-TEE-Signature", "")

                data = await resp.json()
                content = ""
                if data.get("choices"):
                    content = data["choices"][0].get("message", {}).get("content", "")

                logger.info(f"TEE inference OK: model={model}, seal={tee_signature[:16]}...")
                return {
                    "response": content,
                    "signature": tee_signature,
                    "model": model,
                    "provider": "0g_tee",
                }

    async def _get_headers(self, query: str) -> dict:
        """Generate signed authentication headers.

        Signs: "{address}:{timestamp}:{query}"
        Headers: X-Address, X-Timestamp, X-Signature, Content-Type
        """
        address = self._account.address
        timestamp = str(int(time.time()))
        message = f"{address}:{timestamp}:{query}"

        signed = self._account.sign_message(encode_defunct(text=message))

        return {
            "X-Address": address,
            "X-Timestamp": timestamp,
            "X-Signature": signed.signature.hex(),
            "Content-Type": "application/json",
        }

    async def disconnect(self) -> None:
        """Cleanup."""
        self._connected = False
        self._account = None
        logger.info("TEEClient disconnected")

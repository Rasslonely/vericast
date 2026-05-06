"""
TEEBroker — 0G Compute Network Broker Authentication
Handles: createBroker → deposit ledger → acknowledge provider → get-secret → Bearer token
Provider: 0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6 (gpt-oss-120b, TeeML) [§4.2 CORRECTED]
⚠️ CRITICAL FIX: replaces X-Address/X-Signature auth (which returns 401/403)
"""

import logging
import os
import subprocess
import json
import time

logger = logging.getLogger("vericast.tee_broker")

# LOCKED PROVIDER — gpt-oss-120b on mainnet (TeeML)
# ⚠️ NOT 0x69Eb5a... (that's gemma-3-27b-it) — see 3_debug/missing_integration.md #3
LOCKED_PROVIDER = "0xBB3f5b0b5062CB5B3245222C5917afD1f6e13aF6"
LOCKED_MODEL = "gpt-oss-120b"


class TEEBrokerError(Exception):
    """Raised when broker setup or token generation fails."""
    pass


class TEEBroker:
    """Manages 0G Compute broker lifecycle and auth token generation.

    Auth flow (from docs.0g.ai):
    1. createZGComputeNetworkBroker(signer) — init broker with funded wallet
    2. broker.ledger.addLedger(3) — deposit 3 OG minimum
    3. broker.inference.acknowledgeProviderSigner(provider) — on-chain tx
    4. broker.ledger.transferFund(provider, 'inference', 1.0) — fund provider
    5. 0g-compute-cli inference get-secret --provider <ADDR> — get Bearer token
    6. Authorization: Bearer app-sk-<SECRET> — use in HTTP requests

    Hackathon shortcut: if broker setup fails, use TEE_AUTH_TOKEN from .env
    """

    def __init__(self, private_key: str | None = None):
        self.private_key = private_key or os.environ.get("PRIVATE_KEY", "")
        self.provider = os.environ.get("TEE_PROVIDER_ADDRESS", LOCKED_PROVIDER)
        self._auth_token: str | None = os.environ.get("TEE_AUTH_TOKEN", "") or None
        self._token_expiry: float = 0
        self._initialized = False

    @property
    def is_initialized(self) -> bool:
        return self._initialized or bool(self._auth_token)

    @property
    def auth_token(self) -> str | None:
        return self._auth_token

    async def initialize(self) -> None:
        """Initialize broker and obtain auth token.

        Strategy:
        1. Check TEE_AUTH_TOKEN env var (pre-configured)
        2. Try 0g-compute-cli to generate token
        3. If both fail: log warning, TEEClient will use mock_seal fallback
        """
        # Strategy 1: Pre-configured token
        if self._auth_token:
            logger.info(f"TEEBroker: using pre-configured TEE_AUTH_TOKEN")
            self._initialized = True
            return

        # Strategy 2: CLI-based token generation
        try:
            token = await self._generate_token_via_cli()
            if token:
                self._auth_token = token
                self._initialized = True
                logger.info("TEEBroker: token generated via CLI")
                return
        except Exception as e:
            logger.warning(f"TEEBroker CLI token generation failed: {e}")

        # Strategy 3: Fallback — no token, TEEClient uses mock_seal
        logger.warning(
            "TEEBroker: no auth token available. "
            "Set TEE_AUTH_TOKEN in .env or run broker setup. "
            "TEE inference will return mock_seal."
        )
        self._initialized = False

    async def _generate_token_via_cli(self) -> str | None:
        """Try to get auth token via 0g-compute-cli.

        Requires: npm install -g @0glabs/0g-serving-broker
        Command: 0g-compute-cli inference get-secret --provider <ADDR>
        """
        try:
            result = subprocess.run(
                [
                    "npx", "0g-compute-cli", "inference", "get-secret",
                    "--provider", self.provider,
                ],
                capture_output=True, text=True, timeout=30,
                env={**os.environ, "PRIVATE_KEY": self.private_key},
            )
            if result.returncode == 0 and result.stdout.strip():
                token = result.stdout.strip()
                if token.startswith("app-sk-"):
                    return token
                logger.warning(f"CLI returned unexpected format: {token[:20]}...")
        except FileNotFoundError:
            logger.warning("0g-compute-cli not found. Install: npm i -g @0glabs/0g-serving-broker")
        except subprocess.TimeoutExpired:
            logger.warning("0g-compute-cli timed out")
        except Exception as e:
            logger.warning(f"CLI error: {e}")
        return None

    def get_auth_headers(self) -> dict:
        """Get HTTP headers for TEE inference request.

        Returns Authorization: Bearer header if token available,
        otherwise empty dict (will cause 401 → mock_seal fallback).
        """
        if self._auth_token:
            return {
                "Authorization": f"Bearer {self._auth_token}",
                "Content-Type": "application/json",
            }
        return {"Content-Type": "application/json"}

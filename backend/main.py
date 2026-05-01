"""
VERICAST OMEGA — FastAPI Backend Entry Point
Traceable to: SYSTEM_INTERFACES_internal.md §2, ARCHITECTURE.md §5
⚠️ FALLBACK_REQUIRED: KV Node PROBED [§3.1]
Port: 8000 [ENV_REGISTRY §3]
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from da_client import DAClient
from kv_client import KVClient
from tee_client import TEEClient
from streams.depin import process_weather
from streams.game import process_tick
from streams.social import audit_feed

# Load .env
load_dotenv()

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger("vericast.main")

# ============================================================
# CLIENTS (initialized in lifespan)
# ============================================================
da_client = DAClient()
kv_client = KVClient()
tee_client = TEEClient()


# ============================================================
# LIFESPAN — Pre-flight probe (ARCHITECTURE.md §11)
# ============================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Connect all SDK clients at startup, disconnect at shutdown.

    Pre-flight probe: log status of DA, KV, TEE connections.
    KV may fallback to REST/in-memory — this is expected [§3.1].
    """
    logger.info("=== VERICAST OMEGA — Starting Pre-Flight Probe ===")

    # Connect clients
    await da_client.connect()
    await kv_client.connect()
    await tee_client.connect()

    # Log integration status
    logger.info(f"  DA:  {'✅ connected' if da_client.is_connected else '❌ disconnected'}")
    logger.info(f"  KV:  {'✅ connected' if kv_client.is_connected else '❌ disconnected'} (tier: {kv_client.active_tier})")
    logger.info(f"  TEE: {'✅ connected' if tee_client.is_connected else '❌ disconnected'}")

    if not da_client.is_connected:
        logger.error("DA client failed to connect — blob uploads will fail")
    if kv_client.active_tier == "inmemory":
        logger.warning("KV client using in-memory fallback — data is volatile")
    if not tee_client.is_connected:
        logger.warning("TEE client failed to connect — mock seals will be used")

    logger.info("=== Pre-Flight Probe Complete ===")

    yield  # App runs

    # Shutdown
    logger.info("Shutting down clients...")
    await da_client.disconnect()
    await kv_client.disconnect()
    await tee_client.disconnect()
    logger.info("All clients disconnected.")


# ============================================================
# APP
# ============================================================
app = FastAPI(
    title="VERICAST OMEGA API",
    description="Unified Verifiable State Layer on 0G — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for hackathon demo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODELS (Pydantic)
# ============================================================
class TickSubmission(BaseModel):
    """Game tick payload from SYSTEM_INTERFACES_internal.md §2.3"""
    match_id: str
    tick: int
    players: list[dict]
    timestamp: int
    object_count: int


class AuditRequest(BaseModel):
    """Social audit payload from SYSTEM_INTERFACES_internal.md §2.4"""
    feed_id: str


# ============================================================
# ROUTES
# ============================================================

@app.get("/health")
async def health():
    """Health check — returns live status of all 0G integrations.

    Response: {status, 0g_kv, 0g_tee, 0g_da, integrations_verified}
    Traceable to: SYSTEM_INTERFACES_internal.md §2.1
    """
    kv_ok = kv_client.is_connected
    tee_ok = tee_client.is_connected
    da_ok = da_client.is_connected
    all_ok = kv_ok and tee_ok and da_ok

    return {
        "status": "healthy" if all_ok else "degraded",
        "0g_kv": kv_ok,
        "0g_tee": tee_ok,
        "0g_da": da_ok,
        "integrations_verified": all_ok,
    }


@app.get("/depin/weather/{lat}/{lon}")
async def depin_weather(lat: float, lon: float):
    """DePIN weather endpoint.

    Pipeline: OpenWeather → DA → TEE → KV
    Response: {key, da_root, tee_seal, explorer_link}
    Errors: 429 (rate limit), 503 (TEE), 504 (DA timeout)
    Traceable to: SYSTEM_INTERFACES_internal.md §2.2
    """
    result = await process_weather(lat, lon, da_client, tee_client, kv_client)

    # Check for error responses from pipeline
    if "error" in result:
        error_type = result["error"]
        if error_type == "rate_limit":
            raise HTTPException(status_code=429, detail=result)
        elif error_type == "upstream_timeout":
            raise HTTPException(status_code=504, detail=result)
        elif error_type == "tee_unavailable":
            # Return 200 with degraded data (mock seal present)
            return result

    return result


@app.post("/game/submit-tick")
async def game_submit_tick(tick: TickSubmission):
    """Game tick submission endpoint.

    Pipeline: Canvas state → DA → TEE speed check → SHA256 → KV
    Response: {key, state_root, tee_seal, explorer_link}
    Errors: 503 (TEE), 504 (DA timeout)
    Traceable to: SYSTEM_INTERFACES_internal.md §2.3
    """
    result = await process_tick(tick.model_dump(), da_client, tee_client, kv_client)

    if "error" in result:
        error_type = result["error"]
        if error_type == "upstream_timeout":
            raise HTTPException(status_code=504, detail=result)
        elif error_type == "tee_unavailable":
            return result  # 200 with mock seal

    return result


@app.post("/social/audit")
async def social_audit(req: AuditRequest):
    """Social sybil audit endpoint.

    Pipeline: TEE audit → bot detection → KV write
    Response: {feed_id, flagged_agents, tee_seal, summary}
    Errors: 503 (TEE), 422 (validation)
    Traceable to: SYSTEM_INTERFACES_internal.md §2.4
    """
    result = await audit_feed(req.feed_id, tee_client, kv_client)

    if "error" in result:
        error_type = result["error"]
        if error_type == "tee_unavailable":
            return result  # 200 with degraded response

    return result


# ============================================================
# STARTUP
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,  # [ENV_REGISTRY §3]
        reload=True,
    )

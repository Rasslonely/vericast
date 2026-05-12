"""
VERICAST OMEGA — FastAPI Backend (PATCHED)
⚠️ Broker auth init at startup
⚠️ KV 2-tier health reporting
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
from tee_broker import TEEBroker
from tee_client import TEEClient
from chain_client import ChainClient
from streams.depin import process_weather
from streams.game import process_tick
from streams.social import audit_feed

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")
logger = logging.getLogger("vericast.main")

# Clients
da_client = DAClient()
kv_client = KVClient()
tee_broker = TEEBroker()
tee_client = TEEClient(broker=tee_broker)
chain_client = ChainClient()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=== VERICAST OMEGA — Pre-Flight Probe ===")
    await da_client.connect()
    await kv_client.connect()
    await tee_broker.initialize()
    await tee_client.connect()
    await chain_client.connect()

    logger.info(f"  DA:  {'✅' if da_client.is_connected else '❌'}")
    logger.info(f"  KV:  {'✅' if kv_client.is_connected else '❌'} (tier: {kv_client.active_tier})")
    logger.info(f"  TEE: {'✅' if tee_client.is_connected else '❌'} (broker: {tee_broker.is_initialized})")
    logger.info(f"  Chain: {'✅' if chain_client.is_connected else '❌'}")
    logger.info("=== Probe Complete ===")

    yield

    await da_client.disconnect()
    await kv_client.disconnect()
    await tee_client.disconnect()
    await chain_client.disconnect()


app = FastAPI(title="VERICAST OMEGA API", version="1.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])


@app.get("/")
async def root():
    return {"message": "VERICAST OMEGA API is running"}


@app.get("/favicon.ico")
async def favicon():
    from fastapi.responses import Response
    return Response(status_code=204)



class TickSubmission(BaseModel):
    match_id: str
    tick: int
    players: list[dict]
    timestamp: int
    object_count: int


class AuditRequest(BaseModel):
    feed_id: str


@app.get("/health")
async def health():
    kv_ok = kv_client.is_connected
    tee_ok = tee_client.is_connected
    da_ok = da_client.is_connected
    chain_ok = chain_client.is_connected
    return {
        "status": "healthy" if (kv_ok and tee_ok and da_ok and chain_ok) else "degraded",
        "0g_kv": kv_ok, "0g_kv_tier": kv_client.active_tier,
        "0g_tee": tee_ok, "0g_tee_broker": tee_broker.is_initialized,
        "0g_da": da_ok,
        "0g_chain": chain_ok,
        "integrations_verified": kv_ok and tee_ok and da_ok and chain_ok,
    }


@app.get("/depin/weather/{lat}/{lon}")
async def depin_weather(lat: float, lon: float):
    result = await process_weather(lat, lon, da_client, tee_client, kv_client, chain_client)
    if "error" in result:
        code = {"rate_limit": 429, "upstream_timeout": 504}.get(result["error"], 200)
        if code != 200:
            raise HTTPException(status_code=code, detail=result)
    return result


@app.post("/game/submit-tick")
async def game_submit_tick(tick: TickSubmission):
    result = await process_tick(tick.model_dump(), da_client, tee_client, kv_client, chain_client)
    if "error" in result and result["error"] == "upstream_timeout":
        raise HTTPException(status_code=504, detail=result)
    return result


@app.post("/social/audit")
async def social_audit(req: AuditRequest):
    return await audit_feed(req.feed_id, tee_client, kv_client, chain_client)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

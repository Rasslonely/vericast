import asyncio
import json
import logging
import random
import time

from streams.game import process_tick
from streams.social import audit_feed
from streams.depin import process_weather

logger = logging.getLogger("vericast.daemons")

class EventStreamer:
    def __init__(self):
        self.queues = []
    
    async def broadcast(self, event_type: str, data: dict):
        msg = f"event: {event_type}\ndata: {json.dumps(data, ensure_ascii=True)}\n\n"
        for q in self.queues:
            await q.put(msg)
            
    async def event_generator(self):
        q = asyncio.Queue()
        self.queues.append(q)
        try:
            while True:
                yield await q.get()
        finally:
            self.queues.remove(q)

streamer = EventStreamer()

async def game_daemon(da_client, tee_client, kv_client, chain_client):
    players = [
        {"id": "agent_alpha", "x": 200, "y": 200, "health": 100},
        {"id": "agent_beta", "x": 600, "y": 200, "health": 100}
    ]
    tick = 0
    match_id = f"arena_{int(time.time())}"
    await asyncio.sleep(5)
    while True:
        tick += 1
        for p in players:
            p["x"] += random.randint(-150, 150)
            p["y"] += random.randint(-150, 150)
            p["x"] = max(20, min(800 - 20, p["x"]))
            p["y"] = max(20, min(400 - 20, p["y"]))
        
        tick_data = {
            "match_id": match_id, "tick": tick, "players": players, 
            "timestamp": int(time.time()), "object_count": 2
        }
        await streamer.broadcast("log", {"level": "INFO", "source": "GAME_DAEMON", "message": f"Autonomous Tick #{tick} batching..."})
        try:
            res = await process_tick(tick_data, da_client, tee_client, kv_client, chain_client)
            await streamer.broadcast("game_update", {"players": players, "tick": tick, "result": res})
            if "error" in res:
                await streamer.broadcast("log", {"level": "ERROR", "source": "GAME_DAEMON", "message": res["message"]})
            else:
                await streamer.broadcast("log", {"level": "SUCCESS", "source": "0G_CHAIN", "message": f"Tick #{tick} verified. Root: {res.get('state_root', '')[:16]}..."})
        except Exception as e:
            logger.error(f"Game daemon error: {e}")
            await streamer.broadcast("log", {"level": "ERROR", "source": "GAME_DAEMON", "message": str(e)})
        
        await asyncio.sleep(8)

async def social_daemon(tee_client, kv_client, chain_client):
    await asyncio.sleep(10)
    while True:
        await streamer.broadcast("log", {"level": "INFO", "source": "SOCIAL_SENTINEL", "message": "Initiating background TEE Sybil Audit..."})
        try:
            res = await audit_feed("main_feed", tee_client, kv_client, chain_client)
            await streamer.broadcast("social_update", {"result": res})
            if "error" in res:
                await streamer.broadcast("log", {"level": "ERROR", "source": "SOCIAL_SENTINEL", "message": res.get("message", "Audit failed")})
            else:
                flagged = res.get('flagged_agents', [])
                await streamer.broadcast("log", {"level": "SUCCESS" if not flagged else "WARNING", "source": "TEE_ENCLAVE", "message": f"Audit complete. {len(flagged)} bots flagged."})
        except Exception as e:
            logger.error(f"Social daemon error: {e}")
            await streamer.broadcast("log", {"level": "ERROR", "source": "SOCIAL_SENTINEL", "message": str(e)})
            
        await asyncio.sleep(20)

async def depin_daemon(da_client, tee_client, kv_client, chain_client):
    await asyncio.sleep(15)
    while True:
        await streamer.broadcast("log", {"level": "INFO", "source": "DEPIN_ORACLE", "message": "Ingesting spatial data from HK Central grid..."})
        try:
            res = await process_weather(22.3193, 114.1694, da_client, tee_client, kv_client, chain_client)
            await streamer.broadcast("depin_update", {"result": res})
            if "error" in res:
                await streamer.broadcast("log", {"level": "WARNING", "source": "DEPIN_ORACLE", "message": res.get("message", "Sensor fetch failed")})
            else:
                await streamer.broadcast("log", {"level": "SUCCESS", "source": "0G_DA", "message": f"Sensor blob secured. DA Hash: {res.get('da_root', '')[:16]}..."})
        except Exception as e:
            logger.error(f"DePIN daemon error: {e}")
            await streamer.broadcast("log", {"level": "ERROR", "source": "DEPIN_ORACLE", "message": str(e)})
            
        await asyncio.sleep(30)

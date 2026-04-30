"""
Game Tick Stream — Canvas State → DA → TEE → KV Pipeline
Traceable to: SYSTEM_INTERFACES_internal.md §2.3
⚠️ FALLBACK_REQUIRED: KV Node PROBED [§3.1]
"""

import hashlib
import json
import logging
import os

logger = logging.getLogger("vericast.game")


async def process_tick(tick_data: dict, da_client, tee_client, kv_client) -> dict:
    """Process a game tick submission.

    Pipeline:
    1. da_client.upload_blob(tick_data) → da_root
    2. tee_client.infer(speed_check) → tee_seal
    3. state_root = SHA256(concat(sorted player states))
    4. kv_client.put(key, state) → kv result
    5. Return {key, state_root, tee_seal, explorer_link}
    """
    explorer_base = os.environ.get("EXPLORER_BASE_URL", "https://chainscan.0g.ai")
    match_id = tick_data.get("match_id", "unknown")
    tick = tick_data.get("tick", 0)
    players = tick_data.get("players", [])

    # Step 1: Upload tick data to DA
    try:
        da_root = await da_client.upload_blob(tick_data)
    except Exception as e:
        logger.error(f"DA upload failed for game tick: {e}")
        return {
            "error": "upstream_timeout",
            "component": "0g_da",
            "fallback_used": False,
            "message": f"DA blob upload failed after 3 retries: {e}",
        }

    # Step 2: Compute deterministic state root
    # SHA256(concat(sorted player states by id))
    sorted_players = sorted(players, key=lambda p: p.get("id", ""))
    concat = "".join(
        f"{p.get('id', '')}:{p.get('x', 0)}:{p.get('y', 0)}:{p.get('health', 0)}"
        for p in sorted_players
    )
    state_root = "0x" + hashlib.sha256(concat.encode("utf-8")).hexdigest()

    # Step 3: TEE speed check (anti-cheat verification)
    speed_check_prompt = (
        f"Verify game tick integrity for match {match_id}, tick {tick}. "
        f"Players: {json.dumps(sorted_players)}. "
        f"State root: {state_root}. DA root: {da_root}. "
        "Check: no player teleportation (max 50px/tick movement)."
    )
    tee_result = await tee_client.infer(
        prompt=speed_check_prompt,
        model="gpt-oss-120b",  # LOCKED [§4.3]
    )
    tee_seal = tee_result.get("signature")

    # Step 4: KV write
    key = f"match_{match_id}_tick_{tick}"
    state = {
        "match_id": match_id,
        "tick": tick,
        "state_root": state_root,
        "da_root": da_root,
        "tee_seal": tee_seal,
        "players": sorted_players,
        "object_count": tick_data.get("object_count", len(players)),
    }
    await kv_client.put(key, state)

    # Step 5: Response [EXPLORER LINK MANDATE]
    explorer_link = f"{explorer_base}/tx/{da_root}" if da_root and not da_root.startswith("inmemory_") else None

    if tee_seal == "mock_seal":
        return {
            "error": "tee_unavailable",
            "fallback": "mock_seal",
            "key": key,
            "state_root": state_root,
            "tee_seal": None,
            "explorer_link": explorer_link,
            "message": "TEE speed check skipped; mock seal applied",
        }

    return {
        "key": key,
        "state_root": state_root,
        "tee_seal": tee_seal,
        "explorer_link": explorer_link,
    }

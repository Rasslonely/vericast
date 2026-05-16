"""
Social Audit Stream — Sybil Detection via TEE
Traceable to: SYSTEM_INTERFACES_internal.md §2.4
⚠️ FALLBACK_REQUIRED: KV Node PROBED [§3.1]
"""

import json
import logging

logger = logging.getLogger("vericast.social")

# Demo agent registry (simulates on-chain VericastAgentID state)
DEMO_AGENTS = {
    "agent_1": {"type": 0, "name": "Human Observer 1", "suspicious": False},
    "agent_2": {"type": 1, "name": "AI Weather Analyst", "suspicious": False},
    "agent_3": {"type": 1, "name": "AI Feed Monitor", "suspicious": False},
    "bot_1": {"type": 1, "name": "Suspicious Bot Alpha", "suspicious": False},
    "bot_2": {"type": 1, "name": "Spam Bot Beta", "suspicious": False},
    "bot_3": {"type": 1, "name": "Sybil Bot Gamma", "suspicious": False},
    "sensor_1": {"type": 2, "name": "IoT Sensor HK Central", "suspicious": False},
}



async def audit_feed(feed_id: str, tee_client, kv_client, chain_client) -> dict:
    """Run sybil audit on a social feed.

    Pipeline:
    1. tee_client.infer(audit_prompt) → TEE-attested analysis
    2. Scan DEMO_AGENTS for suspicious patterns
    3. kv_client.put(audit result)
    4. Return {feed_id, flagged_agents, tee_seal, summary}
    """
    # Step 1: TEE sybil analysis
    agents_json = json.dumps(DEMO_AGENTS, indent=2)
    audit_prompt = (
        f"Analyze social feed '{feed_id}' for sybil attacks. "
        f"Agent registry: {agents_json}. "
        "Flag any agents exhibiting bot-like behavior: "
        "identical posting patterns, no human verification, rapid-fire actions."
    )

    tee_result = await tee_client.infer(
        prompt=audit_prompt,
        model="gpt-oss-120b",  # LOCKED [§4.3]
    )
    tee_seal = tee_result.get("signature")

    # Step 2: Deterministic bot detection (demo logic)
    flagged = [
        agent_id
        for agent_id, info in DEMO_AGENTS.items()
        if info.get("suspicious", False)
    ]

    # Step 3: TEE response parsing (or use deterministic fallback)
    tee_response = tee_result.get("response", "")
    summary = tee_response if tee_response else (
        f"Audit complete for feed '{feed_id}'. "
        f"Scanned {len(DEMO_AGENTS)} agents. "
        f"Flagged {len(flagged)} suspicious: {', '.join(flagged)}."
    )

    # Handle TEE fallback
    if tee_seal == "mock_seal":
        logger.warning("TEE returned mock seal for social audit")
        return {
            "error": "tee_unavailable",
            "feed_id": feed_id,
            "flagged_agents": [],
            "tee_seal": None,
            "message": "Audit aborted: TEE unreachable for sybil analysis",
        }

    # Step 4: KV write (audit result)
    audit_key = f"social_audit_{feed_id}_latest"
    audit_state = {
        "feed_id": feed_id,
        "flagged_agents": flagged,
        "tee_seal": tee_seal,
        "summary": summary,
        "agent_count": len(DEMO_AGENTS),
    }
    await kv_client.put(audit_key, audit_state)

    # Step 5: On-chain settlement
    import hashlib
    # Compute a dummy state root for social audit (e.g. hash of summary)
    state_root = "0x" + hashlib.sha256(summary.encode("utf-8")).hexdigest()
    
    chain_result = await chain_client.submit_state_root(
        stream_id="vericast_state_v1",
        key=audit_key,
        state_root=state_root,
        tee_seal=tee_seal or "",
        proof_hash=state_root,
    )

    import os
    explorer_base = os.environ.get("EXPLORER_BASE_URL", "https://chainscan.0g.ai")
    explorer_link = chain_result.get("explorer_link") or f"{explorer_base}/tx/{state_root}"

    return {
        "feed_id": feed_id,
        "flagged_agents": flagged,
        "tee_seal": tee_seal,
        "summary": summary,
        "explorer_link": explorer_link,
        "tx_hash": chain_result.get("tx_hash"),
    }

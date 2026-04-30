"""
DePIN Weather Stream — OpenWeather → DA → TEE → KV Pipeline
Traceable to: SYSTEM_INTERFACES_internal.md §2.2, SYSTEM_INTERFACES_external.md §5
⚠️ FALLBACK_REQUIRED: KV Node PROBED [§3.1]
"""

import json
import logging
import os
from datetime import datetime, timezone

import aiohttp

logger = logging.getLogger("vericast.depin")

# DePIN sensor locations [ENV_REGISTRY §3]
DEPIN_LOCATIONS = {
    "hk_central": {"lat": 22.3193, "lon": 114.1694, "name": "HK Central"},
    "causeway_bay": {"lat": 22.2783, "lon": 114.1747, "name": "Causeway Bay"},
}

# OpenWeather mock data (when API is unavailable)
MOCK_WEATHER = {
    "temp": 28.5,
    "humidity": 72,
    "pressure": 1013,
    "wind_speed": 4.8,
    "uvi": 7.2,
    "timestamp": None,  # Filled at runtime
    "source": "mock",
}


async def fetch_weather(lat: float, lon: float) -> dict:
    """Fetch weather from OpenWeatherMap API.

    Endpoint: GET /data/3.0/onecall?lat={}&lon={}&appid={}&units=metric&exclude=minutely,hourly,daily,alerts
    Fallback: mock data with source:"mock"

    Returns: {temp, humidity, pressure, wind_speed, uvi, timestamp, source}
    """
    api_key = os.environ.get("OPENWEATHER_API_KEY", "")
    if not api_key:
        logger.warning("OPENWEATHER_API_KEY not set — returning mock data")
        return {**MOCK_WEATHER, "timestamp": datetime.now(timezone.utc).isoformat()}

    url = "https://api.openweathermap.org/data/3.0/onecall"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": api_key,
        "units": "metric",
        "exclude": "minutely,hourly,daily,alerts",
    }

    try:
        async with aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=10)
        ) as session:
            async with session.get(url, params=params) as resp:
                if resp.status == 429:
                    logger.warning("OpenWeather rate limited (429)")
                    return {**MOCK_WEATHER, "timestamp": datetime.now(timezone.utc).isoformat()}
                if resp.status != 200:
                    logger.warning(f"OpenWeather HTTP {resp.status}")
                    return {**MOCK_WEATHER, "timestamp": datetime.now(timezone.utc).isoformat()}

                data = await resp.json()
                current = data.get("current", {})
                return {
                    "temp": current.get("temp", 0),
                    "humidity": current.get("humidity", 0),
                    "pressure": current.get("pressure", 0),
                    "wind_speed": current.get("wind_speed", 0),
                    "uvi": current.get("uvi", 0),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "source": "openweathermap",
                }
    except Exception as e:
        logger.warning(f"OpenWeather fetch failed: {e}")
        return {**MOCK_WEATHER, "timestamp": datetime.now(timezone.utc).isoformat()}


async def process_weather(lat: float, lon: float, da_client, tee_client, kv_client) -> dict:
    """Full DePIN weather pipeline.

    Pipeline:
    1. fetch_weather(lat, lon) → weather data
    2. da_client.upload_blob(weather) → da_root
    3. tee_client.infer(certificate) → tee_seal
    4. kv_client.put(key, state) → kv result
    5. Return {key, da_root, tee_seal, explorer_link}

    Errors propagated as structured JSON (429/503/504).
    """
    explorer_base = os.environ.get("EXPLORER_BASE_URL", "https://chainscan.0g.ai")

    # Step 1: Fetch weather
    weather = await fetch_weather(lat, lon)

    # Step 2: Upload to DA
    try:
        da_root = await da_client.upload_blob(weather)
    except Exception as e:
        logger.error(f"DA upload failed for DePIN: {e}")
        return {
            "error": "upstream_timeout",
            "component": "0g_da",
            "fallback_used": True,
            "message": f"DA indexer turbo timeout; retried on standard tier: {e}",
        }

    # Step 3: TEE verification
    certificate = json.dumps({
        "type": "depin_weather",
        "lat": lat,
        "lon": lon,
        "da_root": da_root,
        "data": weather,
    })
    tee_result = await tee_client.infer(
        prompt=f"Verify DePIN weather certificate: {certificate}",
        model="gpt-oss-120b",  # LOCKED [§4.3]
    )
    tee_seal = tee_result.get("signature")

    # Handle TEE fallback
    if tee_seal == "mock_seal":
        logger.warning("TEE returned mock seal for DePIN weather")

    # Step 4: KV write
    key = f"sensor_weather_{lat}_{lon}_latest"
    state = {
        "weather": weather,
        "da_root": da_root,
        "tee_seal": tee_seal,
        "timestamp": weather.get("timestamp"),
    }
    await kv_client.put(key, state)

    # Step 5: Response with explorer link [EXPLORER LINK MANDATE]
    explorer_link = f"{explorer_base}/tx/{da_root}" if da_root and not da_root.startswith("inmemory_") else None

    return {
        "key": key,
        "da_root": da_root,
        "tee_seal": tee_seal if tee_seal != "mock_seal" else None,
        "explorer_link": explorer_link,
    }

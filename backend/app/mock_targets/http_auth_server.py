import asyncio
import json
import time
from aiohttp import web

async def handle_auth(request):
    # Simulated authentication logic
    data = {}
    if request.can_read_body:
        try:
            data = await request.json()
        except Exception:
            pass
    return web.json_response({
        "status": "authenticated",
        "user_id": "usr_998124",
        "session_token": "sess_tok_" + hex(int(time.time()))[2:],
        "tournament_tier": "GrandMaster",
        "server_time": time.time()
    })

async def handle_matchmaking(request):
    return web.json_response({
        "status": "queued",
        "queue_position": 4,
        "estimated_wait_sec": 12,
        "region": "us-east-1",
        "lobby_id": "lobby_omega_77"
    })

async def handle_health(request):
    return web.json_response({
        "status": "HEALTHY",
        "version": "2.4.1",
        "cluster_load_pct": 28.5,
        "timestamp": time.time()
    })

async def handle_challenge(request):
    # Challenge verification file for resilience testing platform
    return web.Response(text="resilience-auth-token-verified-local-sandbox-env\n")

async def start_mock_http(port: int = 9003):
    app = web.Application()
    app.router.add_post("/api/auth", handle_auth)
    app.router.add_get("/api/auth", handle_auth)
    app.router.add_get("/api/matchmaking", handle_matchmaking)
    app.router.add_get("/api/health", handle_health)
    app.router.add_get("/", handle_health)
    app.router.add_get("/.well-known/resilience-challenge.txt", handle_challenge)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port, reuse_address=True)
    await site.start()
    return runner

import asyncio
import json
import time
from aiohttp import web

MOCK_HOMEPAGE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Apex Gaming Platform - Mock Staging Environment</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; padding: 40px; }
    h1 { color: #38bdf8; }
    .card { background: #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; background: #0284c7; color: white; }
  </style>
</head>
<body>
  <h1>Apex Championship Gaming Network</h1>
  <div class="card">
    <span class="badge">ONLINE</span>
    <p>Welcome to the official mock staging platform for load testing and capacity verification.</p>
    <p>Endpoints active: <code>/search</code>, <code>/api/auth</code>, <code>/api/cart</code>, <code>/redirect</code>, <code>/items/1</code></p>
  </div>
</body>
</html>
"""

async def handle_root(request):
    return web.Response(text=MOCK_HOMEPAGE_HTML, content_type="text/html")

async def handle_search(request):
    query = request.query.get("q", "default")
    # Simulate realistic micro-latency
    await asyncio.sleep(0.002)
    return web.json_response({
        "status": "success",
        "query": query,
        "results_count": 42,
        "items": [
            {"id": "itm_1", "title": f"Championship Ticket ({query})", "price": 49.99},
            {"id": "itm_2", "title": f"VIP Pass ({query})", "price": 129.99}
        ],
        "latency_ms": 2.1
    })

async def handle_auth(request):
    data = {}
    if request.can_read_body:
        try:
            data = await request.json()
        except Exception:
            pass
    return web.json_response({
        "status": "authenticated",
        "user_id": data.get("username", "usr_998124"),
        "session_token": "sess_tok_" + hex(int(time.time()))[2:],
        "tournament_tier": "GrandMaster",
        "server_time": time.time()
    })

async def handle_cart(request):
    data = {}
    if request.can_read_body:
        try:
            data = await request.json()
        except Exception:
            pass
    return web.json_response({
        "status": "order_processed",
        "order_id": "ord_" + hex(int(time.time() * 1000))[2:],
        "items_count": len(data.get("items", [1])),
        "timestamp": time.time()
    }, status=201)

async def handle_redirect(request):
    raise web.HTTPFound("/")

async def handle_item(request):
    item_id = request.match_info.get("id", "0")
    return web.json_response({
        "item_id": item_id,
        "name": f"Tournament Server Blade #{item_id}",
        "stock": 150,
        "status": "IN_STOCK"
    })

async def handle_custom_status(request):
    code_str = request.match_info.get("code", "200")
    try:
        code = int(code_str)
    except ValueError:
        code = 200
    return web.Response(text=f"Response status {code}", status=code)

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
        "version": "2.5.0",
        "cluster_load_pct": 28.5,
        "timestamp": time.time()
    })

async def handle_challenge(request):
    return web.Response(text="resilience-auth-token-verified-local-sandbox-env\n")

async def start_mock_http(port: int = 9003):
    app = web.Application()
    app.router.add_get("/", handle_root)
    app.router.add_get("/index.html", handle_root)
    app.router.add_get("/search", handle_search)
    app.router.add_post("/api/auth", handle_auth)
    app.router.add_get("/api/auth", handle_auth)
    app.router.add_post("/api/cart", handle_cart)
    app.router.add_get("/items/{id}", handle_item)
    app.router.add_get("/redirect", handle_redirect)
    app.router.add_get("/test/status/{code}", handle_custom_status)
    app.router.add_get("/api/matchmaking", handle_matchmaking)
    app.router.add_get("/api/health", handle_health)
    app.router.add_get("/.well-known/resilience-challenge.txt", handle_challenge)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", port, reuse_address=True)
    await site.start()
    return runner

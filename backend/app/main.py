import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes_targets import router as targets_router
from app.api.routes_tests import router as tests_router
from app.api.routes_reports import router as reports_router
from app.core.websocket_hub import websocket_hub
from app.core.orchestrator import orchestrator
from app.mock_targets.mock_manager import mock_manager

FRONTEND_DIST = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Platform] Starting Network Resilience & Load Testing Platform...")
    # Automatically start mock targets so user has a working sandbox out-of-the-box
    await mock_manager.start_all()
    yield
    print("[Platform] Shutting down...")
    await orchestrator.stop_test(reason="PLATFORM_SHUTDOWN")
    await mock_manager.stop_all()

app = FastAPI(
    title="Network Load Testing & Resilience Assessment Platform",
    description="Enterprise-grade multi-protocol traffic simulation and resilience verification engine.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(targets_router)
app.include_router(tests_router)
app.include_router(reports_router)

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket_hub.connect(websocket)
    try:
        while True:
            # Keepalive receiver
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        await websocket_hub.disconnect(websocket)
    except Exception:
        await websocket_hub.disconnect(websocket)

@app.get("/metrics", response_class=PlainTextResponse)
async def prometheus_metrics():
    """Prometheus-compatible exposition format for infrastructure metrics scrapers."""
    status = orchestrator.get_current_status()
    snap = status.get("snapshot") or orchestrator.get_last_snapshot()
    lines = [
        "# HELP resilience_test_active Current test running status (1 = running, 0 = idle)",
        "# TYPE resilience_test_active gauge",
        f"resilience_test_active {1 if status['status'] == 'RUNNING' else 0}",
    ]
    if snap:
        snap_dict = snap.model_dump() if hasattr(snap, "model_dump") else snap
        lines.extend([
            f"resilience_target_rps {snap_dict.get('target_rps', 0)}",
            f"resilience_generated_rps {snap_dict.get('generated_rps', 0.0)}",
            f"resilience_received_rps {snap_dict.get('received_rps', 0.0)}",
            f"resilience_successful_rps {snap_dict.get('successful_rps', 0.0)}",
            f"resilience_failed_rps {snap_dict.get('failed_rps', 0.0)}",
            f"resilience_req_per_sec {snap_dict.get('req_per_sec', 0.0)}",
            f"resilience_packets_per_sec {snap_dict.get('packets_per_sec', 0.0)}",
            f"resilience_active_connections {snap_dict.get('active_conns', 0)}",
            f"resilience_latency_avg_ms {snap_dict.get('avg_latency_ms', 0.0)}",
            f"resilience_latency_p95_ms {snap_dict.get('p95_latency_ms', 0.0)}",
            f"resilience_latency_p99_ms {snap_dict.get('p99_latency_ms', 0.0)}",
            f"resilience_packet_loss_pct {snap_dict.get('packet_loss_pct', 0.0)}",
            f"resilience_throughput_kbps {snap_dict.get('throughput_kbps', 0.0)}",
            f"resilience_generator_capacity_pct {snap_dict.get('generator_capacity_pct', 0.0)}",
            f"resilience_cluster_max_rps {snap_dict.get('cluster_max_achievable_rps', 0.0)}",
            f"resilience_generator_cpu_pct {snap_dict.get('cpu_usage_pct', 0.0)}",
            f"resilience_generator_ram_pct {snap_dict.get('ram_usage_pct', 0.0)}",
            f"resilience_timeouts_total {snap_dict.get('timeouts_count', 0)}",
            f"resilience_avg_response_bytes {snap_dict.get('avg_response_bytes', 0.0)}"
        ])
    return "\n".join(lines) + "\n"

@app.get("/health")
async def health_check():
    return {"status": "HEALTHY", "service": "Antigravity Resilience Platform API"}

# Mount frontend static distribution if built
if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # Don't intercept API or WebSocket routes
        if full_path.startswith("api/") or full_path.startswith("ws/") or full_path == "metrics":
            return {"error": "Not found"}
        target_file = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))

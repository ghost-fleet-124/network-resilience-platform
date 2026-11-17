import asyncio
import time
import uuid
from typing import Optional, Dict, Any
from app.models import (
    TestStartRequest,
    TestStatusEnum,
    ProtocolEnum,
    TestReport,
    MetricSnapshot
)
from app.config import PRESET_CONFIGS
from app.core.safety_governor import safety_governor
from app.core.metrics_collector import MetricsCollector
from app.core.websocket_hub import websocket_hub
from app.core.storage import storage
from app.core.cluster_manager import cluster_manager
from app.engines.base_engine import BaseEngine
from app.engines.udp_engine import UDPEngine
from app.engines.tcp_engine import TCPEngine
from app.engines.http_engine import HTTPEngine
from app.engines.websocket_engine import WebSocketEngine
from app.engines.custom_game_engine import CustomGameEngine
from app.engines.grpc_quic_engine import GrpcQuicEngine

class Orchestrator:
    def __init__(self):
        self.active_test_id: Optional[str] = None
        self.active_engine: Optional[BaseEngine] = None
        self.active_collector: Optional[MetricsCollector] = None
        self.active_status: TestStatusEnum = TestStatusEnum.IDLE
        self._last_report: Optional[TestReport] = None
        self._last_snapshot: Optional[MetricSnapshot] = None
        self._telemetry_task: Optional[asyncio.Task] = None
        self._engine_task: Optional[asyncio.Task] = None
        self._lock = asyncio.Lock()

    async def start_test(self, req: TestStartRequest, operator_ip: str = "127.0.0.1") -> Dict[str, Any]:
        async with self._lock:
            if self.active_status in (TestStatusEnum.RUNNING, TestStatusEnum.INITIALIZING, TestStatusEnum.PAUSED):
                raise ValueError("A test is already running. Stop the current test first.")

            # Auto-parse target_url if provided
            if req.target_url and req.target_url.strip():
                from urllib.parse import urlparse
                raw_url = req.target_url.strip()
                if not (raw_url.startswith("http://") or raw_url.startswith("https://")):
                    raw_url = "http://" + raw_url
                parsed = urlparse(raw_url)
                if parsed.hostname:
                    req.host = parsed.hostname
                if parsed.port:
                    req.port = parsed.port
                elif parsed.scheme == "https":
                    req.port = 443
                elif parsed.scheme == "http" and req.port not in (80, 443, 9003):
                    if not req.port:
                        req.port = 80
                if parsed.path:
                    req.http_path = parsed.path + (f"?{parsed.query}" if parsed.query else "")

            # 1. Target Authorization Verification
            target_id = req.target_id or req.scope_id
            auth_res = await safety_governor.verify_target_authorization(
                req.host,
                req.port,
                target_id=target_id,
                protocol=req.protocol
            )
            if not auth_res.is_authorized:
                err_msg = f"Target authorization failed: {auth_res.message}"
                if auth_res.rejection_reason:
                    err_msg += f" Reason: {auth_res.rejection_reason}"
                raise PermissionError(err_msg)

            # 2. Enforce Traffic Budget and Numerical RPS targets
            preset_cfg, target_rps, max_conns = safety_governor.enforce_traffic_budget(req)

            # 3. Initialize IDs and Metrics Collector with workload curve
            test_id = f"test_{int(time.time())}_{uuid.uuid4().hex[:6]}"
            self.active_test_id = test_id
            self.active_status = TestStatusEnum.INITIALIZING

            collector = MetricsCollector(
                test_id=test_id,
                protocol=req.protocol,
                intensity=req.intensity,
                target_rps=target_rps,
                host=req.host,
                port=req.port,
                ramp_up_sec=req.ramp_up_sec or 5,
                sustained_sec=req.sustained_sec or 30,
                ramp_down_sec=req.ramp_down_sec or 5
            )
            self.active_collector = collector

            # 4. Instantiate Protocol Engine
            if req.protocol == ProtocolEnum.UDP:
                engine = UDPEngine(req, preset_cfg, target_rps, max_conns, collector)
            elif req.protocol == ProtocolEnum.TCP:
                engine = TCPEngine(req, preset_cfg, target_rps, max_conns, collector)
            elif req.protocol in (ProtocolEnum.HTTP, ProtocolEnum.HTTPS, ProtocolEnum.HTTP_WEBSITE):
                engine = HTTPEngine(req, preset_cfg, target_rps, max_conns, collector)
            elif req.protocol == ProtocolEnum.WEBSOCKET:
                engine = WebSocketEngine(req, preset_cfg, target_rps, max_conns, collector)
            elif req.protocol == ProtocolEnum.GAME_UDP:
                engine = CustomGameEngine(req, preset_cfg, target_rps, max_conns, collector)
            elif req.protocol in (ProtocolEnum.GRPC, ProtocolEnum.QUIC):
                engine = GrpcQuicEngine(req, preset_cfg, target_rps, max_conns, collector)
            else:
                raise ValueError(f"Unsupported protocol: {req.protocol}")

            self.active_engine = engine

            # 5. Audit Logging with full target, timestamp, operator, workload and scope metadata
            storage.log_audit_event(
                action="START_TEST",
                test_id=test_id,
                details={
                    "target": f"{req.host}:{req.port}",
                    "target_url": req.target_url,
                    "protocol": req.protocol.value,
                    "intensity": req.intensity.value,
                    "target_rps": target_rps,
                    "max_conns": max_conns,
                    "duration_sec": req.duration_sec,
                    "operator_ip": operator_ip,
                    "authorization_scope": auth_res.scope,
                    "scope_name": auth_res.scope_name,
                    "authorized_by": auth_res.authorized_by,
                    "cluster_nodes": len(cluster_manager.get_all_nodes())
                }
            )

            # 6. Launch Tasks
            self.active_status = TestStatusEnum.RUNNING
            collector.status = TestStatusEnum.RUNNING

            self._engine_task = asyncio.create_task(self._run_engine_lifecycle(engine, req.duration_sec or 30))
            self._telemetry_task = asyncio.create_task(self._telemetry_loop(collector, req))

            return {
                "test_id": test_id,
                "status": "RUNNING",
                "target": f"{req.host}:{req.port}",
                "protocol": req.protocol,
                "intensity": req.intensity,
                "target_rps": target_rps,
                "max_conns": max_conns,
                "duration_sec": req.duration_sec,
                "cluster_capacity_rps": cluster_manager.get_cluster_capacity_rps(),
                "active_cluster_nodes": len(cluster_manager.get_all_nodes())
            }

    async def _run_engine_lifecycle(self, engine: BaseEngine, duration_sec: int):
        try:
            await asyncio.wait_for(engine.run(), timeout=float(duration_sec))
        except asyncio.TimeoutError:
            pass
        except asyncio.CancelledError:
            pass
        except Exception as e:
            print(f"[Orchestrator] Engine error: {e}")
        finally:
            if self.active_status == TestStatusEnum.RUNNING:
                await self.stop_test(reason="DURATION_COMPLETED", is_completed=True)

    async def _telemetry_loop(self, collector: MetricsCollector, req: TestStartRequest):
        try:
            while self.active_status in (TestStatusEnum.RUNNING, TestStatusEnum.PAUSED):
                snapshot = collector.get_snapshot()
                await websocket_hub.broadcast_metric_snapshot(snapshot)

                # Evaluate Circuit Breaker
                tripped, reason = safety_governor.check_circuit_breaker(
                    test_id=collector.test_id,
                    error_rate_pct=snapshot.error_rate_pct,
                    avg_latency_ms=snapshot.avg_latency_ms,
                    cpu_usage_pct=snapshot.cpu_usage_pct,
                    total_ops=snapshot.success_count + snapshot.error_count,
                    threshold_error_pct=req.emergency_threshold_error_pct or 50.0,
                    threshold_latency_ms=req.emergency_threshold_latency_ms or 5000.0
                )
                if tripped:
                    print(f"[Orchestrator] CIRCUIT BREAKER TRIPPED: {reason}")
                    await self.emergency_stop(reason=f"Circuit Breaker: {reason}")
                    break

                await asyncio.sleep(0.25)
        except asyncio.CancelledError:
            pass

    async def pause_test(self) -> Dict[str, Any]:
        async with self._lock:
            if self.active_status != TestStatusEnum.RUNNING or not self.active_engine:
                return {"status": self.active_status, "message": "Test is not running."}
            self.active_engine.pause()
            self.active_status = TestStatusEnum.PAUSED
            if self.active_collector:
                self.active_collector.status = TestStatusEnum.PAUSED
            await websocket_hub.broadcast_event("TEST_PAUSED", {"test_id": self.active_test_id})
            return {"status": "PAUSED", "test_id": self.active_test_id}

    async def resume_test(self) -> Dict[str, Any]:
        async with self._lock:
            if self.active_status != TestStatusEnum.PAUSED or not self.active_engine:
                return {"status": self.active_status, "message": "Test is not paused."}
            self.active_engine.resume()
            self.active_status = TestStatusEnum.RUNNING
            if self.active_collector:
                self.active_collector.status = TestStatusEnum.RUNNING
            await websocket_hub.broadcast_event("TEST_RESUMED", {"test_id": self.active_test_id})
            return {"status": "RUNNING", "test_id": self.active_test_id}

    async def stop_test(self, reason: str = "USER_REQUESTED", is_completed: bool = False) -> Optional[TestReport]:
        async with self._lock:
            if not self.active_test_id:
                return self._last_report

            current_test_id = self.active_test_id
            engine = self.active_engine
            collector = self.active_collector

            self.active_status = TestStatusEnum.STOPPING

            if engine:
                await engine.stop()

            if self._engine_task and not self._engine_task.done():
                self._engine_task.cancel()
            if self._telemetry_task and not self._telemetry_task.done():
                self._telemetry_task.cancel()

            status = TestStatusEnum.COMPLETED if is_completed else TestStatusEnum.ABORTED

            final_report = None
            if collector:
                collector.status = status
                collector.abort_reason = None if is_completed else reason
                collector.end_time = time.time()
                final_report = collector.generate_final_report()
                storage.save_report(final_report)
                storage.log_audit_event("STOP_TEST", current_test_id, {
                    "reason": reason,
                    "is_completed": is_completed,
                    "target_rps": final_report.target_rps,
                    "peak_generated_rps": final_report.peak_generated_rps,
                    "total_operations": final_report.successful_operations + final_report.failed_operations
                })

                final_snap = collector.get_snapshot()
                self._last_snapshot = final_snap
                await websocket_hub.broadcast_metric_snapshot(final_snap)
                await websocket_hub.broadcast_event("TEST_FINISHED", {
                    "test_id": current_test_id,
                    "report": final_report.model_dump()
                })

            self._last_report = final_report
            self.active_test_id = None
            self.active_engine = None
            self.active_collector = None
            self.active_status = TestStatusEnum.IDLE

            return final_report

    async def emergency_stop(self, reason: str = "EMERGENCY_STOP_TRIGGERED") -> Optional[TestReport]:
        if self.active_collector:
            self.active_collector.status = TestStatusEnum.CIRCUIT_BROKEN
            self.active_collector.abort_reason = reason
        storage.log_audit_event("EMERGENCY_STOP", self.active_test_id or "unknown", {"reason": reason})
        return await self.stop_test(reason=reason, is_completed=False)

    def get_current_status(self) -> Dict[str, Any]:
        snap = self.active_collector.get_snapshot().model_dump() if self.active_collector else (self._last_snapshot.model_dump() if self._last_snapshot else None)
        return {
            "status": self.active_status,
            "active_test_id": self.active_test_id,
            "snapshot": snap
        }

    def get_last_snapshot(self) -> Optional[MetricSnapshot]:
        return self._last_snapshot

orchestrator = Orchestrator()

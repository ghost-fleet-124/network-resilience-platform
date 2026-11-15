import pytest
import asyncio
import os
import sys

# Ensure backend package can be imported
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import (
    TestStartRequest,
    ProtocolEnum,
    IntensityPresetEnum,
    TestStatusEnum
)
from app.core.safety_governor import safety_governor
from app.core.metrics_collector import MetricsCollector
from app.mock_targets.mock_manager import MockManager
from app.core.cluster_manager import cluster_manager
from app.config import PRESET_CONFIGS

@pytest.mark.asyncio
async def test_all_eight_enterprise_presets_numerical_rps():
    # Verify all 8 exact numerical profiles requested by user
    assert PRESET_CONFIGS[IntensityPresetEnum.LOW].target_rps == 80000
    assert PRESET_CONFIGS[IntensityPresetEnum.MEDIUM].target_rps == 200000
    assert PRESET_CONFIGS[IntensityPresetEnum.HIGH].target_rps == 500000
    assert PRESET_CONFIGS[IntensityPresetEnum.LARGE].target_rps == 750000
    assert PRESET_CONFIGS[IntensityPresetEnum.MASSIVE].target_rps == 1000000
    assert PRESET_CONFIGS[IntensityPresetEnum.ULTRA_MASSIVE].target_rps == 2000000
    assert PRESET_CONFIGS[IntensityPresetEnum.SUPER_MASSIVE].target_rps == 3000000
    assert PRESET_CONFIGS[IntensityPresetEnum.SUPER_ULTRA_MASSIVE].target_rps == 5000000

@pytest.mark.asyncio
async def test_high_intensity_safety_confirmation_gate():
    # High-intensity test against external host without acknowledgment should raise PermissionError
    req_unack = TestStartRequest(
        host="staging-api.mygameserver.com",
        port=443,
        protocol=ProtocolEnum.HTTPS,
        intensity=IntensityPresetEnum.SUPER_ULTRA_MASSIVE, # 5,000,000 Target RPS
        safety_confirmation_acknowledged=False
    )
    with pytest.raises(PermissionError) as exc_info:
        safety_governor.enforce_traffic_budget(req_unack)
    assert "safety confirmation" in str(exc_info.value).lower()

    # With safety acknowledgment, it should be approved and budget clamped
    req_ack = TestStartRequest(
        host="staging-api.mygameserver.com",
        port=443,
        protocol=ProtocolEnum.HTTPS,
        intensity=IntensityPresetEnum.SUPER_ULTRA_MASSIVE,
        safety_confirmation_acknowledged=True
    )
    preset_cfg, rate, conns = safety_governor.enforce_traffic_budget(req_ack)
    assert rate == 5000000
    assert conns <= 50000

@pytest.mark.asyncio
async def test_cluster_capacity_and_workload_sharding():
    # Benchmark local node
    benchmarked = cluster_manager.benchmark_local_capacity()
    assert benchmarked >= 50000
    
    # Distribute 1,000,000 RPS workload
    allocations, nodes_needed, warning = cluster_manager.distribute_workload(1000000)
    assert nodes_needed > 1
    assert "node_master_local" in allocations
    # Honest capacity warning should be emitted when target exceeds single node
    assert warning is not None
    assert "exceeds current cluster capacity" in warning

@pytest.mark.asyncio
async def test_numerical_rps_telemetry_collector():
    collector = MetricsCollector(
        test_id="test_rps_telemetry",
        protocol=ProtocolEnum.HTTP,
        intensity=IntensityPresetEnum.LOW,
        target_rps=80000,
        host="127.0.0.1",
        port=8000,
        ramp_up_sec=1,
        sustained_sec=10,
        ramp_down_sec=1
    )
    # Simulate worker generating requests and receiving responses
    collector.record_request_generated(count=50, bytes_transferred=2048)
    collector.record_request_result(latency_ms=15.0, success=True, bytes_transferred=2048, status_code=200)
    collector.record_request_result(latency_ms=250.0, success=False, bytes_transferred=0, status_code=503)

    snap = collector.get_snapshot()
    assert snap.target_rps == 80000
    assert snap.generated_rps > 0
    assert snap.successful_rps > 0
    assert snap.failed_rps > 0
    assert snap.nodes_needed_for_target >= 1

@pytest.mark.asyncio
async def test_mock_manager_lifecycle():
    mgr = MockManager()
    test_ports = {
        "UDP_TICK": 9101,
        "TCP_ECHO": 9102,
        "HTTP_AUTH": 9103,
        "WS_LOBBY": 9104,
        "GAME_SERVER": 9105
    }
    res = await mgr.start_all(custom_ports=test_ports)
    assert res["status"] in ("RUNNING", "ALREADY_RUNNING")
    assert mgr.is_running is True
    await mgr.stop_all()
    assert mgr.is_running is False

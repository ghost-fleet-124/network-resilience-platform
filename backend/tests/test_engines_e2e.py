import pytest
import asyncio
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models import TestStartRequest, ProtocolEnum, IntensityPresetEnum, TestStatusEnum
from app.core.orchestrator import orchestrator

@pytest.mark.asyncio
async def test_udp_load_generation_e2e():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9001,
        protocol=ProtocolEnum.UDP,
        intensity=IntensityPresetEnum.LOW,
        duration_sec=3
    )
    res = await orchestrator.start_test(req)
    assert res["status"] == "RUNNING"
    
    await asyncio.sleep(1.2)
    
    status = orchestrator.get_current_status()
    assert status["status"] == TestStatusEnum.RUNNING
    snap = status["snapshot"]
    assert snap is not None
    assert snap["total_packets_sent"] > 0
    
    report = await orchestrator.stop_test(reason="TEST_COMPLETE", is_completed=True)
    assert report is not None
    assert report.total_packets_sent > 0
    assert report.total_packets_received > 0

@pytest.mark.asyncio
async def test_tcp_load_generation_e2e():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9002,
        protocol=ProtocolEnum.TCP,
        intensity=IntensityPresetEnum.LOW,
        duration_sec=3
    )
    res = await orchestrator.start_test(req)
    assert res["status"] == "RUNNING"
    await asyncio.sleep(1.2)
    
    status = orchestrator.get_current_status()
    snap = status["snapshot"]
    assert snap["successful_conns"] > 0
    assert snap["total_requests"] > 0
    
    report = await orchestrator.stop_test(reason="TEST_COMPLETE", is_completed=True)
    assert report is not None
    assert report.successful_operations > 0

@pytest.mark.asyncio
async def test_http_load_generation_e2e():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9003,
        protocol=ProtocolEnum.HTTP,
        intensity=IntensityPresetEnum.LOW,
        duration_sec=3,
        http_path="/api/auth",
        http_method="POST",
        http_payload='{"username":"pro_gamer"}'
    )
    res = await orchestrator.start_test(req)
    assert res["status"] == "RUNNING"
    await asyncio.sleep(1.2)
    
    status = orchestrator.get_current_status()
    snap = status["snapshot"]
    assert snap["total_requests"] > 0
    assert snap["status_codes"].get("200", 0) > 0
    
    report = await orchestrator.stop_test(reason="TEST_COMPLETE", is_completed=True)
    assert report.successful_operations > 0

@pytest.mark.asyncio
async def test_websocket_load_generation_e2e():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9004,
        protocol=ProtocolEnum.WEBSOCKET,
        intensity=IntensityPresetEnum.LOW,
        duration_sec=3,
        ws_path="/"
    )
    res = await orchestrator.start_test(req)
    assert res["status"] == "RUNNING"
    await asyncio.sleep(1.2)
    
    status = orchestrator.get_current_status()
    snap = status["snapshot"]
    assert snap["total_requests"] > 0
    
    report = await orchestrator.stop_test(reason="TEST_COMPLETE", is_completed=True)
    assert report.successful_operations > 0

@pytest.mark.asyncio
async def test_game_udp_protocol_simulation_e2e():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9005,
        protocol=ProtocolEnum.GAME_UDP,
        intensity=IntensityPresetEnum.LOW,
        duration_sec=3,
        game_tick_hz=60
    )
    res = await orchestrator.start_test(req)
    assert res["status"] == "RUNNING"
    await asyncio.sleep(1.2)
    
    status = orchestrator.get_current_status()
    snap = status["snapshot"]
    assert snap["total_packets_sent"] > 0
    
    report = await orchestrator.stop_test(reason="TEST_COMPLETE", is_completed=True)
    assert report.total_packets_sent > 0
    assert report.total_packets_received > 0

@pytest.mark.asyncio
async def test_emergency_stop_cut_off():
    req = TestStartRequest(
        host="127.0.0.1",
        port=9001,
        protocol=ProtocolEnum.UDP,
        intensity=IntensityPresetEnum.HIGH,
        duration_sec=30
    )
    await orchestrator.start_test(req)
    await asyncio.sleep(0.5)
    
    report = await orchestrator.emergency_stop(reason="MANUAL_KILL_SWITCH_PRESSED")
    assert orchestrator.active_status == TestStatusEnum.IDLE
    assert report is not None
    assert report.status == TestStatusEnum.CIRCUIT_BROKEN or report.abort_reason == "MANUAL_KILL_SWITCH_PRESSED"

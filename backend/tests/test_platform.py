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

@pytest.mark.asyncio
async def test_website_analysis_metrics_and_scorecard():
    collector = MetricsCollector(
        test_id="test_website_analysis",
        protocol=ProtocolEnum.HTTP_WEBSITE,
        intensity=IntensityPresetEnum.LOW,
        target_rps=80000,
        host="127.0.0.1",
        port=9003,
        ramp_up_sec=1,
        sustained_sec=5,
        ramp_down_sec=1
    )
    # Simulate normal website traffic
    for _ in range(20):
        collector.record_request_generated(1, 1024)
        collector.record_request_result(latency_ms=12.5, success=True, bytes_transferred=4500, status_code=200)
    # Simulate a redirect
    collector.record_request_generated(1, 512)
    collector.record_request_result(latency_ms=8.0, success=True, bytes_transferred=300, status_code=302)
    # Simulate a timeout
    collector.record_request_generated(1, 512)
    collector.record_request_result(latency_ms=5000.0, success=False, bytes_transferred=0, status_code=504)

    collector.get_snapshot()
    report = collector.generate_final_report()
    assert report.website_analysis is not None
    assert report.website_analysis["successful_request_pct"] > 90.0
    assert report.website_analysis["timeouts_count"] == 1
    assert "200" in report.website_analysis["status_code_breakdown"]
    assert "302" in report.website_analysis["status_code_breakdown"]
    assert "504" in report.website_analysis["status_code_breakdown"]
    assert report.website_analysis["summary"] is not None

@pytest.mark.asyncio
async def test_approved_scope_authorization_without_challenge_files():
    # 1. Wildcard domain match (*.staging.apexgaming.net)
    res = await safety_governor.verify_target_authorization("api.staging.apexgaming.net", 443)
    assert res.is_authorized is True
    assert "scope_apex_staging" in res.scope
    assert res.scope_name == "Apex Championship Staging & Internal Services"
    assert "ciso-security@apexgaming.net" in res.message
    # Proves no challenge token or file was required
    assert "challenge.txt" not in res.message

    # 2. CIDR subnet match (198.51.100.0/24)
    res_cidr = await safety_governor.verify_target_authorization("198.51.100.42", 9001)
    assert res_cidr.is_authorized is True
    assert "scope_tournament_subnet" in res_cidr.scope
    assert res_cidr.verification_method == "ORGANIZATION_SCOPE"

    # 3. Localhost and RFC1918 private network are always authorized
    res_local = await safety_governor.verify_target_authorization("127.0.0.1", 9003)
    assert res_local.is_authorized is True
    assert res_local.scope == "LOCAL_SANDBOX"

    res_priv = await safety_governor.verify_target_authorization("10.0.4.15", 8080)
    assert res_priv.is_authorized is True
    assert res_priv.scope == "PRIVATE_NETWORK"

@pytest.mark.asyncio
async def test_unauthorized_target_rejected_with_clear_explanation():
    # Unauthorized third-party target must be rejected
    res = await safety_governor.verify_target_authorization("unauthorized-public-target.com", 443)
    assert res.is_authorized is False
    assert res.scope == "UNAUTHORIZED_EXTERNAL_TARGET"
    assert "not covered by any active authorized testing scope" in res.message
    assert res.rejection_reason is not None
    assert "approved scopes" in res.rejection_reason.lower()
    # No mention of .well-known/resilience-challenge.txt
    assert "challenge.txt" not in res.message
    assert "challenge.txt" not in (res.rejection_reason or "")

@pytest.mark.asyncio
async def test_expired_scope_rejected():
    # Scope 'scope_legacy_game_2025' expired in the past
    res = await safety_governor.verify_target_authorization("legacy.tournament-2025.com", 443)
    assert res.is_authorized is False
    assert "EXPIRED" in res.message
    assert res.rejection_reason is not None
    assert "expired" in res.rejection_reason.lower()

@pytest.mark.asyncio
async def test_terms_and_acceptable_use_policy_specifications():
    from app.core.legal_governance import ACCEPTABLE_USE_POLICY
    
    # 1. Purpose and Authorized Scope (Lawful resilience/capacity only)
    c1 = next(c for c in ACCEPTABLE_USE_POLICY["clauses"] if c["id"] == "AUP-01")
    assert "lawful" in c1["summary"].lower() or "capacity" in c1["summary"].lower()

    # 2. Ownership and Explicit Permission Mandatory
    c2 = next(c for c in ACCEPTABLE_USE_POLICY["clauses"] if c["id"] == "AUP-02")
    assert "ownership" in c2["summary"].lower() or "written authorization" in c2["summary"].lower()

    # 3. Operator Responsibility for Approvals (ISPs, clouds)
    c3 = next(c for c in ACCEPTABLE_USE_POLICY["clauses"] if c["id"] == "AUP-03")
    assert "approvals" in c3["summary"].lower() or "upstream" in c3["summary"].lower()

    # 4. Strictly Prohibited Activities (DoS, DDoS, unauthorized disruption)
    c4 = next(c for c in ACCEPTABLE_USE_POLICY["clauses"] if c["id"] == "AUP-04")
    assert "denial-of-service" in c4["summary"].lower() or "forbidden" in c4["summary"].lower()

    # 5. Enforcement, Suspension, and Termination
    c5 = next(c for c in ACCEPTABLE_USE_POLICY["clauses"] if c["id"] == "AUP-05")
    assert "suspension" in c5["summary"].lower() or "violations" in c5["summary"].lower()

    # Explicit disclaimer: Accepting T&C alone does NOT grant permission to test an external target
    assert "does not by itself grant technical permission to test an external target" in ACCEPTABLE_USE_POLICY["non_authorization_disclaimer"].lower()

@pytest.mark.asyncio
async def test_privacy_policy_and_data_self_service():
    from app.core.legal_governance import PRIVACY_POLICY
    from app.core.storage import storage
    
    # Verify 5 privacy clauses
    clause_ids = [c["id"] for c in PRIVACY_POLICY["clauses"]]
    assert "PRIV-01" in clause_ids # Metadata collected
    assert "PRIV-02" in clause_ids # Storage & encryption
    assert "PRIV-03" in clause_ids # Retention schedule (90-day / 365-day)
    assert "PRIV-04" in clause_ids # Export & deletion rights
    assert "PRIV-05" in clause_ids # Protection of authorization records

    # Test self-service export
    exported = storage.export_all_records()
    assert "export_timestamp" in exported
    assert "reports" in exported
    assert "audit_events" in exported

    # Test self-service purge
    purge_res = storage.purge_eligible_data()
    assert purge_res["status"] == "COMPLETED"
    assert "purged_reports_count" in purge_res

@pytest.mark.asyncio
async def test_all_tests_recorded_with_audit_trail():
    from app.core.storage import storage
    
    # Check that audit log exists and records action, test_id, timestamp, details
    events = storage.get_audit_events(limit=10)
    assert len(events) > 0
    latest = events[0]
    assert "action" in latest
    assert "timestamp" in latest
    assert "details" in latest

@pytest.mark.asyncio
async def test_register_website_target_and_select_in_test_lifecycle():
    from app.core.safety_governor import safety_governor
    from app.core.orchestrator import orchestrator
    from app.models import RegisterScopeRequest, TestStartRequest, ProtocolEnum, IntensityPresetEnum
    import asyncio
    
    # 1. Register a website target with full URL
    reg_req = RegisterScopeRequest(
        name="Private Enterprise Portal Staging",
        organization="Private Enterprise Tech Lab",
        authorized_by="security-team@internal-resilience.net",
        target_pattern="https://staging-portal.internal-resilience.net:8443",
        valid_days=60,
        max_rps_allowed=500000,
        terms_acknowledged=True
    )
    scope = safety_governor.register_scope(reg_req)
    assert scope is not None
    assert scope.scope_id is not None
    assert scope.target_id == scope.scope_id
    assert 8443 in scope.allowed_ports
    assert scope.target_pattern == "staging-portal.internal-resilience.net"

    # 2. Verify target lookup by target_id
    verif = await safety_governor.verify_target_authorization(
        host="staging-portal.internal-resilience.net",
        port=8443,
        target_id=scope.scope_id
    )
    assert verif.is_authorized is True
    assert verif.target_id == scope.scope_id
    assert verif.scope == scope.scope_id

    # 3. Verify target lookup by domain even if target_id is omitted
    verif_by_host = await safety_governor.verify_target_authorization(
        host="staging-portal.internal-resilience.net",
        port=8443
    )
    assert verif_by_host.is_authorized is True
    assert verif_by_host.target_id is not None
    assert "enterprise" in verif_by_host.scope_name.lower()

    # 4. Verify that apex/www equivalence works
    verif_www = await safety_governor.verify_target_authorization(
        host="www.staging-portal.internal-resilience.net",
        port=8443
    )
    assert verif_www.is_authorized is True

    # 5. Verify that out-of-scope external targets are rejected with clear explanation
    unauth = await safety_governor.verify_target_authorization(
        host="unapproved-random-website.com",
        port=443
    )
    assert unauth.is_authorized is False
    assert "UNAUTHORIZED_EXTERNAL_TARGET" in unauth.scope
    assert "not registered" in unauth.rejection_reason

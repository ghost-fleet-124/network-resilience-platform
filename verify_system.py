import urllib.request
import json
import time
import sys
import os

def log(msg):
    print(f"[Verification] {msg}")

def test_api():
    base_url = "http://127.0.0.1:8000"
    log("Checking API health...")
    req = urllib.request.Request(f"{base_url}/health")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        assert data["status"] == "HEALTHY", f"Unexpected health response: {data}"
    log("Health endpoint OK.")

    log("Checking enterprise 8-tier presets with explicit numerical RPS targets...")
    req = urllib.request.Request(f"{base_url}/api/targets/presets")
    with urllib.request.urlopen(req) as resp:
        presets = json.loads(resp.read().decode())
        expected_tiers = {
            "LOW": 80000,
            "MEDIUM": 200000,
            "HIGH": 500000,
            "LARGE": 750000,
            "MASSIVE": 1000000,
            "ULTRA_MASSIVE": 2000000,
            "SUPER_MASSIVE": 3000000,
            "SUPER_ULTRA_MASSIVE": 5000000
        }
        for tier, target in expected_tiers.items():
            assert tier in presets, f"Missing preset {tier}"
            assert presets[tier]["target_rps"] == target, f"Mismatch for {tier}: expected {target}, got {presets[tier]['target_rps']}"
            log(f"  ✓ {tier:20}: {presets[tier]['target_rps']:>9,} Target RPS ({presets[tier]['recommended_cluster_nodes']} cluster nodes)")

    log("Checking distributed cluster manager status & node benchmark...")
    req = urllib.request.Request(f"{base_url}/api/targets/cluster/nodes")
    with urllib.request.urlopen(req) as resp:
        cluster_info = json.loads(resp.read().decode())
        nodes = cluster_info["nodes"]
        log(f"Active generator nodes: {len(nodes)}, Total Measured Capacity: {cluster_info['total_capacity_rps']:,} RPS")

    log("Running hardware benchmark on local generator node...")
    req = urllib.request.Request(f"{base_url}/api/targets/cluster/benchmark", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        bench_data = json.loads(resp.read().decode())
        log(f"Benchmark completed: Local hardware limit = {bench_data['measured_max_rps']:,} RPS")

    log("Launching test with explicit numerical workload (Low = 80,000 Target RPS) on UDP 9001...")
    start_payload = json.dumps({
        "host": "127.0.0.1",
        "port": 9001,
        "protocol": "UDP",
        "intensity": "LOW",
        "duration_sec": 3,
        "ramp_up_sec": 1,
        "sustained_sec": 2,
        "ramp_down_sec": 1,
        "safety_confirmation_acknowledged": True
    }).encode("utf-8")
    req = urllib.request.Request(
        f"{base_url}/api/tests/start",
        data=start_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        test_info = json.loads(resp.read().decode())
        log(f"Test launched: Target={test_info['target_rps']:,} RPS, Nodes Active={test_info['active_cluster_nodes']}")

    time.sleep(1.5)

    log("Inspecting live 4-pillar RPS telemetry...")
    req = urllib.request.Request(f"{base_url}/api/tests/status")
    with urllib.request.urlopen(req) as resp:
        status_data = json.loads(resp.read().decode())
        snap = status_data.get("snapshot")
        assert snap is not None
        log(f"  1. Target Requested:   {snap['target_rps']:,} RPS")
        log(f"  2. Outbound Generated: {snap['generated_rps']:,.0f} RPS ({snap['packets_per_sec']:.0f} PPS)")
        log(f"  3. Server Received:    {snap['received_rps']:,.0f} RPS")
        log(f"  4. Processed Success:  {snap['successful_rps']:,.0f} RPS (Fail: {snap['failed_rps']:,.0f} RPS)")
        log(f"  Generator Load:        {snap['generator_capacity_pct']}% of measured hardware limit")

    log("Stopping test and evaluating final enterprise report...")
    req = urllib.request.Request(f"{base_url}/api/tests/stop", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        stop_res = json.loads(resp.read().decode())
        report = stop_res.get("report")
        assert report is not None
        log(f"Final Report: Target={report['target_rps']:,} RPS | Peak Generated={report['peak_generated_rps']:,.0f} RPS | SLA={report['sla_verdict']}")
        log(f"Cluster Scaling Analysis: {report.get('cluster_analysis')}")

    log("Verifying Prometheus /metrics exporter...")
    req = urllib.request.Request(f"{base_url}/metrics")
    with urllib.request.urlopen(req) as resp:
        metrics_text = resp.read().decode()
        assert "resilience_target_rps" in metrics_text
        assert "resilience_generated_rps" in metrics_text
        assert "resilience_received_rps" in metrics_text
        assert "resilience_cluster_max_rps" in metrics_text
        log("Prometheus exporter verified with explicit numerical RPS metrics.")

    log("ALL ENTERPRISE RPS REQUIREMENTS VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()

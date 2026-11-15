import urllib.request
import json
import time

def benchmark_http_website():
    base_url = "http://127.0.0.1:8000"
    print("=" * 60)
    print("BENCHMARKING HTTP WEBSITE LOAD TESTING")
    print("=" * 60)
    
    # 1. Start test with 50 virtual users against mock website homepage
    payload = json.dumps({
        "protocol": "HTTP_WEBSITE",
        "intensity": "LOW",
        "duration_sec": 4,
        "target_url": "http://127.0.0.1:9003/",
        "http_method": "GET",
        "http_follow_redirects": True,
        "http_keep_alive": True,
        "http_virtual_users": 50,
        "safety_confirmation_acknowledged": True
    }).encode("utf-8")
    
    req = urllib.request.Request(
        f"{base_url}/api/tests/start",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        start_res = json.loads(resp.read().decode())
        print(f"[Start] Test ID: {start_res.get('test_id')}, Protocol: {start_res.get('protocol')}")

    # Sample mid-flight at t = 1.0s, 2.0s, 3.0s
    for sec in [1.0, 2.0, 3.0]:
        time.sleep(1.0)
        req_status = urllib.request.Request(f"{base_url}/api/tests/status")
        with urllib.request.urlopen(req_status) as resp:
            stat = json.loads(resp.read().decode())
            snap = stat.get("snapshot", {})
            print(f"[t={sec}s] Generated RPS: {snap.get('generated_rps', 0):>7,.0f} | Received RPS: {snap.get('received_rps', 0):>7,.0f} | Total Requests: {snap.get('total_requests', 0):>7,}")

    # Stop test and get final report
    req_stop = urllib.request.Request(f"{base_url}/api/tests/stop", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req_stop) as resp:
        stop_res = json.loads(resp.read().decode())
        report = stop_res.get("report", {})
        print("\n" + "=" * 60)
        print("FINAL VERIFIED REPORT")
        print("=" * 60)
        print(f"Target RPS:               {report.get('target_rps'):,}")
        print(f"Peak Generated RPS:       {report.get('peak_generated_rps'):,.0f}")
        print(f"Total Successful Ops:     {report.get('successful_operations'):,}")
        print(f"Total Failed Ops:         {report.get('failed_operations'):,}")
        print(f"Average Latency:          {report.get('avg_latency_ms', 0):.2f} ms")
        print(f"P95 Latency:              {report.get('p95_latency_ms', 0):.2f} ms")
        print(f"P99 Latency:              {report.get('p99_latency_ms', 0):.2f} ms")
        print(f"Throughput:               {report.get('throughput_kbps', 0):,.1f} Kbps")
        print(f"SLA Verdict:              {report.get('sla_verdict')}")
        if "website_analysis" in report:
            wa = report["website_analysis"]
            print(f"Website Max Sustainable:  {wa.get('max_sustainable_rps'):,.0f} RPS")
            print(f"Website Scorecard:        {wa.get('summary')}")
        print("=" * 60)

if __name__ == "__main__":
    benchmark_http_website()

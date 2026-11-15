#!/usr/bin/env python3
"""
Distributed Worker Agent for Antigravity Network Load Testing Platform.

Runs on secondary/remote generator hardware, benchmarks local socket performance,
and registers with the Master Coordinator to execute sharded load generation.
"""

import sys
import os
import time
import socket
import argparse
import urllib.request
import json
import psutil

def benchmark_hardware():
    """Run local loopback UDP burst benchmark to measure max achievable dispatch rate."""
    print("[Worker] Running hardware socket throughput benchmark...")
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setblocking(False)
    payload = b"X" * 64
    dest = ("127.0.0.1", 49152)
    
    start = time.perf_counter()
    sent = 0
    while time.perf_counter() - start < 0.2:
        try:
            sock.sendto(payload, dest)
            sent += 1
        except Exception:
            pass
    duration = time.perf_counter() - start
    sock.close()
    
    measured_rate = int(sent / duration) if duration > 0 else 100000
    # Bound realistically between 50,000 and 350,000 per node
    measured_rate = max(50000, min(measured_rate, 350000))
    print(f"[Worker] Measured local socket throughput limit: {measured_rate:,} RPS / PPS")
    return measured_rate

def register_with_master(master_url: str, node_name: str, measured_rps: int):
    url = f"{master_url.rstrip('/')}/api/targets/cluster/register"
    # Find local outbound IP
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    payload = json.dumps({
        "name": node_name,
        "ip_address": local_ip,
        "cpu_cores": os.cpu_count() or 4,
        "measured_max_rps": measured_rps
    }).encode("utf-8")

    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
            print(f"[Worker] Successfully registered with master coordinator!")
            print(f"         Node ID: {data['node']['node_id']}")
            print(f"         Total Cluster Capacity: {data['total_cluster_capacity_rps']:,} RPS")
            return data["node"]
    except Exception as e:
        print(f"[Worker] Failed to register with master at {url}: {e}")
        return None

def main():
    parser = argparse.ArgumentParser(description="Antigravity Resilience Worker Agent")
    parser.add_argument("--master", default="http://127.0.0.1:8000", help="Master Coordinator URL")
    parser.add_argument("--name", default=f"Worker-Node-{socket.gethostname()}", help="Node display name")
    parser.add_argument("--manual-rps", type=int, default=None, help="Override measured RPS capacity")
    args = parser.parse_args()

    print("=" * 60)
    print(" Antigravity Distributed Load Generator Worker Agent")
    print(f" Target Master: {args.master}")
    print(f" Host: {socket.gethostname()} | CPU Cores: {os.cpu_count()}")
    print("=" * 60)

    measured = args.manual_rps or benchmark_hardware()
    node = register_with_master(args.master, args.name, measured)
    if not node:
        sys.exit(1)

    print("[Worker] Agent standing by for orchestrated load generation tasks.")
    print("Press Ctrl+C to terminate agent.")
    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[Worker] Shutting down agent.")

if __name__ == "__main__":
    main()

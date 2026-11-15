# Production Deployment & High-Capacity Tuning Guide

## 1. Operating System Tuning for High-Concurrency Testing

When generating thousands of concurrent connections (e.g. on `Massive`, `Super Massive`, or `Ultra Massive` presets), operating system resource limits must be properly configured:

### 1.1 Linux / Unix Environments
* **File Descriptors**: Increase max open files for the generator process:
  ```bash
  ulimit -n 65535
  ```
* **TCP Backlog & Socket Re-use**:
  Add to `/etc/sysctl.conf`:
  ```ini
  net.core.somaxconn = 65535
  net.ipv4.tcp_max_syn_backlog = 65535
  net.ipv4.tcp_tw_reuse = 1
  net.ipv4.ip_local_port_range = 1024 65535
  ```
  Apply with: `sudo sysctl -p`.

### 1.2 Windows Environments
* Increase ephemeral port range:
  ```powershell
  netsh int ipv4 set dynamicport tcp start=1025 num=64510
  ```
* Adjust `TcpTimedWaitDelay` in Registry:
  `HKLM\SYSTEM\CurrentControlSet\Services\Tcpip\Parameters\TcpTimedWaitDelay = 30` (DWORD).

---

## 2. Docker & Container Deployment

### Dockerfile
```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY frontend/dist ./frontend/dist
COPY run_backend.py ./

EXPOSE 8000 9001 9002 9003 9004 9005

CMD ["python", "run_backend.py"]
```

### Docker Compose
```yaml
version: '3.8'
services:
  resilience-platform:
    build: .
    ports:
      - "8000:8000"
      - "9001:9001/udp"
      - "9002:9002"
      - "9003:9003"
      - "9004:9004"
      - "9005:9005/udp"
    restart: unless-stopped
    ulimits:
      nofile:
        soft: 65535
        hard: 65535
```

---

## 3. Prometheus & Grafana Configuration

### Prometheus Scrape Configuration (`prometheus.yml`):
```yaml
scrape_configs:
  - job_name: 'resilience_platform'
    scrape_interval: 1s
    static_configs:
      - targets: ['localhost:8000']
```
Prometheus metrics exposed:
- `resilience_test_active`
- `resilience_req_per_sec`
- `resilience_packets_per_sec`
- `resilience_active_connections`
- `resilience_latency_avg_ms`
- `resilience_latency_p95_ms`
- `resilience_latency_p99_ms`
- `resilience_packet_loss_pct`
- `resilience_throughput_kbps`
- `resilience_generator_cpu_pct`
- `resilience_generator_ram_pct`

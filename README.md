# Antigravity Enterprise Network Load Testing Platform

An enterprise-grade, distributed multi-protocol network traffic simulation and resilience verification platform engineered for high-concurrency multiplayer gaming infrastructure, real-time communication channels, and distributed services.

Scalable across distributed load-generator worker clusters with explicit numerical Request-Per-Second (RPS) profiles up to **5,000,000 Target RPS**.

---

## 1. Enterprise Numerical RPS Profiles

Every intensity level corresponds to an explicit numerical workload target:

| Intensity Tier | Target RPS | Max Socket Pool | Bandwidth Ceiling | Cluster Sizing Recommendation | Operational Role |
| :--- | :---:| :---:| :---:| :---:| :--- |
| **Low** | **80,000** | 500 conns | 100 Mbps | 1 Node | Enterprise baseline connectivity check |
| **Medium** | **200,000** | 1,500 conns | 250 Mbps | 2 Nodes | Typical production player activity |
| **High** | **500,000** | 3,000 conns | 600 Mbps | 5 Nodes | Evening peak concurrent usage |
| **Large** | **750,000** | 5,000 conns | 1.0 Gbps | 8 Nodes | Major game launch ingress testing |
| **Massive** | **1,000,000** | 10,000 conns | 1.5 Gbps | 10 Nodes | Mega-scale stress testing (Seven figures) |
| **Ultra Massive** | **2,000,000** | 20,000 conns | 3.0 Gbps | 20 Nodes | Tournament championship concurrency |
| **Super Massive** | **3,000,000** | 35,000 conns | 5.0 Gbps | 30 Nodes | Hyper-scale global failover validation |
| **Super Ultra Massive** | **5,000,000** | **50,000 conns** | **8.0 Gbps** | **50 Nodes** | **Enterprise apex capacity benchmark** |

> **Honest Capacity Guarantee**: Workload values represent requested target profiles. The system benchmarks each generator machine's actual hardware dispatch limit, measures true outbound generated traffic, and explicitly reports how many worker machines are needed if current cluster capacity is saturated.

---

## 2. Four-Pillar RPS Measurement Model

The platform monitors and contrasts four distinct dimensions of traffic velocity in real time:

1. **Requested Target RPS**: The mathematical workload configured by the operator.
2. **Outbound Generated RPS**: Actual traffic emitted by the generator network sockets.
3. **Server Received RPS**: Confirmed requests received and acknowledged by the target server.
4. **Successfully Processed RPS**: Legitimate, non-error transactions (e.g. HTTP 2xx or valid UDP state ticks) vs failed/dropped transactions.

For UDP, transport-level **Packets Per Second (PPS)** are distinguished from application-level **Requests Per Second (RPS)**.

---

## 3. Distributed Generator Architecture

* **Worker Sharding**: Workload targets are distributed across active cluster nodes according to their benchmarked throughput limits.
* **Built-in Node Benchmarking**: Operators can click **"Test Local Limit"** in the Cluster Nodes panel to measure the host machine's actual socket throughput limit in real time.
* **Capacity Sizing Calculator**: When tests exceed available generator hardware, the platform automatically reports the exact deficit and displays the number of worker nodes needed to reach 100% saturation.

---

## 4. HTTP Website Load Testing & Flood Mode

The platform features a dedicated **HTTP Website Load Testing** mode for benchmarking websites, eCommerce stores, and API gateways:

* **Full URL Input & Auto-Parsing**: Enter `https://example.com/api/v1` or `http://127.0.0.1:9003/search?q=test` with automatic scheme, host, port, and query parsing.
* **HTTP & HTTPS with TLS Handshake Timing**: Evaluates SSL/TLS overhead under extreme concurrency.
* **GET & POST Workloads**: Supports form submissions, checkout payloads (`{"items": [...]}`), and custom JSON bodies.
* **Connection Reuse & Keep-Alive**: Toggle HTTP Keep-Alive (`force_close=False`) vs rapid TCP tear-downs simulating distinct visitor connections.
* **Redirect Traversal**: Follows HTTP 301/302 redirects without dropping session context.
* **Custom Headers**: Pass authorization bearer tokens, custom User-Agents, and cookies.
* **Website SLA Scorecard**: Automatically measures:
  - **Success Rate %** (2xx/3xx vs 4xx/5xx/Timeouts)
  - **Maximum Sustainable Request Rate (RPS)**
  - **Latency Degradation % under sustained load**
  - **HTTP Status Code Breakdown** (2xx, 3xx, 4xx, 5xx, 504 Timeouts)

---

## 5. Intelligent Safety Architecture

* **High-Intensity Confirmation Gate**: Any test targeting $\ge 500,000\text{ RPS}$ against external infrastructure requires an explicit operator confirmation affirming ownership or written testing authorization.
* **Target Scope Verification**: Distinguishes local sandbox targets (`127.0.0.1`, `localhost`), private RFC 1918 networks, and approved organization scopes (`*.staging.example.com`, subnets, or domain patterns) with zero challenge files required.
* **Acceptable Use Policy & Compliance**: Enforces explicit legal boundaries, terms of service, and privacy retention schedules. Accepting terms alone does not authorize external targets without a registered scope.
* **Emergency Circuit Breaker**: Auto-aborts tests if error rates exceed 50% or latency exceeds 5,000ms.
* **Instant Kill Switch**: Immediate termination of all worker sockets in $< 50\text{ ms}$.

---

## 5. Quick Start & Execution

```bash
# 1. Install dependencies
python -m pip install -r backend/requirements.txt

# 2. Build the frontend dashboard
cd frontend
npm install
npm run build
cd ..

# 3. Launch the platform (runs API, WebSockets, and local mock targets)
python run_backend.py
```
Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)** in your browser.

---

## 6. Automated Verification Suites

```bash
# Run the complete test suite (11 unit + integration tests)
pytest backend/tests/ -v

# Run the live end-to-end verification script
python verify_system.py
```

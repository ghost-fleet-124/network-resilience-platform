# System Architecture & Technical Specifications

## 1. Architectural Overview

The platform uses a distributed Control Plane and High-Performance Testing Agent design:

```
[ Browser / Frontend Client ]
           │
           │ REST (Commands) + WebSocket (Sub-second Telemetry)
           ▼
[ FastAPI Control Plane Gateway ] ───► [ Safety Governor & Allowlist ]
           │
           ├─────────────────────────► [ Metrics Collector & Percentile Engine ]
           │                                      │
           │                                      ▼
           ▼                         [ Prometheus Exporter & Storage ]
[ Traffic Orchestrator ]
           │
           ├──► [ UDP Engine ] ───────────────► Target Server (UDP Datagrams)
           ├──► [ Game Netcode Engine ] ──────► Target Game Server (60Hz Tick Netcode)
           ├──► [ TCP Engine ] ───────────────► Target Server (Streams)
           ├──► [ HTTP/S Engine ] ────────────► Target API Endpoints
           └──► [ WebSocket Engine ] ─────────► Target Matchmaking Lobbies
```

## 2. Protocol Engine Mechanics

### 2.1 UDP Game Tick Engine
* Datagram structure: `[4-byte uint32 sequence, 8-byte double timestamp, payload padding]`.
* Local UDP socket listening asynchronously: when datagram echo arrives, RTT is measured:
  $$\text{RTT} = (t_{\text{recv}} - t_{\text{send}}) \times 1000 \text{ ms}$$
* RFC 3550 Inter-Arrival Jitter calculation:
  $$J_i = J_{i-1} + \frac{|D(i-1, i)| - J_{i-1}}{16}$$
* Sequence tracking allows exact detection of dropped packets (Packet Loss %).

### 2.2 TCP Stream Engine
* Non-blocking socket connections with `TCP_NODELAY` and `SO_REUSEADDR`.
* Measures connection establishment handshake duration.
* Continuous framed ping-pong keepalives to measure persistent socket stability under high concurrency.

### 2.3 HTTP / HTTPS Engine
* Asynchronous connection pooling via `aiohttp.TCPConnector`.
* Full HTTP status code breakdown (2xx, 3xx, 4xx, 5xx) with millisecond-precision latency tracking.

### 2.4 WebSocket Engine
* Persistent bi-directional socket sessions with automatic ping/pong keepalives.
* Tracks handshake duration, message delivery round-trip time, and unexpected disconnection events.

### 2.5 Custom Multiplayer Netcode Protocol (20Hz - 128Hz)
* Binary packet framing:
  - Byte 0-3: Magic Header `0x47414D45` ("GAME")
  - Byte 4-7: Packet Type (1 = Handshake, 2 = Tick Input, 3 = State Sync Ack)
  - Byte 8-11: Player ID
  - Byte 12-15: Sequence Number
  - Byte 16-23: Double Timestamp (client send time)
  - Byte 24-39: Player Inputs (Position X, Y, Z, Action Flags)
* Accurately reproduces multiplayer client workloads during tournament matches.

## 3. Metrics Aggregator & Statistical Bounds
* Uses rolling sliding windows (last 2 seconds) for instantaneous rate (RPS / PPS), throughput (KB/s), and tail latency percentiles (P50, P95, P99).
* Reservoir sampling limits in-memory latency samples to 10,000 points per run, preventing unbounded memory growth.
* Telemetry fanout broadcasts snapshots to all connected dashboard clients every 250ms via `/ws/telemetry`.

from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field
import time

class ProtocolEnum(str, Enum):
    UDP = "UDP"
    TCP = "TCP"
    HTTP = "HTTP"
    HTTPS = "HTTPS"
    HTTP_WEBSITE = "HTTP_WEBSITE"
    WEBSOCKET = "WEBSOCKET"
    GAME_UDP = "GAME_UDP"
    GRPC = "GRPC"
    QUIC = "QUIC"

class IntensityPresetEnum(str, Enum):
    LOW = "LOW"                                 # 80,000 Target RPS
    MEDIUM = "MEDIUM"                           # 200,000 Target RPS
    HIGH = "HIGH"                               # 500,000 Target RPS
    LARGE = "LARGE"                             # 750,000 Target RPS
    MASSIVE = "MASSIVE"                         # 1,000,000 Target RPS
    ULTRA_MASSIVE = "ULTRA_MASSIVE"             # 2,000,000 Target RPS
    SUPER_MASSIVE = "SUPER_MASSIVE"             # 3,000,000 Target RPS
    SUPER_ULTRA_MASSIVE = "SUPER_ULTRA_MASSIVE" # 5,000,000 Target RPS

class TestStatusEnum(str, Enum):
    IDLE = "IDLE"
    INITIALIZING = "INITIALIZING"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPING = "STOPPING"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    CIRCUIT_BROKEN = "CIRCUIT_BROKEN"

class PresetConfig(BaseModel):
    name: str
    label: str
    target_rps: int
    description: str
    max_conns: int
    bandwidth_cap_mbps: int
    default_duration_sec: int
    max_duration_sec: int
    recommended_cluster_nodes: int

class ClusterNode(BaseModel):
    node_id: str
    name: str
    ip_address: str
    is_local: bool = True
    status: str = "ONLINE"  # ONLINE, BUSY, BENCHMARKING, OFFLINE
    cpu_cores: int = 4
    measured_max_rps: int = 100000
    allocated_target_rps: int = 0
    current_generated_rps: float = 0.0
    current_cpu_pct: float = 0.0
    current_ram_pct: float = 0.0

class TargetVerificationRequest(BaseModel):
    host: str
    port: int
    protocol: ProtocolEnum = ProtocolEnum.HTTP
    challenge_token: Optional[str] = None

class TargetVerificationResponse(BaseModel):
    host: str
    port: int
    is_authorized: bool
    scope: str
    message: str
    challenge_token: Optional[str] = None
    verification_method: Optional[str] = None

class TestStartRequest(BaseModel):
    host: str
    port: int
    protocol: ProtocolEnum = ProtocolEnum.HTTP
    intensity: IntensityPresetEnum = IntensityPresetEnum.LOW
    target_rps_override: Optional[int] = None
    duration_sec: Optional[int] = None
    
    # URL & Website Testing configuration
    target_url: Optional[str] = None
    http_method: Optional[str] = "GET"
    http_path: Optional[str] = "/"
    http_payload: Optional[str] = None
    http_headers: Optional[Dict[str, str]] = None
    http_follow_redirects: Optional[bool] = True
    http_keep_alive: Optional[bool] = True
    http_timeout_sec: Optional[float] = 5.0
    http_virtual_users: Optional[int] = None
    
    # Workload curve timings
    ramp_up_sec: Optional[int] = 5
    sustained_sec: Optional[int] = 30
    ramp_down_sec: Optional[int] = 5
    
    # Protocol & payload tuning
    packet_size_bytes: Optional[int] = Field(default=256, ge=32, le=4096)
    game_tick_hz: Optional[int] = Field(default=60, ge=10, le=128)
    ws_path: Optional[str] = "/"
    
    # Safety & emergency boundaries
    safety_confirmation_acknowledged: Optional[bool] = False
    emergency_threshold_error_pct: Optional[float] = 50.0
    emergency_threshold_latency_ms: Optional[float] = 5000.0

class MetricSnapshot(BaseModel):
    timestamp: float = Field(default_factory=time.time)
    test_id: str
    elapsed_sec: float
    status: TestStatusEnum
    
    # Explicit Numerical RPS breakdown
    target_rps: int = 0
    generated_rps: float = 0.0      # Traffic dispatched by workers
    received_rps: float = 0.0       # Responses/Acks received from target
    successful_rps: float = 0.0     # 2xx / valid state ticks per sec
    failed_rps: float = 0.0         # 4xx/5xx/drops/timeouts per sec
    
    # Protocol rates
    req_per_sec: float = 0.0        # Application level requests/sec
    packets_per_sec: float = 0.0    # Transport level datagrams/sec (PPS)
    
    # Counts
    active_conns: int = 0
    successful_conns: int = 0
    failed_conns: int = 0
    total_requests: int = 0
    total_packets_sent: int = 0
    total_packets_received: int = 0
    packet_loss_pct: float = 0.0
    throughput_kbps: float = 0.0
    
    # Latency percentiles
    avg_latency_ms: float = 0.0
    min_latency_ms: float = 0.0
    max_latency_ms: float = 0.0
    p50_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    jitter_ms: float = 0.0
    
    # Operations
    success_count: int = 0
    error_count: int = 0
    error_rate_pct: float = 0.0
    
    # Generator Node & Cluster Status
    cpu_usage_pct: float = 0.0
    ram_usage_pct: float = 0.0
    generator_capacity_pct: float = 0.0
    active_cluster_nodes: int = 1
    cluster_max_achievable_rps: float = 0.0
    nodes_needed_for_target: int = 1
    capacity_warning: Optional[str] = None
    
    status_codes: Dict[str, int] = Field(default_factory=dict)
    timeouts_count: int = 0
    tls_handshake_ms: float = 0.0
    avg_response_bytes: float = 0.0
    active_workers: int = 0
    safety_circuit_status: str = "NORMAL"

class TestReport(BaseModel):
    test_id: str
    target_host: str
    target_port: int
    protocol: ProtocolEnum
    intensity: IntensityPresetEnum
    target_rps: int = 0
    started_at: str
    finished_at: str
    duration_sec: float
    status: TestStatusEnum
    abort_reason: Optional[str] = None
    
    # RPS Performance summary
    peak_generated_rps: float = 0.0
    peak_received_rps: float = 0.0
    peak_successful_rps: float = 0.0
    avg_generated_rps: float = 0.0
    
    # Website specifics
    successful_request_pct: float = 0.0
    max_sustainable_rps: float = 0.0
    timeouts_count: int = 0
    website_analysis: Dict[str, Any] = Field(default_factory=dict)
    
    # Traffic totals
    total_packets_sent: int = 0
    total_packets_received: int = 0
    packet_loss_pct: float = 0.0
    total_requests: int = 0
    successful_operations: int = 0
    failed_operations: int = 0
    
    peak_throughput_kbps: float = 0.0
    avg_throughput_kbps: float = 0.0
    
    # Latency statistics
    avg_latency_ms: float = 0.0
    p50_latency_ms: float = 0.0
    p95_latency_ms: float = 0.0
    p99_latency_ms: float = 0.0
    max_latency_ms: float = 0.0
    avg_jitter_ms: float = 0.0
    
    status_codes: Dict[str, int] = Field(default_factory=dict)
    peak_cpu_pct: float = 0.0
    peak_ram_pct: float = 0.0
    
    # Cluster Capacity & Scaling Analysis
    cluster_analysis: Dict[str, Any] = Field(default_factory=dict)
    
    sla_verdict: str  # EXCELLENT, HEALTHY, DEGRADED, SATURATED / FAILED
    recommendations: List[str] = Field(default_factory=list)

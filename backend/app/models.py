from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, model_validator
from urllib.parse import urlparse
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
    host: Optional[str] = None
    port: Optional[int] = None
    protocol: ProtocolEnum = ProtocolEnum.HTTP
    target_url: Optional[str] = None

    @model_validator(mode="before")
    @classmethod
    def normalize_verification(cls, data: Any):
        if not isinstance(data, dict):
            return data
        target_url = (data.get("target_url") or "").strip()
        if target_url:
            raw = target_url
            if not (raw.startswith("http://") or raw.startswith("https://")):
                raw = "http://" + raw
            try:
                p = urlparse(raw)
                if p.hostname:
                    data["host"] = p.hostname
                data["port"] = p.port or (443 if p.scheme == "https" else 80)
            except Exception:
                pass
        if not data.get("host"):
            data["host"] = "127.0.0.1"
        if data.get("port") is None:
            data["port"] = 80
        return data

class ScopeStatusEnum(str, Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    REVOKED = "REVOKED"

class ApprovedScope(BaseModel):
    scope_id: str
    name: str
    organization: str
    authorized_by: str
    target_pattern: str # Domain wildcard, exact domain, CIDR, or IP
    allowed_ports: Optional[List[int]] = None
    max_rps_allowed: int = 1000000
    valid_from: float = Field(default_factory=time.time)
    valid_until: float
    terms_acknowledged: bool = True
    status: ScopeStatusEnum = ScopeStatusEnum.ACTIVE
    notes: Optional[str] = None
    created_at: float = Field(default_factory=time.time)

class RegisterScopeRequest(BaseModel):
    name: str
    organization: str
    authorized_by: str
    target_pattern: str
    allowed_ports: Optional[List[int]] = None
    valid_days: int = 30
    max_rps_allowed: int = 1000000
    notes: Optional[str] = None
    terms_acknowledged: bool = True

class TargetVerificationResponse(BaseModel):
    host: str
    port: int
    is_authorized: bool
    scope: str
    message: str
    scope_name: Optional[str] = None
    authorized_by: Optional[str] = None
    expires_at: Optional[float] = None
    rejection_reason: Optional[str] = None
    verification_method: Optional[str] = None

class TestStartRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    protocol: ProtocolEnum = ProtocolEnum.HTTP
    intensity: IntensityPresetEnum = IntensityPresetEnum.LOW
    target_rps_override: Optional[int] = None
    duration_sec: Optional[int] = None
    
    # URL & Website Testing configuration
    target_url: Optional[str] = None
    http_method: Optional[str] = "GET"
    http_path: Optional[str] = "/"
    http_payload: Optional[str] = None
    http_body_type: Optional[str] = "json"
    http_content_type: Optional[str] = None
    http_query_params: Optional[Dict[str, str]] = None
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

    @model_validator(mode="before")
    @classmethod
    def validate_and_normalize_target(cls, data: Any):
        if not isinstance(data, dict):
            return data
        
        target_url = (data.get("target_url") or "").strip()
        host = (data.get("host") or "").strip()
        port = data.get("port")
        proto = data.get("protocol") or "HTTP"

        if target_url:
            raw_url = target_url
            if not (raw_url.startswith("http://") or raw_url.startswith("https://")):
                raw_url = "http://" + raw_url
            
            try:
                parsed = urlparse(raw_url)
            except Exception as e:
                raise ValueError(f"Malformed target URL: {e}")

            if not parsed.hostname:
                raise ValueError("Target URL must include a valid hostname or IP address (e.g. http://127.0.0.1:9003/)")

            data["host"] = parsed.hostname
            data["port"] = parsed.port or (443 if parsed.scheme == "https" else 80)
            data["target_url"] = raw_url
            
            path = parsed.path or "/"
            if parsed.query:
                path += f"?{parsed.query}"
            data["http_path"] = path
            
            # Automatically recognize HTTPS vs HTTP if not specified
            if proto not in ("HTTP_WEBSITE", "HTTPS", "HTTP"):
                data["protocol"] = "HTTPS" if parsed.scheme == "https" else "HTTP_WEBSITE"
            elif proto == "HTTP" and parsed.scheme == "https":
                data["protocol"] = "HTTPS"
            elif proto == "HTTPS" and parsed.scheme == "http":
                data["protocol"] = "HTTP"

        elif not host or port is None:
            raise ValueError("Target host and port are required when Target URL is omitted.")

        return data

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
    
    # Counts & Lifecycle Accounting
    active_conns: int = 0
    successful_conns: int = 0
    failed_conns: int = 0
    total_requests: int = 0
    requests_scheduled: int = 0
    requests_dispatched: int = 0
    requests_completed: int = 0
    connection_errors: int = 0
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
    
    # Traffic totals & Lifecycle Accounting
    total_packets_sent: int = 0
    total_packets_received: int = 0
    packet_loss_pct: float = 0.0
    total_requests: int = 0
    requests_scheduled: int = 0
    requests_dispatched: int = 0
    requests_completed: int = 0
    connection_errors: int = 0
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

export type Protocol = 'UDP' | 'TCP' | 'HTTP' | 'HTTPS' | 'HTTP_WEBSITE' | 'WEBSOCKET' | 'GAME_UDP' | 'GRPC' | 'QUIC';

export type IntensityPreset = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'LARGE' 
  | 'MASSIVE' 
  | 'ULTRA_MASSIVE' 
  | 'SUPER_MASSIVE' 
  | 'SUPER_ULTRA_MASSIVE';

export type TestStatus = 
  | 'IDLE' 
  | 'INITIALIZING' 
  | 'RUNNING' 
  | 'PAUSED' 
  | 'STOPPING' 
  | 'COMPLETED' 
  | 'ABORTED' 
  | 'CIRCUIT_BROKEN';

export interface PresetDetails {
  name: string;
  label: string;
  target_rps: number;
  description: string;
  max_conns: number;
  bandwidth_cap_mbps: number;
  default_duration_sec: number;
  max_duration_sec: number;
  recommended_cluster_nodes: number;
}

export interface ClusterNode {
  node_id: string;
  name: string;
  ip_address: string;
  is_local: boolean;
  status: string;
  cpu_cores: number;
  measured_max_rps: number;
  allocated_target_rps: number;
  current_generated_rps: number;
  current_cpu_pct: number;
  current_ram_pct: number;
}

export interface MetricSnapshot {
  timestamp: number;
  test_id: string;
  elapsed_sec: number;
  status: TestStatus;
  
  // Numerical RPS breakdown
  target_rps: number;
  generated_rps: number;
  received_rps: number;
  successful_rps: number;
  failed_rps: number;
  
  // Explicit client vs server request tracking
  requests_scheduled?: number;
  requests_dispatched?: number;
  requests_completed?: number;
  connection_errors?: number;
  
  req_per_sec: number;
  packets_per_sec: number;
  
  active_conns: number;
  successful_conns: number;
  failed_conns: number;
  total_requests: number;
  total_packets_sent: number;
  total_packets_received: number;
  packet_loss_pct: number;
  throughput_kbps: number;
  
  avg_latency_ms: number;
  min_latency_ms: number;
  max_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  jitter_ms: number;
  
  success_count: number;
  error_count: number;
  error_rate_pct: number;
  
  cpu_usage_pct: number;
  ram_usage_pct: number;
  generator_capacity_pct: number;
  active_cluster_nodes: number;
  cluster_max_achievable_rps: number;
  nodes_needed_for_target: number;
  capacity_warning?: string;
  
  status_codes: Record<string, number>;
  timeouts_count?: number;
  avg_response_bytes?: number;
  active_workers: number;
  safety_circuit_status: string;
}

export interface TestReport {
  test_id: string;
  target_host: string;
  target_port: number;
  protocol: Protocol;
  intensity: IntensityPreset;
  target_rps: number;
  started_at: string;
  finished_at: string;
  duration_sec: number;
  status: TestStatus;
  abort_reason?: string;
  
  peak_generated_rps: number;
  peak_received_rps: number;
  peak_successful_rps: number;
  avg_generated_rps: number;
  
  successful_request_pct?: number;
  max_sustainable_rps?: number;
  timeouts_count?: number;
  website_analysis?: {
    successful_request_pct: number;
    max_sustainable_rps: number;
    status_code_breakdown: Record<string, number>;
    timeouts_count: number;
    avg_latency_ms: number;
    p50_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    throughput_kbps: number;
    degradation_under_load_pct: number;
    objective_met: boolean;
    summary: string;
  };
  
  total_packets_sent: number;
  total_packets_received: number;
  packet_loss_pct: number;
  total_requests: number;
  requests_scheduled?: number;
  requests_dispatched?: number;
  requests_completed?: number;
  connection_errors?: number;
  successful_operations: number;
  failed_operations: number;
  peak_throughput_kbps: number;
  avg_throughput_kbps: number;
  
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  max_latency_ms: number;
  avg_jitter_ms: number;
  status_codes: Record<string, number>;
  peak_cpu_pct: number;
  peak_ram_pct: number;
  
  cluster_analysis?: {
    target_rps: number;
    achieved_generated_rps: number;
    cluster_nodes_active: number;
    measured_cluster_capacity_rps: number;
    nodes_needed_for_target: number;
    cluster_utilization_pct: number;
  };
  
  sla_verdict: 'EXCELLENT' | 'HEALTHY' | 'DEGRADED' | 'SATURATED / FAILED';
  recommendations: string[];
}

export interface TargetVerification {
  host: string;
  port: number;
  is_authorized: boolean;
  scope: string;
  message: string;
  verification_method?: string;
}

export interface TestStartRequest {
  target_id?: string;
  scope_id?: string;
  host: string;
  port: number;
  protocol: Protocol;
  intensity: IntensityPreset;
  target_rps_override?: number;
  duration_sec?: number;
  target_url?: string;
  http_method?: string;
  http_path?: string;
  http_payload?: string;
  http_body_type?: 'json' | 'form' | 'raw';
  http_content_type?: string;
  http_query_params?: Record<string, string>;
  http_headers?: Record<string, string>;
  http_follow_redirects?: boolean;
  http_keep_alive?: boolean;
  http_timeout_sec?: number;
  http_virtual_users?: number;
  ramp_up_sec?: number;
  sustained_sec?: number;
  ramp_down_sec?: number;
  packet_size_bytes?: number;
  game_tick_hz?: number;
  ws_path?: string;
  safety_confirmation_acknowledged?: boolean;
}

export interface ApprovedScope {
  scope_id: string;
  name: string;
  organization: string;
  authorized_by: string;
  target_pattern: string;
  allowed_ports?: number[];
  max_rps_allowed: number;
  valid_from: number;
  valid_until: number;
  terms_acknowledged: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  notes?: string;
  created_at: number;
}

export interface TargetAuthStatus {
  loading: boolean;
  authorized: boolean;
  scope: string;
  scope_name?: string;
  authorized_by?: string;
  expires_at?: number;
  message: string;
  rejection_reason?: string;
  verification_method?: string;
}

export interface LegalClause {
  id: string;
  section: string;
  summary: string;
  content: string;
}

export interface LegalPolicy {
  title: string;
  summary: string;
  effective_date: string;
  version: string;
  prohibition_notice?: string;
  non_authorization_disclaimer?: string;
  clauses: LegalClause[];
}

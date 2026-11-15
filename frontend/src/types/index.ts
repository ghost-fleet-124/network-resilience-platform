export type Protocol = 'UDP' | 'TCP' | 'HTTP' | 'HTTPS' | 'WEBSOCKET' | 'GAME_UDP' | 'GRPC' | 'QUIC';

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
  
  total_packets_sent: number;
  total_packets_received: number;
  packet_loss_pct: number;
  total_requests: number;
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
  challenge_token?: string;
  verification_method?: string;
}

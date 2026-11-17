// BLACKSHIELD Type Definitions

export type UserRole = "ADMIN" | "SOC_LEAD" | "ANALYST" | "AUDITOR";

export interface SOCUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  badgeNumber: string;
  avatarUrl?: string;
}

export type ThreatSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type TargetCategory = "EMERGENCY_911" | "FEMA" | "POWER_GRID" | "PUBLIC_ALERT" | "HEALTHCARE";

export type ServiceHealth = "HEALTHY" | "DEGRADED" | "UNDER_ATTACK" | "OFFLINE";

export interface CriticalTarget {
  id: string;
  name: string;
  slug: string;
  endpoint: string;
  category: TargetCategory;
  status: ServiceHealth;
  latencyMs: number;
  uptimePercentage: number;
  lastChecked: string;
}

export interface IncidentRecord {
  id: string;
  incidentNumber: string;
  title: string;
  severity: ThreatSeverity;
  status: "ACTIVE" | "MITIGATING" | "INVESTIGATING" | "RESOLVED";
  targetServiceId: string;
  targetServiceName?: string;
  attackVector: string;
  peakRps: number;
  currentRps: number;
  detectedAt: string;
  resolvedAt?: string | null;
  description: string;
  affectedComponents: string;
}

export interface SecurityAlert {
  id: string;
  incidentId?: string;
  title: string;
  message: string;
  severity: ThreatSeverity;
  sourceIp: string;
  targetPath: string;
  anomalyScore: number;
  signatureMatched?: string;
  acknowledged: boolean;
  createdAt: string;
}

export interface DefensePolicyItem {
  id: string;
  name: string;
  type: "RATE_LIMIT" | "WAF_RULE" | "IP_REPUTATION" | "GEO_BLOCK" | "KERNEL_TUNING";
  status: "ACTIVE" | "DISABLED";
  priority: number;
  targetEndpoint: string;
  config: Record<string, any>;
  appliedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ControlledTestConfig {
  targetUrl: string;
  vus: number; // Concurrency Virtual Users (Max 200)
  durationSec: number; // Max 300
  targetRps: number; // Max 5000
  protocol: "HTTP" | "HTTPS" | "HTTP2";
  testName?: string;
}

export interface ControlledTestResult {
  id: string;
  testName: string;
  targetUrl: string;
  vus: number;
  durationSec: number;
  targetRps: number;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "STOPPED" | "ABORTED";
  peakRps: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  errorRate: number;
  emergencyStopped: boolean;
  logs: string[];
  metricsTimeline: Array<{
    second: number;
    rps: number;
    latencyMs: number;
    activeVus: number;
    errorCount: number;
  }>;
  createdAt: string;
  completedAt?: string;
}

export interface SystemTelemetry {
  timestamp: string;
  cpuUsage: number;
  ramUsage: number;
  networkInMbps: number;
  networkOutMbps: number;
  ingressRps: number;
  droppedRps: number;
  normalRps: number;
  activeConnections: number;
  threatLevel: 1 | 2 | 3 | 4 | 5; // DEFCON: 1 = Emergency, 5 = Normal
}

export interface ForensicAuditEntry {
  id: string;
  userName: string;
  userRole: UserRole;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  status: "SUCCESS" | "DENIED" | "FAILED";
  timestamp: string;
}

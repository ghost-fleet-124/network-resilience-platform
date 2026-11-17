// BLACKSHIELD V2 — Defense Center Engine
// Manages Rate Limiting Policies, WAF Rule Generation, Policy Versioning,
// Explicit Deployment Lifecycles, and Multi-Format Configuration Exports.

import { DefensePolicyItem, UserRole } from "./types";
import { inMemoryStore, logAuditEvent } from "./db";

export type PolicyLifecycleState = 
  | "CONFIG_DRAFT"
  | "PENDING_APPROVAL"
  | "OPERATOR_APPROVED"
  | "STAGED_CANARY"
  | "VERIFIED_ACTIVE"
  | "DISABLED";

export interface VersionedDefensePolicy extends Omit<DefensePolicyItem, "status"> {
  version: number;
  lifecycleState: PolicyLifecycleState;
  approvedBy?: string;
  approvedAt?: string;
  deploymentTarget: "EDGE_WAF" | "REVERSE_PROXY_NGINX" | "HOST_KERNEL_SYSCTL" | "PERIMETER_FIREWALL";
  exportableSnippets: {
    cloudflareWaf?: string;
    nginxConfig?: string;
    suricataRule?: string;
    sysctlConf?: string;
  };
}

export interface IPReputationRecord {
  ip: string;
  threatScore: number;
  classification: "BENIGN" | "SUSPICIOUS" | "CONFIRMED_BOTNET" | "TOR_EXIT_NODE" | "PROXY_SCANNER";
  asn: string;
  country: string;
  totalAttacksObserved: number;
  status: "ALLOWED" | "CHALLENGED" | "BLOCKED" | "TARPITTED";
  deploymentStatus: "VERIFIED_NULLROUTED" | "SIMULATED_REPUTATION_ONLY";
  lastSeen: string;
}

export interface TrafficRecommendation {
  id: string;
  category: "RATE_LIMIT" | "GEO_BLOCKING" | "WAF_CUSTOM" | "PROTOCOL_SANITY";
  title: string;
  ruleSyntax: string;
  rationale: string;
  impact: string;
}

export const TRAFFIC_RECOMMENDATIONS: TrafficRecommendation[] = [
  {
    id: "rec_rst_spoofed_ua",
    category: "WAF_CUSTOM",
    title: "Block Automated Headless & Forged User-Agents",
    ruleSyntax: `SecRule REQUEST_HEADERS:User-Agent "@pmFromFile ua-blocklist.data" "id:100101,phase:1,deny,status:403,log,msg:'ZxCDDoS Headless Chrome/Bypass Signature Detected'"`,
    rationale: "Analysis of ZxCDDoS cf.js & bypass.py confirms rotating automated user-agents and headless Chrome signatures.",
    impact: "Drops ~42% of automated HTTP flood requests at perimeter before reaching application compute.",
  },
  {
    id: "rec_xff_strict_validation",
    category: "PROTOCOL_SANITY",
    title: "Sanitize & Ignore Client-Supplied X-Forwarded-For Headers",
    ruleSyntax: `# Nginx perimeter config: Strip forged upstream headers\nproxy_set_header X-Forwarded-For $remote_addr;\nproxy_hide_header X-Forwarded-Host;`,
    rationale: "ZxCDDoS cf.js explicitly injects randomized forged X-Forwarded-For IPs to subvert naive IP-based rate limiting.",
    impact: "Prevents perimeter bypass; ensures rate limiters key on actual TCP socket layer addresses.",
  },
  {
    id: "rec_udp_frag_filter",
    category: "RATE_LIMIT",
    title: "Drop Oversized & Fragmented UDP Datagrams (>1400 bytes)",
    ruleSyntax: `iptables -A INPUT -p udp -m length --length 1400:65535 -j DROP\niptables -A INPUT -p udp -f -j DROP`,
    rationale: "Counteracts udp.py 65.5KB MTU-fragmented floods designed to exhaust OS kernel socket buffer rings.",
    impact: "Mitigates kernel softirq saturation without affecting valid DNS or QUIC datagrams.",
  },
  {
    id: "rec_ntp_ldap_amplification",
    category: "GEO_BLOCKING",
    title: "Rate Limit Inbound UDP Port 123 (NTP) & Port 389 (CLDAP)",
    ruleSyntax: `iptables -A INPUT -p udp --sport 123 -m hashlimit --hashlimit-name ntp_amp --hashlimit-above 50/sec --hashlimit-mode srcip -j DROP`,
    rationale: "ZxCDDoS weapons inventory includes ntp.txt and ldap.txt containing vulnerable public monlist reflectors.",
    impact: "Blocks high-volume reflective amplification floods (up to 556x multiplier) from impacting upstream ingress.",
  },
];

export const IP_REPUTATION_DATABASE: IPReputationRecord[] = [
  {
    ip: "194.26.29.112",
    threatScore: 98,
    classification: "CONFIRMED_BOTNET",
    asn: "AS49505 (HostRoyale Ltd)",
    country: "RU",
    totalAttacksObserved: 14200,
    status: "BLOCKED",
    deploymentStatus: "VERIFIED_NULLROUTED",
    lastSeen: "2 mins ago",
  },
  {
    ip: "45.142.214.18",
    threatScore: 95,
    classification: "CONFIRMED_BOTNET",
    asn: "AS200019 (Alexhost SRL)",
    country: "MD",
    totalAttacksObserved: 9812,
    status: "BLOCKED",
    deploymentStatus: "VERIFIED_NULLROUTED",
    lastSeen: "4 mins ago",
  },
  {
    ip: "185.220.101.5",
    threatScore: 88,
    classification: "TOR_EXIT_NODE",
    asn: "AS60729 (Zwiebelfreunde e.V.)",
    country: "DE",
    totalAttacksObserved: 4521,
    status: "CHALLENGED",
    deploymentStatus: "SIMULATED_REPUTATION_ONLY",
    lastSeen: "8 mins ago",
  },
  {
    ip: "89.248.163.45",
    threatScore: 76,
    classification: "PROXY_SCANNER",
    asn: "AS202425 (IP Volume Inc)",
    country: "NL",
    totalAttacksObserved: 1840,
    status: "TARPITTED",
    deploymentStatus: "SIMULATED_REPUTATION_ONLY",
    lastSeen: "15 mins ago",
  },
  {
    ip: "127.0.0.1",
    threatScore: 0,
    classification: "BENIGN",
    asn: "Loopback Interface",
    country: "US",
    totalAttacksObserved: 0,
    status: "ALLOWED",
    deploymentStatus: "SIMULATED_REPUTATION_ONLY",
    lastSeen: "Just now",
  },
];

export const V2_DEFENSE_POLICIES: VersionedDefensePolicy[] = [
  {
    id: "pol_ratelimit_emergency",
    name: "Emergency 911 Dispatch Token Bucket",
    type: "RATE_LIMIT",
    version: 3,
    lifecycleState: "VERIFIED_ACTIVE",
    priority: 1,
    targetEndpoint: "/api/mock/emergency-dispatch",
    deploymentTarget: "REVERSE_PROXY_NGINX",
    approvedBy: "Sarah Vance (ADMIN)",
    approvedAt: "2026-11-17T06:30:00Z",
    config: {
      algorithm: "TOKEN_BUCKET",
      capacity: 1000,
      refillRatePerSec: 250,
      burstAllowance: 1500,
      actionOnExceed: "HTTP_429_CHALLENGE",
    },
    exportableSnippets: {
      nginxConfig: `limit_req_zone $binary_remote_addr zone=dispatch_intake:20m rate=250r/s;\nlimit_req zone=dispatch_intake burst=1500 nodelay;`,
    },
    appliedCount: 142809,
    createdAt: "2026-11-15T08:00:00Z",
    updatedAt: "2026-11-17T06:30:00Z",
  },
  {
    id: "pol_waf_zxcr9999",
    name: "ZxCDDoS Signature & Randomized Header Drop",
    type: "WAF_RULE",
    version: 2,
    lifecycleState: "VERIFIED_ACTIVE",
    priority: 2,
    targetEndpoint: "*",
    deploymentTarget: "EDGE_WAF",
    approvedBy: "Marcus Kane (SOC_LEAD)",
    approvedAt: "2026-11-17T09:00:00Z",
    config: {
      vendor: "Cloudflare/ModSecurity",
      expression: "(http.request.uri.path contains '/api/' and http.user_agent matches '(?i)ZxCDDoS') or (http.request.headers['origin'][0] matches '^http://[a-z0-9]{8}\\.com$')",
      action: "DROP_IMMEDIATE",
    },
    exportableSnippets: {
      cloudflareWaf: `(http.request.uri.path contains "/api/" and http.user_agent contains "ZxCDDoS") or (http.request.headers["origin"][0] matches "^http://[a-z0-9]{8}\\.com$")`,
      suricataRule: `alert tcp any any -> $HOME_NET any (msg:"BLACKSHIELD - ZxCDDoS UA/Origin Detected"; content:"ZxCDDoS"; nocase; sid:2026201; rev:3;)`,
    },
    appliedCount: 89412,
    createdAt: "2026-11-15T09:15:00Z",
    updatedAt: "2026-11-17T09:00:00Z",
  },
  {
    id: "pol_kernel_syncookies",
    name: "OS Kernel SYN Cookie Defense & Backlog Tuning",
    type: "KERNEL_TUNING",
    version: 1,
    lifecycleState: "VERIFIED_ACTIVE",
    priority: 3,
    targetEndpoint: "tcp/*",
    deploymentTarget: "HOST_KERNEL_SYSCTL",
    approvedBy: "Sarah Vance (ADMIN)",
    approvedAt: "2026-11-14T10:00:00Z",
    config: {
      sysctl: {
        "net.ipv4.tcp_syncookies": 1,
        "net.ipv4.tcp_max_syn_backlog": 65536,
        "net.ipv4.tcp_synack_retries": 1,
        "net.core.somaxconn": 65535,
      },
    },
    exportableSnippets: {
      sysctlConf: `net.ipv4.tcp_syncookies = 1\nnet.ipv4.tcp_max_syn_backlog = 65536\nnet.ipv4.tcp_synack_retries = 1\nnet.core.somaxconn = 65535`,
    },
    appliedCount: 220450,
    createdAt: "2026-11-14T10:00:00Z",
    updatedAt: "2026-11-14T10:00:00Z",
  },
];

export function toggleMitigationMode(enabled: boolean, operatorName: string, operatorRole: UserRole) {
  inMemoryStore.activeMitigationMode = enabled;
  logAuditEvent({
    userName: operatorName,
    userRole: operatorRole,
    action: enabled ? "EMERGENCY_SHIELD_ENABLED" : "EMERGENCY_SHIELD_DISABLED",
    resource: "Global Defense Shield",
    details: { state: enabled ? "ACTIVE_MITIGATION" : "NORMAL_MONITORING" },
    ipAddress: "127.0.0.1",
    status: "SUCCESS",
  });
  return inMemoryStore.activeMitigationMode;
}

export function updatePolicyLifecycle(
  policyId: string,
  newState: PolicyLifecycleState,
  operatorName: string,
  operatorRole: UserRole
) {
  const policy = V2_DEFENSE_POLICIES.find((p) => p.id === policyId);
  if (!policy) return null;

  const previousState = policy.lifecycleState;
  policy.lifecycleState = newState;
  policy.version += 1;
  policy.updatedAt = new Date().toISOString();

  if (newState === "OPERATOR_APPROVED" || newState === "VERIFIED_ACTIVE") {
    policy.approvedBy = `${operatorName} (${operatorRole})`;
    policy.approvedAt = new Date().toISOString();
  }

  logAuditEvent({
    userName: operatorName,
    userRole: operatorRole,
    action: "POLICY_LIFECYCLE_TRANSITION",
    resource: `Policy: ${policy.name} (v${policy.version})`,
    details: { policyId, previousState, newState },
    ipAddress: "127.0.0.1",
    status: "SUCCESS",
  });

  return policy;
}

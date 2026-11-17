const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Starting BLACKSHIELD database initialization...");

  // 1. Seed SOC Operators
  const users = [
    {
      id: "usr_admin_01",
      email: "sarah.vance@blackshield.gov",
      name: "Sarah Vance",
      role: "ADMIN",
      badgeNumber: "BS-001-ADM",
      avatarUrl: "/avatars/sarah.png",
    },
    {
      id: "usr_lead_02",
      email: "marcus.kane@blackshield.gov",
      name: "Marcus Kane",
      role: "SOC_LEAD",
      badgeNumber: "BS-014-LEAD",
      avatarUrl: "/avatars/marcus.png",
    },
    {
      id: "usr_analyst_03",
      email: "elena.rostova@blackshield.gov",
      name: "Elena Rostova",
      role: "ANALYST",
      badgeNumber: "BS-089-ANA",
      avatarUrl: "/avatars/elena.png",
    },
    {
      id: "usr_auditor_04",
      email: "david.chen@blackshield.gov",
      name: "David Chen",
      role: "AUDITOR",
      badgeNumber: "BS-102-AUD",
      avatarUrl: "/avatars/david.png",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: u,
      create: u,
    });
  }
  console.log(`[Seed] Seeded ${users.length} SOC operators.`);

  // 2. Seed National Critical Infrastructure Targets
  const targets = [
    {
      id: "tgt_911_dispatch",
      name: "National 911 Emergency Dispatch Portal",
      slug: "emergency-911-dispatch",
      endpoint: "http://localhost:3000/api/mock/emergency-dispatch",
      category: "EMERGENCY_911",
      status: "UNDER_ATTACK",
      latencyMs: 312,
      uptimePercentage: 99.41,
    },
    {
      id: "tgt_fema_gateway",
      name: "FEMA Strategic Response Gateway",
      slug: "fema-gateway",
      endpoint: "http://localhost:3000/api/mock/fema-gateway",
      category: "FEMA",
      status: "DEGRADED",
      latencyMs: 145,
      uptimePercentage: 99.82,
    },
    {
      id: "tgt_power_grid",
      name: "National Power Grid Telemetry Gateway",
      slug: "power-grid-telemetry",
      endpoint: "http://localhost:3000/api/mock/power-grid",
      category: "POWER_GRID",
      status: "HEALTHY",
      latencyMs: 38,
      uptimePercentage: 99.99,
    },
    {
      id: "tgt_public_alert",
      name: "Public Emergency Alert SMS Relay",
      slug: "public-alert-sms",
      endpoint: "http://localhost:3000/api/mock/public-alert",
      category: "PUBLIC_ALERT",
      status: "HEALTHY",
      latencyMs: 42,
      uptimePercentage: 99.97,
    },
    {
      id: "tgt_hospital_bed",
      name: "Emergency Medical Resource Locator",
      slug: "hospital-resource-locator",
      endpoint: "http://localhost:3000/api/mock/hospital-locator",
      category: "HEALTHCARE",
      status: "HEALTHY",
      latencyMs: 29,
      uptimePercentage: 99.99,
    },
  ];

  for (const t of targets) {
    await prisma.targetService.upsert({
      where: { slug: t.slug },
      update: t,
      create: t,
    });
  }
  console.log(`[Seed] Seeded ${targets.length} critical infrastructure targets.`);

  // 3. Seed Active Incident
  const incident = await prisma.incident.upsert({
    where: { incidentNumber: "INC-2026-0881" },
    update: {},
    create: {
      id: "inc_0881_ddos",
      incidentNumber: "INC-2026-0881",
      title: "Volumetric L7 HTTP Flood & SYN Backlog Exhaustion against 911 Dispatch",
      severity: "CRITICAL",
      status: "MITIGATING",
      targetServiceId: "tgt_911_dispatch",
      attackVector: "HTTP_L7_FLOOD_AND_SYN",
      peakRps: 184500,
      currentRps: 42300,
      description: "Distributed attack coordinating randomized User-Agents and raw SYN socket floods attempting to saturate the emergency dispatch intake queue.",
      affectedComponents: "Intake API, Session Gateways, Database Connection Pool",
    },
  });

  // 4. Seed Threat Alerts
  const alerts = [
    {
      id: "alt_01",
      incidentId: incident.id,
      title: "Anomalous Request Rate Spike Detected",
      message: "Ingress request rate reached 184.5k RPS (Z-score +4.82σ above rolling baseline)",
      severity: "CRITICAL",
      sourceIp: "194.26.29.0/24 (Suspected Botnet Pool)",
      targetPath: "/api/mock/emergency-dispatch",
      anomalyScore: 4.82,
      signatureMatched: "SIG-L7-FLOOD-RAND-UA",
      acknowledged: true,
    },
    {
      id: "alt_02",
      incidentId: incident.id,
      title: "SYN Backlog Saturation Warning",
      message: "Half-open TCP connections exceeded threshold (92% backlog capacity on worker pool 3)",
      severity: "HIGH",
      sourceIp: "Various (Distributed Spoofed Headers)",
      targetPath: "/api/mock/emergency-dispatch",
      anomalyScore: 3.91,
      signatureMatched: "SIG-L4-SYN-FLOOD",
      acknowledged: false,
    },
    {
      id: "alt_03",
      incidentId: incident.id,
      title: "C2 Protocol Signature Correlated",
      message: "Command pattern matched ZxCDDoS C2 protocol syntax (!* http flood instructions)",
      severity: "HIGH",
      sourceIp: "45.142.214.18",
      targetPath: "/c2-dispatch-probe",
      anomalyScore: 3.45,
      signatureMatched: "INTEL-ZXCDDOS-C2-AUTH",
      acknowledged: false,
    },
    {
      id: "alt_04",
      incidentId: incident.id,
      title: "Repeated 403 Forbidden Threshold Breached",
      message: "Over 8,500 blocked requests in 60 seconds originating from ASN 49505",
      severity: "MEDIUM",
      sourceIp: "185.220.101.5",
      targetPath: "/api/mock/emergency-dispatch/admin",
      anomalyScore: 2.15,
      signatureMatched: "SIG-WAF-BLOCK-RATE",
      acknowledged: true,
    },
  ];

  for (const a of alerts) {
    await prisma.threatAlert.upsert({
      where: { id: a.id },
      update: a,
      create: a,
    });
  }

  // 5. Seed Defense Policies
  const policies = [
    {
      id: "pol_ratelimit_emergency",
      name: "Emergency 911 Dispatch Token Bucket",
      type: "RATE_LIMIT",
      status: "ACTIVE",
      priority: 1,
      targetEndpoint: "/api/mock/emergency-dispatch",
      configJson: JSON.stringify({
        algorithm: "TOKEN_BUCKET",
        capacity: 1000,
        refillRatePerSec: 250,
        burstAllowance: 1500,
        actionOnExceed: "HTTP_429_CHALLENGE",
      }),
      appliedCount: 142809,
    },
    {
      id: "pol_waf_zxcr9999",
      name: "ZxCDDoS Signature & Randomized Header Drop",
      type: "WAF_RULE",
      status: "ACTIVE",
      priority: 2,
      targetEndpoint: "*",
      configJson: JSON.stringify({
        vendor: "Cloudflare/ModSecurity",
        expression: "(http.request.uri.path contains '/api/' and http.user_agent matches '^(Mozilla.*)?ZxCDDoS') or (len(http.request.headers) > 40)",
        action: "DROP_IMMEDIATE",
      }),
      appliedCount: 89412,
    },
    {
      id: "pol_ip_quarantine",
      name: "Known Botnet & Tor Exit Node Quarantine",
      type: "IP_REPUTATION",
      status: "ACTIVE",
      priority: 3,
      targetEndpoint: "*",
      configJson: JSON.stringify({
        feedSources: ["CISA_KNOWN_EXPLOITED", "SPAMHAUS_DROP", "TOR_BULK_EXIT"],
        minThreatScore: 75,
        action: "TARPIT_THEN_DROP",
      }),
      appliedCount: 56210,
    },
    {
      id: "pol_kernel_syncookies",
      name: "OS Kernel SYN Cookie Defense & Backlog Tuning",
      type: "KERNEL_TUNING",
      status: "ACTIVE",
      priority: 4,
      targetEndpoint: "tcp/*",
      configJson: JSON.stringify({
        sysctl: {
          "net.ipv4.tcp_syncookies": 1,
          "net.ipv4.tcp_max_syn_backlog": 65536,
          "net.ipv4.tcp_synack_retries": 2,
          "net.core.somaxconn": 65535,
        },
      }),
      appliedCount: 220450,
    },
  ];

  for (const p of policies) {
    await prisma.defensePolicy.upsert({
      where: { id: p.id },
      update: p,
      create: p,
    });
  }

  // 6. Seed Audit Logs
  const auditEntries = [
    {
      id: "aud_01",
      userName: "Marcus Kane",
      userRole: "SOC_LEAD",
      action: "MITIGATION_ACTIVATED",
      resource: "Defense Policy: ZxCDDoS Signature & Randomized Header Drop",
      detailsJson: JSON.stringify({ level: "AGGRESSIVE", duration: "INDEFINITE", reason: "INC-2026-0881 escalation" }),
      status: "SUCCESS",
    },
    {
      id: "aud_02",
      userName: "Sarah Vance",
      userRole: "ADMIN",
      action: "RATE_LIMIT_UPDATED",
      resource: "Emergency 911 Dispatch Token Bucket",
      detailsJson: JSON.stringify({ previousCapacity: 2500, newCapacity: 1000, refillRate: 250 }),
      status: "SUCCESS",
    },
    {
      id: "aud_03",
      userName: "Elena Rostova",
      userRole: "ANALYST",
      action: "THREAT_ALERT_ACKNOWLEDGED",
      resource: "Threat Alert alt_01 (184.5k RPS Anomaly)",
      detailsJson: JSON.stringify({ triageNotes: "Traffic originating from multiple Eastern European ASNs; signatures match known UDP/HTTP botnet patterns." }),
      status: "SUCCESS",
    },
  ];

  for (const aud of auditEntries) {
    await prisma.auditLog.upsert({
      where: { id: aud.id },
      update: aud,
      create: aud,
    });
  }

  console.log("[Seed] BLACKSHIELD database initialization complete!");
}

main()
  .catch((e) => {
    console.error("[Seed Error]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

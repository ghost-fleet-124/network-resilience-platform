import { NextResponse } from "next/server";
import { inMemoryStore, logAuditEvent } from "@/lib/db";
import { getIncidentTimeline } from "@/lib/anomaly-detector";
import { ZXCDDOS_FINDINGS } from "@/data/zxCDDoS-intelligence";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  const timeline = getIncidentTimeline();
  const incidents = inMemoryStore.incidents;
  const auditLogs = inMemoryStore.auditLogs;

  const executiveReport = {
    organization: "National Emergency Management & Critical Infrastructure Protection Agency (NEMCIPA)",
    platform: "BLACKSHIELD Cyber Defense & SOC Platform",
    classification: "CONFIDENTIAL // INCIDENT RESPONSE POST-MORTEM",
    generatedAt: new Date().toISOString(),
    primaryIncident: incidents[0],
    incidentSummary: {
      threatTitle: "Multi-Vector Distributed Denial of Service (DDoS) on National 911 Dispatch Infrastructure",
      threatActorVector: "Coordinated Layer 7 HTTP/2 cache-busting flood combined with Layer 4 raw socket SYN backlog exhaustion",
      correlatedToolkit: "ZxCDDoS framework (naimxbzbd/ZxCDDoS)",
      peakVolumetricRps: 184500,
      activeMitigationDurationMinutes: 120,
      availabilityImpact: "911 Dispatch Intake maintained 99.41% uptime; emergency failover token bucket preserved high-priority dispatch calls.",
      defensiveActionsExecuted: [
        "Enabled WAF Regex inspection dropping spoofed User-Agents matching ZxCDDoS heuristics",
        "Enforced dynamic Token Bucket rate limiter (1,000 capacity / 250 refill/sec) on /api/mock/emergency-dispatch",
        "Tuned Linux kernel net.ipv4.tcp_syncookies=1 to neutralize SYN backlog exhaustion",
        "Blackholed high-risk botnet ranges originating from AS49505 and AS200019",
      ],
    },
    timeline,
    auditTrailCount: auditLogs.length,
    recentAudits: auditLogs.slice(0, 15),
    repositoryIntelligenceFindings: ZXCDDOS_FINDINGS.map((f) => ({
      id: f.id,
      component: f.component,
      severity: f.severity,
      technique: f.mitreMapping.techniqueName,
      mitigation: Object.keys(f.defensiveSignatures).join(", "),
    })),
  };

  if (format === "siem-json") {
    // Export formatted for SIEM ingestion (Elastic/Splunk/Sentinel)
    const siemEvents = auditLogs.map((log) => ({
      "@timestamp": log.timestamp,
      "event.action": log.action,
      "event.category": "security_operations",
      "user.name": log.userName,
      "user.roles": [log.userRole],
      "source.ip": log.ipAddress,
      "destination.service": log.resource,
      "event.outcome": log.status.toLowerCase(),
      "details": log.details,
    }));

    return new NextResponse(JSON.stringify(siemEvents, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": 'attachment; filename="blackshield-siem-audit-stream.json"',
      },
    });
  }

  return NextResponse.json({
    report: executiveReport,
    auditLogs,
    incidents,
  });
}

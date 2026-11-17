import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { getIncidentTimeline } from "@/lib/anomaly-detector";
import { VERIFIED_FINDINGS, VERIFIED_REPO_METADATA } from "@/data/zxCDDoS-verified";
import { getAuditChain, verifyChainIntegrity } from "@/lib/audit-chain";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format");

  const timeline = getIncidentTimeline();
  const incidents = inMemoryStore.incidents;
  const auditLogs = getAuditChain();
  const chainIntegrity = verifyChainIntegrity();

  const reportId = `REP-2026-${Math.floor(10000 + Math.random() * 90000)}`;

  const executiveReport = {
    reportId,
    organization: "National Emergency Management & Critical Infrastructure Protection Agency (NEMCIPA)",
    platform: "BLACKSHIELD Cyber Defense & SOC Platform V2",
    classification: "CONFIDENTIAL // INCIDENT RESPONSE POST-MORTEM",
    generatedAt: new Date().toISOString(),
    tamperEvidentLedger: {
      integrityStatus: chainIntegrity.isValid ? "CRYPTOGRAPHICALLY_VERIFIED" : "COMPROMISED",
      totalChainedEvents: chainIntegrity.totalEvents,
      ledgerStandard: "SHA-256 Chained Hash Sequence",
    },
    primaryIncident: incidents[0],
    incidentSummary: {
      threatTitle: "Multi-Vector Distributed Denial of Service (DDoS) on National 911 Dispatch Infrastructure",
      threatActorVector: "Coordinated Layer 7 HTTP/2 cache-busting flood combined with Layer 4 raw socket SYN backlog exhaustion",
      correlatedToolkit: {
        repoUrl: VERIFIED_REPO_METADATA.repoUrl,
        commitSha: VERIFIED_REPO_METADATA.commitSha,
        provenance: "VERIFIED_SOURCE_FILE_INSPECTION",
      },
      peakVolumetricRps: 184500,
      activeMitigationDurationMinutes: 120,
      availabilityImpact: "911 Dispatch Intake maintained 99.41% uptime; emergency failover token bucket preserved high-priority dispatch calls.",
      defensiveActionsExecuted: [
        "Enabled WAF Regex inspection dropping spoofed User-Agents and 8-character random Origins matching cf.js heuristics",
        "Enforced dynamic Token Bucket rate limiter (1,000 capacity / 250 refill/sec) on /api/mock/emergency-dispatch",
        "Tuned Linux kernel net.ipv4.tcp_syncookies=1 to neutralize SYN backlog exhaustion",
        "Blackholed high-risk botnet ranges originating from AS49505 and AS200019",
      ],
    },
    timeline,
    auditTrailCount: auditLogs.length,
    recentAudits: auditLogs.slice(0, 20),
    repositoryIntelligenceFindings: VERIFIED_FINDINGS.map((f) => ({
      id: f.id,
      file: f.file,
      provenance: f.provenance,
      severity: f.severity,
      technique: f.mitreMapping.techniqueName,
      mitigationRules: Object.keys(f.defensiveSignatures).join(", "),
    })),
  };

  if (format === "siem-json") {
    // Export formatted for SIEM ingestion (Elastic/Splunk/Sentinel) with cryptographic event hashes
    const siemEvents = auditLogs.map((log) => ({
      "@timestamp": log.timestamp,
      "event.id": log.id,
      "event.hash": log.eventHash,
      "event.previous_hash": log.previousHash,
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
        "Content-Disposition": `attachment; filename="blackshield-siem-ledger-${Date.now()}.json"`,
      },
    });
  }

  return NextResponse.json({
    report: executiveReport,
    auditLogs,
    chainIntegrity,
    incidents,
  });
}

import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { getAuditChain } from "@/lib/audit-chain";

export async function GET() {
  const memoryUsage = process.memoryUsage();
  return NextResponse.json({
    status: "HEALTHY",
    platform: "BLACKSHIELD Cyber Defense Platform V2",
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    telemetry: {
      activeMitigationMode: inMemoryStore.activeMitigationMode,
      activeIncidents: inMemoryStore.incidents.length,
      auditLedgerLength: getAuditChain().length,
      memory: {
        rssMb: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapUsedMb: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
        heapTotalMb: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
      },
    },
  });
}

import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";

export async function GET() {
  const isMitigating = inMemoryStore.activeMitigationMode;

  // Dynamically update target health based on mitigation state
  const targets = inMemoryStore.targets.map((tgt) => {
    if (tgt.slug === "emergency-911-dispatch") {
      return {
        ...tgt,
        status: isMitigating ? ("DEGRADED" as const) : ("UNDER_ATTACK" as const),
        latencyMs: isMitigating ? 112 : 385,
        lastChecked: new Date().toISOString(),
      };
    }
    if (tgt.slug === "fema-gateway") {
      return {
        ...tgt,
        status: isMitigating ? ("HEALTHY" as const) : ("DEGRADED" as const),
        latencyMs: isMitigating ? 48 : 142,
        lastChecked: new Date().toISOString(),
      };
    }
    return {
      ...tgt,
      lastChecked: new Date().toISOString(),
    };
  });

  return NextResponse.json({ targets });
}

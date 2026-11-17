import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import {
  IP_REPUTATION_DATABASE,
  TRAFFIC_RECOMMENDATIONS,
  toggleMitigationMode,
  updatePolicyStatus,
} from "@/lib/defense-engine";

export async function GET() {
  return NextResponse.json({
    activeMitigationMode: inMemoryStore.activeMitigationMode,
    policies: inMemoryStore.policies,
    ipReputation: IP_REPUTATION_DATABASE,
    recommendations: TRAFFIC_RECOMMENDATIONS,
    summary: {
      activePolicyCount: inMemoryStore.policies.filter((p) => p.status === "ACTIVE").length,
      blockedIpCount: IP_REPUTATION_DATABASE.filter((i) => i.status === "BLOCKED").length,
      totalRequestsFiltered: inMemoryStore.policies.reduce((sum, p) => sum + p.appliedCount, 0),
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, policyId, active, enabled, operatorName, operatorRole } = body;

    // Toggle Emergency Shield / Under Attack Mode
    if (action === "TOGGLE_MITIGATION_MODE") {
      const isEnabled = enabled !== undefined ? enabled : !inMemoryStore.activeMitigationMode;
      const newStatus = toggleMitigationMode(isEnabled, operatorName || "Marcus Kane", operatorRole || "SOC_LEAD");
      return NextResponse.json({
        message: `Emergency defense shield ${newStatus ? "ACTIVATED" : "STANDBY"}`,
        activeMitigationMode: newStatus,
      });
    }

    // Toggle Individual Policy
    if (action === "TOGGLE_POLICY" && policyId) {
      const updated = updatePolicyStatus(
        policyId,
        active !== undefined ? active : true,
        operatorName || "Marcus Kane",
        operatorRole || "SOC_LEAD"
      );
      if (!updated) {
        return NextResponse.json({ error: "Policy not found." }, { status: 404 });
      }
      return NextResponse.json({
        message: `Policy '${updated.name}' updated.`,
        policy: updated,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

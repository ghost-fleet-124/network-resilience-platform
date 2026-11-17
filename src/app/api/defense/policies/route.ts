import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import {
  IP_REPUTATION_DATABASE,
  V2_DEFENSE_POLICIES,
  toggleMitigationMode,
  updatePolicyLifecycle,
  PolicyLifecycleState,
} from "@/lib/defense-engine";
import { TRAFFIC_RECOMMENDATIONS } from "@/lib/defense-engine";
import { verifyServerAuth } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({
    activeMitigationMode: inMemoryStore.activeMitigationMode,
    policies: V2_DEFENSE_POLICIES,
    ipReputation: IP_REPUTATION_DATABASE,
    recommendations: TRAFFIC_RECOMMENDATIONS,
    summary: {
      activePolicyCount: V2_DEFENSE_POLICIES.filter((p) => p.lifecycleState === "VERIFIED_ACTIVE").length,
      blockedIpCount: IP_REPUTATION_DATABASE.filter((i) => i.status === "BLOCKED").length,
      totalRequestsFiltered: V2_DEFENSE_POLICIES.reduce((sum, p) => sum + p.appliedCount, 0),
    },
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { action, policyId, newState, enabled } = body;

    // Toggle Emergency Shield requires canToggleMitigationMode
    if (action === "TOGGLE_MITIGATION_MODE") {
      const auth = verifyServerAuth(req, "canToggleMitigationMode");
      if (!auth.authorized && auth.errorResponse) {
        return auth.errorResponse;
      }

      const isEnabled = enabled !== undefined ? enabled : !inMemoryStore.activeMitigationMode;
      const newStatus = toggleMitigationMode(isEnabled, auth.operator.name, auth.operator.role);

      return NextResponse.json({
        message: `Emergency defense shield ${newStatus ? "ACTIVATED" : "STANDBY"}`,
        activeMitigationMode: newStatus,
        operator: auth.operator.name,
      });
    }

    // Modify policy requires canEditDefensePolicies
    if (action === "TRANSITION_POLICY_STATE" || action === "TOGGLE_POLICY") {
      const auth = verifyServerAuth(req, "canEditDefensePolicies");
      if (!auth.authorized && auth.errorResponse) {
        return auth.errorResponse;
      }

      const targetState: PolicyLifecycleState = newState || (body.active ? "VERIFIED_ACTIVE" : "DISABLED");
      const updated = updatePolicyLifecycle(
        policyId,
        targetState,
        auth.operator.name,
        auth.operator.role
      );

      if (!updated) {
        return NextResponse.json({ error: "Policy not found." }, { status: 404 });
      }

      return NextResponse.json({
        message: `Policy '${updated.name}' updated to '${targetState}'.`,
        policy: updated,
        operator: auth.operator.name,
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

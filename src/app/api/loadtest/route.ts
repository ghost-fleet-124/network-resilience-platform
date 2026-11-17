import { NextResponse } from "next/server";
import {
  startControlledLoadTest,
  triggerEmergencyStop,
  getActiveTest,
  getTestHistory,
  GUARDRAILS,
} from "@/lib/loadtest-runner";
import { verifyServerAuth } from "@/lib/auth";
import { ControlledTestConfig } from "@/lib/types";

export async function GET() {
  const active = getActiveTest();
  const history = getTestHistory();

  return NextResponse.json({
    activeTest: active,
    history,
    guardrails: GUARDRAILS,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if operator requested emergency stop
    if (body.action === "STOP" || body.action === "EMERGENCY_STOP") {
      const auth = verifyServerAuth(req, "canEmergencyStop");
      if (!auth.authorized && auth.errorResponse) {
        return auth.errorResponse;
      }

      const stopResult = triggerEmergencyStop(
        body.operatorName || auth.operator.name,
        body.operatorRole || auth.operator.role
      );
      return NextResponse.json(stopResult);
    }

    // Normal test initialization requires canTriggerLoadTest permission
    const auth = verifyServerAuth(req, "canTriggerLoadTest");
    if (!auth.authorized && auth.errorResponse) {
      return auth.errorResponse;
    }

    const config: ControlledTestConfig = {
      targetUrl: body.targetUrl || "http://localhost:3000/api/mock/emergency-dispatch",
      vus: parseInt(body.vus || "25", 10),
      durationSec: parseInt(body.durationSec || "15", 10),
      targetRps: parseInt(body.targetRps || "500", 10),
      protocol: body.protocol || "HTTP",
      testName: body.testName || `Resilience_Benchmark_${Date.now().toString(36).toUpperCase()}`,
    };

    const startResult = await startControlledLoadTest(
      config,
      body.operatorName || auth.operator.name,
      body.operatorRole || auth.operator.role
    );

    if (!startResult.success) {
      return NextResponse.json(
        {
          error: startResult.error,
          resolvedIps: startResult.resolvedIps,
          guardrailEnforced: true,
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: "Controlled load test initialized successfully within safe laboratory guardrails.",
      test: startResult.result,
      warnings: startResult.warnings,
      resolvedIps: startResult.resolvedIps,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = verifyServerAuth(req, "canEmergencyStop");
  if (!auth.authorized && auth.errorResponse) {
    return auth.errorResponse;
  }

  const stopResult = triggerEmergencyStop(auth.operator.name, auth.operator.role);
  return NextResponse.json(stopResult);
}

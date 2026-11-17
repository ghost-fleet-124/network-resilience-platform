import { NextResponse } from "next/server";
import {
  startControlledLoadTest,
  triggerEmergencyStop,
  getActiveTest,
  getTestHistory,
  GUARDRAILS,
} from "@/lib/loadtest-runner";
import { logAuditEvent } from "@/lib/db";
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
      const stopResult = triggerEmergencyStop();

      logAuditEvent({
        userName: body.operatorName || "SOC Operator",
        userRole: body.operatorRole || "SOC_LEAD",
        action: "EMERGENCY_STOP_TRIGGERED",
        resource: "Controlled Load Generator",
        details: { reason: body.reason || "Manual operator kill switch invocation" },
        ipAddress: "127.0.0.1",
        status: "SUCCESS",
      });

      return NextResponse.json(stopResult);
    }

    // Normal test initialization
    const config: ControlledTestConfig = {
      targetUrl: body.targetUrl || "http://localhost:3000/api/mock/emergency-dispatch",
      vus: parseInt(body.vus || "25", 10),
      durationSec: parseInt(body.durationSec || "15", 10),
      targetRps: parseInt(body.targetRps || "500", 10),
      protocol: body.protocol || "HTTP",
      testName: body.testName || `Controlled_Verification_${Date.now().toString(36).toUpperCase()}`,
    };

    const startResult = await startControlledLoadTest(config);

    if (!startResult.success) {
      logAuditEvent({
        userName: body.operatorName || "SOC Operator",
        userRole: body.operatorRole || "SOC_LEAD",
        action: "LOAD_TEST_REJECTED_BY_GUARDRAIL",
        resource: config.targetUrl,
        details: { error: startResult.error, attemptedConfig: config },
        ipAddress: "127.0.0.1",
        status: "DENIED",
      });

      return NextResponse.json({ error: startResult.error }, { status: 403 });
    }

    logAuditEvent({
      userName: body.operatorName || "SOC Operator",
      userRole: body.operatorRole || "SOC_LEAD",
      action: "CONTROLLED_LOAD_TEST_INITIALIZED",
      resource: config.targetUrl,
      details: {
        vus: config.vus,
        durationSec: config.durationSec,
        targetRps: config.targetRps,
        warnings: startResult.warnings,
      },
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
    });

    return NextResponse.json({
      message: "Controlled load test initialized successfully within safe guardrails.",
      test: startResult.result,
      warnings: startResult.warnings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE() {
  const stopResult = triggerEmergencyStop();
  return NextResponse.json(stopResult);
}

import { NextResponse } from "next/server";
import { inMemoryStore, logAuditEvent } from "@/lib/db";
import { getIncidentTimeline, evaluateTrafficAnomaly } from "@/lib/anomaly-detector";
import { verifyServerAuth } from "@/lib/auth";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const severity = searchParams.get("severity");
  const acknowledged = searchParams.get("acknowledged");

  let alerts = [...inMemoryStore.alerts];

  if (severity) {
    alerts = alerts.filter((a) => a.severity === severity);
  }

  if (acknowledged !== null && acknowledged !== undefined) {
    const isAck = acknowledged === "true";
    alerts = alerts.filter((a) => a.acknowledged === isAck);
  }

  const timeline = getIncidentTimeline();

  const stats = {
    totalAlerts: inMemoryStore.alerts.length,
    criticalCount: inMemoryStore.alerts.filter((a) => a.severity === "CRITICAL").length,
    highCount: inMemoryStore.alerts.filter((a) => a.severity === "HIGH").length,
    unacknowledgedCount: inMemoryStore.alerts.filter((a) => !a.acknowledged).length,
    activeIncidents: inMemoryStore.incidents.filter((i) => i.status !== "RESOLVED").length,
  };

  return NextResponse.json({
    alerts,
    timeline,
    incidents: inMemoryStore.incidents,
    stats,
  });
}

export async function PATCH(req: Request) {
  try {
    const auth = verifyServerAuth(req, "canAcknowledgeAlerts");
    if (!auth.authorized && auth.errorResponse) {
      return auth.errorResponse;
    }

    const body = await req.json();
    const { alertId, acknowledged } = body;

    const alert = inMemoryStore.alerts.find((a) => a.id === alertId);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    }

    alert.acknowledged = acknowledged !== undefined ? acknowledged : true;

    logAuditEvent({
      userName: auth.operator.name,
      userRole: auth.operator.role,
      action: "ALERT_ACKNOWLEDGED",
      resource: `Alert: ${alert.title}`,
      details: { alertId, acknowledged: alert.acknowledged },
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
    });

    return NextResponse.json({
      message: "Alert updated successfully.",
      alert,
      operator: auth.operator.name,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

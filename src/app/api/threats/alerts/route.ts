import { NextResponse } from "next/server";
import { inMemoryStore, logAuditEvent } from "@/lib/db";
import { getIncidentTimeline } from "@/lib/anomaly-detector";

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
    const body = await req.json();
    const { alertId, acknowledged, operatorName, operatorRole } = body;

    const alert = inMemoryStore.alerts.find((a) => a.id === alertId);
    if (!alert) {
      return NextResponse.json({ error: "Alert not found." }, { status: 404 });
    }

    alert.acknowledged = acknowledged !== undefined ? acknowledged : true;

    logAuditEvent({
      userName: operatorName || "SOC Analyst",
      userRole: operatorRole || "ANALYST",
      action: "ALERT_ACKNOWLEDGED",
      resource: `Alert: ${alert.title}`,
      details: { alertId, acknowledged: alert.acknowledged },
      ipAddress: "127.0.0.1",
      status: "SUCCESS",
    });

    return NextResponse.json({
      message: "Alert updated successfully.",
      alert,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

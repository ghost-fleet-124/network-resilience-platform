import { NextResponse } from "next/server";
import { inMemoryStore } from "@/lib/db";
import { evaluateTrafficAnomaly } from "@/lib/anomaly-detector";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const historyLimit = parseInt(searchParams.get("history") || "20", 10);

  // Real-time jitter based on active mitigation state
  const isMitigating = inMemoryStore.activeMitigationMode;
  const baseRps = isMitigating ? 42500 : 185000;
  const jitter = Math.sin(Date.now() / 3000) * 4500 + (Math.random() - 0.5) * 3000;
  const ingressRps = Math.max(1000, Math.round(baseRps + jitter));

  // If mitigating, drop 75-85% of malicious traffic
  const droppedRps = isMitigating ? Math.round(ingressRps * 0.78) : Math.round(ingressRps * 0.08);
  const normalRps = Math.max(500, ingressRps - droppedRps);

  const cpuUsage = isMitigating
    ? Math.round(58 + Math.random() * 12)
    : Math.round(88 + Math.random() * 10);

  const ramUsage = isMitigating
    ? Math.round(64 + Math.random() * 6)
    : Math.round(84 + Math.random() * 8);

  const networkInMbps = parseFloat(((ingressRps * 1.8) / 100).toFixed(1));
  const networkOutMbps = parseFloat(((normalRps * 2.2) / 100).toFixed(1));
  const activeConnections = isMitigating ? 14200 : 89400;

  // Threat level (DEFCON): 1 (Critical Emergency) to 5 (Normal)
  const threatLevel = isMitigating ? 2 : 1;

  // Run anomaly detector check
  const anomalyReport = evaluateTrafficAnomaly(ingressRps);

  // Generate historical timeline data for Recharts
  const now = Date.now();
  const timeSeries = [];
  for (let i = historyLimit; i >= 0; i--) {
    const t = new Date(now - i * 5000);
    const timeLabel = t.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const waveFactor = Math.sin((now - i * 5000) / 10000);
    const histIngress = Math.round(baseRps + waveFactor * 12000 + (Math.random() - 0.5) * 5000);
    const histDropped = isMitigating ? Math.round(histIngress * 0.78) : Math.round(histIngress * 0.08);
    const histNormal = histIngress - histDropped;

    timeSeries.push({
      time: timeLabel,
      ingressRps: histIngress,
      droppedRps: histDropped,
      normalRps: histNormal,
      cpu: Math.min(100, Math.round(cpuUsage + waveFactor * 8 + (Math.random() - 0.5) * 4)),
      ram: Math.min(100, Math.round(ramUsage + (Math.random() - 0.5) * 2)),
      networkInMbps: parseFloat(((histIngress * 1.8) / 100).toFixed(1)),
      networkOutMbps: parseFloat(((histNormal * 2.2) / 100).toFixed(1)),
    });
  }

  return NextResponse.json({
    current: {
      timestamp: new Date().toISOString(),
      cpuUsage,
      ramUsage,
      networkInMbps,
      networkOutMbps,
      ingressRps,
      droppedRps,
      normalRps,
      activeConnections,
      threatLevel,
      mitigationActive: isMitigating,
    },
    anomaly: anomalyReport,
    timeSeries,
  });
}

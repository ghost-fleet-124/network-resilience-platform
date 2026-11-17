"use client";

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Search,
  Filter,
  Check,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { SecurityAlert, ThreatSeverity } from "@/lib/types";

export default function ThreatDetection() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filterSeverity, setFilterSeverity] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchThreatData = async () => {
    try {
      const res = await fetch("/api/threats/alerts");
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts);
        setTimeline(data.timeline);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching threat alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
    const interval = setInterval(fetchThreatData, 3500);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledgeAlert = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const res = await fetch("/api/threats/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId, acknowledged: true }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
        );
      }
    } catch (err) {
      console.error("Error acknowledging alert:", err);
    } finally {
      setAcknowledgingId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSev = filterSeverity === "ALL" || a.severity === filterSeverity;
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.sourceIp.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSev && matchesSearch;
  });

  const getSeverityBadge = (sev: ThreatSeverity) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "MEDIUM":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Threat Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1">
            <span className="uppercase text-[10px]">Active Critical Alerts</span>
            <Flame className="w-4 h-4 text-soc-crimson" />
          </div>
          <span className="text-2xl font-bold text-soc-crimson">
            {stats?.criticalCount || 0}
          </span>
          <span className="text-[10px] text-soc-muted block mt-1">
            Requiring immediate triage
          </span>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1">
            <span className="uppercase text-[10px]">Unacknowledged Alerts</span>
            <AlertTriangle className="w-4 h-4 text-soc-amber" />
          </div>
          <span className="text-2xl font-bold text-soc-amber">
            {stats?.unacknowledgedCount || 0}
          </span>
          <span className="text-[10px] text-soc-muted block mt-1">Pending analyst sign-off</span>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1">
            <span className="uppercase text-[10px]">Anomaly Z-Score Peak</span>
            <TrendingUp className="w-4 h-4 text-soc-cyan" />
          </div>
          <span className="text-2xl font-bold text-soc-cyan">+4.82 σ</span>
          <span className="text-[10px] text-soc-muted block mt-1">Above rolling Gaussian baseline</span>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1">
            <span className="uppercase text-[10px]">Active Incident Status</span>
            <Activity className="w-4 h-4 text-soc-violet" />
          </div>
          <span className="text-2xl font-bold text-soc-text">MITIGATING</span>
          <span className="text-[10px] text-soc-muted block mt-1">INC-2026-0881</span>
        </div>
      </div>

      {/* Main Grid: Alerts Stream & Incident Chronology Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Security Alerts Feed (7 cols) */}
        <div className="lg:col-span-7 cyber-panel p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-soc-border pb-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-soc-crimson" />
                <span>REAL-TIME THREAT ALERTS STREAM</span>
              </h3>
              <p className="text-xs text-soc-muted font-mono mt-0.5">
                Heuristic request-rate anomaly detections & signature matches
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-[10px] transition-colors border ${
                    filterSeverity === sev
                      ? "bg-soc-card text-soc-cyan border-soc-cyan font-bold"
                      : "bg-soc-bg text-soc-muted border-soc-border hover:border-soc-cyan/40"
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-soc-muted" />
            <input
              type="text"
              placeholder="Search alert by IP, signature, or target path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-soc-bg border border-soc-border focus:border-soc-cyan rounded px-3 pl-8 py-1.5 text-xs font-mono text-soc-text outline-none"
            />
          </div>

          {/* Alerts List */}
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredAlerts.length > 0 ? (
              filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded-lg border transition-all font-mono text-xs ${
                    alert.acknowledged
                      ? "bg-soc-bg/60 border-soc-border text-soc-muted"
                      : "bg-soc-bg border-soc-border hover:border-soc-cyan/50 text-soc-text shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getSeverityBadge(
                          alert.severity
                        )}`}
                      >
                        {alert.severity}
                      </span>
                      <h4 className="font-bold text-soc-text text-xs">{alert.title}</h4>
                    </div>
                    <span className="text-[10px] text-soc-muted whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-soc-muted mb-2.5 leading-relaxed">{alert.message}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] border-t border-soc-border/40 pt-2">
                    <div className="flex items-center space-x-3 text-soc-muted">
                      <span>
                        SRC: <strong className="text-soc-cyan">{alert.sourceIp}</strong>
                      </span>
                      <span>
                        DST: <strong className="text-soc-text">{alert.targetPath}</strong>
                      </span>
                      {alert.signatureMatched && (
                        <span>
                          SIG: <strong className="text-soc-amber">{alert.signatureMatched}</strong>
                        </span>
                      )}
                    </div>

                    <div>
                      {alert.acknowledged ? (
                        <span className="flex items-center space-x-1 text-soc-emerald">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Acknowledged</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          disabled={acknowledgingId === alert.id}
                          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-soc-card hover:bg-soc-cardHover border border-soc-cyan text-soc-cyan font-bold transition-colors"
                        >
                          <Check className="w-3 h-3" />
                          <span>
                            {acknowledgingId === alert.id ? "AOM..." : "Acknowledge"}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-soc-muted font-mono text-xs italic">
                No security alerts match the selected criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chronological Incident Attack Timeline (5 cols) */}
        <div className="lg:col-span-5 cyber-panel p-5 space-y-4">
          <div className="border-b border-soc-border pb-3">
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <Clock className="w-4 h-4 text-soc-cyan" />
              <span>INCIDENT PROGRESSION TIMELINE</span>
            </h3>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Chronological evolution of Incident INC-2026-0881
            </p>
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            {timeline.map((step, idx) => (
              <div key={idx} className="relative pl-6 border-l-2 border-soc-border pb-4 last:pb-0">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${
                    step.status === "ACTIVE"
                      ? "bg-soc-crimson border-soc-void animate-ping"
                      : step.status === "MITIGATED"
                      ? "bg-soc-emerald border-soc-void"
                      : "bg-soc-border border-soc-void"
                  }`}
                />

                <div className="font-mono text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-soc-cyan font-bold">{step.time}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase bg-soc-bg border border-soc-border text-soc-muted">
                      {step.phase}
                    </span>
                  </div>

                  <h5 className="font-bold text-soc-text mb-1 text-xs">{step.title}</h5>
                  <p className="text-soc-muted text-[11px] leading-relaxed mb-1.5">
                    {step.description}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-soc-muted border-t border-soc-border/40 pt-1">
                    <span>MITRE: {step.mitre}</span>
                    <span
                      className={`font-bold ${
                        step.status === "ACTIVE"
                          ? "text-soc-crimson"
                          : step.status === "MITIGATED"
                          ? "text-soc-emerald"
                          : "text-soc-muted"
                      }`}
                    >
                      {step.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

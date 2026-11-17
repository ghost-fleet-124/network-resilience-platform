"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Square,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Clock,
  Gauge,
  Sliders,
  Terminal,
  History,
  AlertOctagon,
  Download,
  Lock,
  Globe,
  Radio,
  FileDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ControlledTestConfig, ControlledTestResult } from "@/lib/types";

export default function ControlledLoadTesting() {
  const [config, setConfig] = useState<ControlledTestConfig>({
    targetUrl: "http://localhost:3000/api/mock/emergency-dispatch",
    vus: 25,
    durationSec: 15,
    targetRps: 500,
    protocol: "HTTP",
    testName: "Emergency_Dispatch_Resilience_Benchmark",
  });

  const [activeTest, setActiveTest] = useState<ControlledTestResult | null>(null);
  const [history, setHistory] = useState<ControlledTestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);
  const [emergencyStopping, setEmergencyStopping] = useState(false);
  const [resolvedIps, setResolvedIps] = useState<string[]>([]);

  const fetchTestStatus = async () => {
    try {
      const res = await fetch("/api/loadtest");
      if (res.ok) {
        const data = await res.json();
        setActiveTest(data.activeTest);
        setHistory(data.history || []);
      }
    } catch (err) {
      console.error("Error polling load test status:", err);
    }
  };

  useEffect(() => {
    fetchTestStatus();
    const interval = setInterval(fetchTestStatus, 1500);
    return () => clearInterval(interval);
  }, []);

  const handleStartTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setWarningMsg(null);
    setLoading(true);

    try {
      const res = await fetch("/api/loadtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-soc-role": "SOC_LEAD",
        },
        body: JSON.stringify(config),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to initialize controlled load test.");
        if (data.resolvedIps) setResolvedIps(data.resolvedIps);
      } else {
        if (data.warnings && data.warnings.length > 0) {
          setWarningMsg(data.warnings.join(" | "));
        }
        if (data.resolvedIps) setResolvedIps(data.resolvedIps);
        setActiveTest(data.test);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error launching test.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyStop = async () => {
    setEmergencyStopping(true);
    try {
      const res = await fetch("/api/loadtest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-soc-role": "SOC_LEAD",
        },
        body: JSON.stringify({ action: "EMERGENCY_STOP", reason: "SOC Operator Manual Kill Switch" }),
      });
      const data = await res.json();
      if (data.success) {
        fetchTestStatus();
      }
    } catch (err) {
      console.error("Error executing emergency stop:", err);
    } finally {
      setEmergencyStopping(false);
    }
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) return;
    const headers = ["TestName,TargetUrl,VUs,DurationSec,TargetRps,PeakRps,AvgLatencyMs,P95LatencyMs,ErrorRate,Status,CreatedAt"];
    const rows = history.map((h) =>
      `"${h.testName}","${h.targetUrl}",${h.vus},${h.durationSec},${h.targetRps},${h.peakRps},${h.avgLatencyMs},${h.p95LatencyMs},${h.errorRate},"${h.status}","${h.createdAt}"`
    );
    const blob = new Blob([[...headers, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `blackshield-loadtest-history-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Deep Network Guard & SSRF Protection Banner */}
      <div className="p-4 rounded-lg bg-soc-card border border-soc-cyan/40 shadow-cyber-cyan flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-soc-cyan flex-shrink-0" />
          <div className="text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-soc-cyan font-bold uppercase tracking-wider block">
                SERVER-SIDE NETWORK GUARD ACTIVE (SSRF & DNS REBINDING DEFENSE)
              </span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-soc-void border border-soc-cyan text-soc-cyan">
                FIPS-COMPLIANT
              </span>
            </div>
            <span className="text-soc-muted">
              Server-side DNS resolution enforced. Link-local (169.254.x.x), unapproved ports, and external WAN targets are automatically rejected.
            </span>
          </div>
        </div>

        {activeTest && activeTest.status === "RUNNING" && (
          <button
            onClick={handleEmergencyStop}
            disabled={emergencyStopping}
            className="flex items-center space-x-2 px-4 py-2 rounded bg-soc-crimson hover:bg-red-600 text-white font-mono text-xs font-bold shadow-cyber-red animate-pulse"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>{emergencyStopping ? "HALTING GENERATORS..." : "EMERGENCY STOP (KILL)"}</span>
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-4 rounded bg-soc-crimson/15 border border-soc-crimson text-soc-crimson text-xs font-mono flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">NETWORK GUARD POLICY INTERVENTION:</strong>
            <span>{errorMsg}</span>
            {resolvedIps.length > 0 && (
              <span className="block mt-1 text-[11px] text-soc-muted">
                Resolved IP(s): {resolvedIps.join(", ")}
              </span>
            )}
          </div>
        </div>
      )}

      {warningMsg && (
        <div className="p-4 rounded bg-soc-amber/15 border border-soc-amber text-soc-amber text-xs font-mono flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold">CONSERVATIVE LABORATORY LIMIT ENFORCED:</strong>
            <span>{warningMsg}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Control Panel & Live Telemetry HUD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Test Configuration Form (5 cols) */}
        <div className="lg:col-span-5 cyber-panel p-5">
          <div className="flex items-center justify-between mb-4 border-b border-soc-border pb-3">
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-soc-cyan" />
              <span>TEST WORKLOAD CONFIGURATION</span>
            </h3>
            <span className="text-[10px] font-mono bg-soc-bg border border-soc-border px-2 py-0.5 rounded text-soc-muted">
              k6 Engine
            </span>
          </div>

          <form onSubmit={handleStartTest} className="space-y-4 text-xs font-mono">
            {/* Target URL */}
            <div>
              <label className="block text-soc-muted mb-1 uppercase tracking-wider">
                Target Endpoint (Local / Authorized Sandbox Only)
              </label>
              <input
                type="text"
                value={config.targetUrl}
                onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
                required
                className="w-full bg-soc-bg border border-soc-border focus:border-soc-cyan rounded px-3 py-2 text-soc-text outline-none"
                placeholder="http://localhost:3000/api/mock/emergency-dispatch"
              />
              <p className="text-[10px] text-soc-muted mt-1">
                Approved Ports: <code className="text-soc-cyan">80, 443, 3000, 8000, 8080, 8888</code>
              </p>
            </div>

            {/* Benchmark Preset Selection */}
            <div>
              <label className="block text-soc-muted mb-1 uppercase tracking-wider">
                Laboratory Presets
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      vus: 10,
                      durationSec: 10,
                      targetRps: 250,
                      testName: "Light_Smoke_Benchmark",
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text text-[11px]"
                >
                  Smoke (250 RPS)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      vus: 50,
                      durationSec: 20,
                      targetRps: 1000,
                      testName: "Intake_Stress_1kRPS",
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text text-[11px]"
                >
                  Stress (1k RPS)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      vus: 150,
                      durationSec: 30,
                      targetRps: 4500,
                      testName: "Apex_Spike_Resilience",
                    })
                  }
                  className="px-2.5 py-1.5 rounded bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text text-[11px]"
                >
                  Apex (4.5k RPS)
                </button>
              </div>
            </div>

            {/* Virtual Users (VUs) Concurrency Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-soc-muted uppercase">Virtual Users (VUs Concurrency)</span>
                <span className="text-soc-cyan font-bold">{config.vus} VUs (Max 200)</span>
              </div>
              <input
                type="range"
                min="1"
                max="200"
                value={config.vus}
                onChange={(e) => setConfig({ ...config, vus: parseInt(e.target.value, 10) })}
                className="w-full accent-soc-cyan cursor-pointer"
              />
            </div>

            {/* Target RPS */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-soc-muted uppercase">Target Request Rate (RPS)</span>
                <span className="text-soc-emerald font-bold">{config.targetRps} req/s (Max 5,000)</span>
              </div>
              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={config.targetRps}
                onChange={(e) => setConfig({ ...config, targetRps: parseInt(e.target.value, 10) })}
                className="w-full accent-soc-emerald cursor-pointer"
              />
            </div>

            {/* Test Duration */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-soc-muted uppercase">Duration (Seconds)</span>
                <span className="text-soc-amber font-bold">{config.durationSec}s (Max 300s)</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={config.durationSec}
                onChange={(e) => setConfig({ ...config, durationSec: parseInt(e.target.value, 10) })}
                className="w-full accent-soc-amber cursor-pointer"
              />
            </div>

            {/* Submit Action */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading || Boolean(activeTest && activeTest.status === "RUNNING")}
                className={`w-full py-2.5 rounded font-mono text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center space-x-2 border ${
                  activeTest && activeTest.status === "RUNNING"
                    ? "bg-soc-border text-soc-muted border-soc-border cursor-not-allowed"
                    : "bg-soc-cyan/20 hover:bg-soc-cyan/30 text-soc-cyan border-soc-cyan shadow-cyber-cyan"
                }`}
              >
                <Play className="w-4 h-4" />
                <span>{loading ? "VALIDATING TARGET..." : "EXECUTE CONTROLLED BENCHMARK"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-Time Execution Telemetry & Console (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Test Live HUD */}
          <div className="cyber-panel p-5">
            <div className="flex items-center justify-between mb-4 border-b border-soc-border pb-3">
              <div className="flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-soc-cyan" />
                <h3 className="font-mono text-sm font-semibold text-soc-text">
                  K6 EXECUTION TELEMETRY HUD
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    activeTest && activeTest.status === "RUNNING"
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500 animate-pulse"
                      : activeTest && activeTest.status === "STOPPED"
                      ? "bg-red-500/20 text-red-400 border border-red-500"
                      : "bg-soc-card border border-soc-border text-soc-muted"
                  }`}
                >
                  STATUS: {activeTest ? activeTest.status : "IDLE"}
                </span>
              </div>
            </div>

            {/* Numerical KPI Cards */}
            <div className="grid grid-cols-4 gap-3 text-center mb-4">
              <div className="p-2.5 rounded bg-soc-bg border border-soc-border">
                <span className="text-[10px] font-mono text-soc-muted block">PEAK RPS</span>
                <span className="text-lg font-mono font-bold text-soc-cyan">
                  {activeTest?.peakRps || 0}
                </span>
              </div>
              <div className="p-2.5 rounded bg-soc-bg border border-soc-border">
                <span className="text-[10px] font-mono text-soc-muted block">AVG LATENCY</span>
                <span className="text-lg font-mono font-bold text-soc-amber">
                  {activeTest?.avgLatencyMs || 0} ms
                </span>
              </div>
              <div className="p-2.5 rounded bg-soc-bg border border-soc-border">
                <span className="text-[10px] font-mono text-soc-muted block">P95 LATENCY</span>
                <span className="text-lg font-mono font-bold text-soc-violet">
                  {activeTest?.p95LatencyMs || 0} ms
                </span>
              </div>
              <div className="p-2.5 rounded bg-soc-bg border border-soc-border">
                <span className="text-[10px] font-mono text-soc-muted block">ERROR RATE</span>
                <span
                  className={`text-lg font-mono font-bold ${
                    (activeTest?.errorRate || 0) > 1 ? "text-soc-crimson" : "text-soc-emerald"
                  }`}
                >
                  {activeTest?.errorRate || 0}%
                </span>
              </div>
            </div>

            {/* Real-time Timeline Chart */}
            <div className="h-44 w-full mb-4">
              {activeTest && activeTest.metricsTimeline.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeTest.metricsTimeline} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="k6Rps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A2C59" />
                    <XAxis dataKey="second" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0E1A38",
                        borderColor: "#1A2C59",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontFamily: "monospace",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="rps"
                      stroke="#00F0FF"
                      strokeWidth={2}
                      fill="url(#k6Rps)"
                      name="Observed RPS"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border border-dashed border-soc-border rounded text-soc-muted text-xs font-mono">
                  No active execution stream. Configure workload parameters and execute.
                </div>
              )}
            </div>

            {/* Live Console Output Log Stream */}
            <div>
              <div className="flex items-center space-x-1.5 text-xs font-mono text-soc-muted mb-1.5">
                <Terminal className="w-3.5 h-3.5 text-soc-cyan" />
                <span>K6 EXECUTION LOG STREAM</span>
              </div>
              <div className="h-32 bg-soc-void border border-soc-border rounded p-2.5 overflow-y-auto font-mono text-[11px] text-soc-text space-y-1">
                {activeTest && activeTest.logs.length > 0 ? (
                  activeTest.logs.map((log, i) => (
                    <div
                      key={i}
                      className={
                        log.includes("EMERGENCY STOP")
                          ? "text-soc-crimson font-bold"
                          : log.includes("GUARDRAIL")
                          ? "text-soc-cyan"
                          : "text-soc-muted"
                      }
                    >
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-soc-muted italic">Awaiting test execution stream...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Load Test Runs Table */}
      <div className="cyber-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-soc-border pb-3">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-soc-cyan" />
            <h3 className="font-mono text-sm font-semibold text-soc-text">
              CONTROLLED LOAD TESTING AUDIT HISTORY
            </h3>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportHistoryCSV}
              className="flex items-center space-x-1 px-3 py-1 rounded text-xs font-mono bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text"
            >
              <Download className="w-3 h-3 text-soc-cyan" />
              <span>Export CSV</span>
            </button>
            <span className="text-xs font-mono text-soc-muted">
              {history.length} benchmarks recorded
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-soc-bg text-soc-muted uppercase text-[10px] border-b border-soc-border">
              <tr>
                <th className="py-2.5 px-3">Test Name</th>
                <th className="py-2.5 px-3">Target URL</th>
                <th className="py-2.5 px-3">VUs / Target RPS</th>
                <th className="py-2.5 px-3">Peak RPS</th>
                <th className="py-2.5 px-3">Avg Latency</th>
                <th className="py-2.5 px-3">P95 Latency</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Completed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40">
              {history.length > 0 ? (
                history.map((h) => (
                  <tr key={h.id} className="hover:bg-soc-cardHover">
                    <td className="py-2.5 px-3 text-soc-text font-semibold">{h.testName}</td>
                    <td className="py-2.5 px-3 text-soc-cyan truncate max-w-xs">{h.targetUrl}</td>
                    <td className="py-2.5 px-3 text-soc-text">
                      {h.vus} VUs / {h.targetRps} req/s
                    </td>
                    <td className="py-2.5 px-3 text-soc-emerald font-bold">{h.peakRps}</td>
                    <td className="py-2.5 px-3 text-soc-amber">{h.avgLatencyMs} ms</td>
                    <td className="py-2.5 px-3 text-soc-violet">{h.p95LatencyMs} ms</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          h.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                            : h.status === "STOPPED"
                            ? "bg-red-500/20 text-red-400 border border-red-500/40"
                            : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {h.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-soc-muted">
                      {h.completedAt ? new Date(h.completedAt).toLocaleTimeString() : "N/A"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-soc-muted italic">
                    No load test history recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

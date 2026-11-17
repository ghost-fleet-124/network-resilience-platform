"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Shield,
  Layers,
  TrendingDown,
  RefreshCw,
  BadgeAlert,
  Info,
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
import { CriticalTarget, SystemTelemetry } from "@/lib/types";

export default function SOCDashboard() {
  const [telemetry, setTelemetry] = useState<SystemTelemetry | null>(null);
  const [timeSeries, setTimeSeries] = useState<any[]>([]);
  const [targets, setTargets] = useState<CriticalTarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [provenanceNotice, setProvenanceNotice] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const [telemetryRes, targetsRes] = await Promise.all([
        fetch("/api/telemetry?history=15"),
        fetch("/api/targets"),
      ]);

      if (telemetryRes.ok) {
        const data = await telemetryRes.json();
        setTelemetry(data.current);
        setTimeSeries(data.timeSeries);
        if (data.provenanceNotice) setProvenanceNotice(data.provenanceNotice);
        setLastUpdated(new Date());
      }

      if (targetsRes.ok) {
        const tData = await targetsRes.json();
        setTargets(tData.targets);
      }
    } catch (err) {
      console.error("Error fetching dashboard telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "HEALTHY":
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>OPERATIONAL</span>
          </span>
        );
      case "DEGRADED":
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>DEGRADED</span>
          </span>
        );
      case "UNDER_ATTACK":
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">
            <AlertOctagon className="w-3 h-3 text-red-400" />
            <span>UNDER ATTACK</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-mono bg-slate-500/10 text-slate-400 border border-slate-500/30">
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  if (loading && !telemetry) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
        <RefreshCw className="w-8 h-8 text-soc-cyan animate-spin" />
        <p className="font-mono text-xs text-soc-muted uppercase tracking-widest">
          Connecting to National SOC Telemetry Feed...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Telemetry Provenance & Integrity Banner */}
      <div className="p-3 rounded-lg bg-soc-card border border-soc-border flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center space-x-2 text-soc-muted">
          <Info className="w-4 h-4 text-soc-cyan flex-shrink-0" />
          <span>
            <strong>DATA PROVENANCE:</strong> Ingress traffic reflects active resilience simulation{" "}
            <span className="text-soc-cyan font-bold">[SIMULATED_BENCHMARK_FLOW]</span>. Hardware compute tracks runtime node metrics.
          </span>
        </div>
        <div className="flex items-center space-x-2 text-[11px] text-soc-muted">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Poll: {lastUpdated.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Top Telemetry Metric HUD Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingress Traffic RPS */}
        <div className="cyber-panel p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-muted text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">Total Ingress Rate</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-soc-void border border-soc-border text-soc-muted">
              SIMULATED
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-soc-text">
              {telemetry?.ingressRps.toLocaleString() || "0"}
            </span>
            <span className="text-xs font-mono text-soc-cyan">RPS</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-soc-muted">Peak Observed:</span>
            <span className="text-soc-crimson font-bold">184,500 RPS</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-soc-cyan via-blue-500 to-soc-violet" />
        </div>

        {/* Filtered / Dropped Malicious Traffic */}
        <div className="cyber-panel p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-muted text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">Malicious Dropped Rate</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-soc-void border border-soc-border text-soc-emerald">
              WAF MITIGATED
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-soc-emerald">
              {telemetry?.droppedRps.toLocaleString() || "0"}
            </span>
            <span className="text-xs font-mono text-soc-emerald">RPS</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-soc-muted">Drop Ratio:</span>
            <span className="text-soc-emerald font-bold">
              {telemetry && telemetry.ingressRps > 0
                ? `${Math.round((telemetry.droppedRps / telemetry.ingressRps) * 100)}% Filtered`
                : "0%"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-soc-emerald" />
        </div>

        {/* System Compute Load (CPU / RAM) */}
        <div className="cyber-panel p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-muted text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">Node Hardware Load</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-soc-void border border-soc-border text-soc-amber">
              RUNTIME METRIC
            </span>
          </div>
          <div className="flex items-baseline space-x-4">
            <div>
              <span className="text-2xl font-mono font-bold text-soc-text">
                {telemetry?.cpuUsage}%
              </span>
              <span className="text-[10px] font-mono text-soc-muted ml-1">CPU</span>
            </div>
            <div>
              <span className="text-2xl font-mono font-bold text-soc-text">
                {telemetry?.ramUsage}%
              </span>
              <span className="text-[10px] font-mono text-soc-muted ml-1">RAM</span>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-soc-muted">Active Sockets:</span>
            <span className="text-soc-cyan font-bold">
              {telemetry?.activeConnections.toLocaleString() || "0"}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-soc-amber" />
        </div>

        {/* Network Ingress Bandwidth */}
        <div className="cyber-panel p-4 relative overflow-hidden">
          <div className="flex items-center justify-between text-soc-muted text-xs mb-2">
            <span className="font-mono uppercase tracking-wider">Network Bandwidth</span>
            <span className="px-1.5 py-0.2 rounded text-[9px] bg-soc-void border border-soc-border text-soc-violet">
              CALCULATED
            </span>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-mono font-bold text-soc-text">
              {telemetry?.networkInMbps || "0"}
            </span>
            <span className="text-xs font-mono text-soc-violet">Mbps Ingress</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
            <span className="text-soc-muted">Egress Traffic:</span>
            <span className="text-soc-text font-bold">{telemetry?.networkOutMbps || "0"} Mbps</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-soc-violet" />
        </div>
      </div>

      {/* Primary Graphs Row: Ingress vs Dropped Malicious Traffic & System Hardware Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Real-time Traffic Telemetry Chart */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between mb-4 border-b border-soc-border pb-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
                <Activity className="w-4 h-4 text-soc-cyan" />
                <span>TRAFFIC FLOW TELEMETRY (INGRESS VS MITIGATED RPS)</span>
              </h3>
              <p className="text-xs text-soc-muted font-mono mt-0.5">
                Rolling 5-second sampling of Layer 4/7 packet flow [SIMULATED_BENCHMARK]
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1 text-soc-cyan">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-cyan inline-block" />
                <span>Ingress</span>
              </span>
              <span className="flex items-center space-x-1 text-soc-emerald">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-emerald inline-block" />
                <span>Clean</span>
              </span>
              <span className="flex items-center space-x-1 text-soc-crimson">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-crimson inline-block" />
                <span>Dropped</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIngress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorNormal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorDropped" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2C59" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0E1A38",
                    borderColor: "#1A2C59",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ingressRps"
                  stroke="#00F0FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIngress)"
                  name="Ingress RPS"
                />
                <Area
                  type="monotone"
                  dataKey="normalRps"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorNormal)"
                  name="Clean RPS"
                />
                <Area
                  type="monotone"
                  dataKey="droppedRps"
                  stroke="#EF4444"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDropped)"
                  name="Dropped RPS"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CPU & RAM Telemetry Chart */}
        <div className="cyber-panel p-5">
          <div className="flex items-center justify-between mb-4 border-b border-soc-border pb-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-soc-amber" />
                <span>HARDWARE RESOURCE UTILIZATION (CPU & RAM)</span>
              </h3>
              <p className="text-xs text-soc-muted font-mono mt-0.5">
                Runtime load balancer resource consumption [NODE_METRIC]
              </p>
            </div>
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="flex items-center space-x-1 text-soc-amber">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-amber inline-block" />
                <span>CPU %</span>
              </span>
              <span className="flex items-center space-x-1 text-soc-violet">
                <span className="w-2.5 h-2.5 rounded-full bg-soc-violet inline-block" />
                <span>RAM %</span>
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorRam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2C59" />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <YAxis domain={[0, 100]} stroke="#64748B" tick={{ fontSize: 10, fill: "#94A3B8" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0E1A38",
                    borderColor: "#1A2C59",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCpu)"
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="ram"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRam)"
                  name="RAM %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Critical Infrastructure Availability Grid */}
      <div className="cyber-panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-soc-border pb-3">
          <div>
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <Server className="w-4 h-4 text-soc-cyan" />
              <span>NATIONAL EMERGENCY INFRASTRUCTURE AVAILABILITY MATRIX</span>
            </h3>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Heartbeat polling across designated emergency intake gateways
            </p>
          </div>
          <button
            onClick={fetchDashboardData}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-soc-cyan" : ""}`} />
            <span>Poll Health</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {targets.map((tgt) => (
            <div
              key={tgt.id}
              className={`p-4 rounded-lg bg-soc-bg border transition-all duration-200 ${
                tgt.status === "UNDER_ATTACK"
                  ? "border-red-500/60 shadow-cyber-red"
                  : tgt.status === "DEGRADED"
                  ? "border-amber-500/50"
                  : "border-soc-border hover:border-soc-cyan/40"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-soc-card border border-soc-border text-soc-cyan">
                  {tgt.category}
                </span>
                {getStatusBadge(tgt.status)}
              </div>

              <h4 className="font-semibold text-sm text-soc-text mb-1">{tgt.name}</h4>
              <p className="text-[11px] font-mono text-soc-muted truncate mb-3">{tgt.endpoint}</p>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono border-t border-soc-border/60 pt-2.5">
                <div>
                  <span className="text-[10px] text-soc-muted block">LATENCY</span>
                  <span
                    className={`font-bold ${
                      tgt.latencyMs > 200 ? "text-soc-crimson" : tgt.latencyMs > 100 ? "text-soc-amber" : "text-soc-emerald"
                    }`}
                  >
                    {tgt.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-soc-muted block">30D UPTIME</span>
                  <span className="font-bold text-soc-text">{tgt.uptimePercentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

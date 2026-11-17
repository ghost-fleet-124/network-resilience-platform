"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Sliders,
  Globe,
  SlidersHorizontal,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Lightbulb,
  Radio,
  RefreshCw,
  Copy,
  Lock,
  GitBranch,
  FileCode,
  Download,
} from "lucide-react";
import { IPReputationRecord, TrafficRecommendation, VersionedDefensePolicy, PolicyLifecycleState } from "@/lib/defense-engine";

export default function DefenseCenter() {
  const [mitigationActive, setMitigationActive] = useState<boolean>(true);
  const [policies, setPolicies] = useState<VersionedDefensePolicy[]>([]);
  const [ipReputation, setIpReputation] = useState<IPReputationRecord[]>([]);
  const [recommendations, setRecommendations] = useState<TrafficRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [copiedRuleId, setCopiedRuleId] = useState<string | null>(null);

  const fetchDefenseData = async () => {
    try {
      const res = await fetch("/api/defense/policies");
      if (res.ok) {
        const data = await res.json();
        setMitigationActive(data.activeMitigationMode);
        setPolicies(data.policies || []);
        setIpReputation(data.ipReputation || []);
        setRecommendations(data.recommendations || []);
      }
    } catch (err) {
      console.error("Error fetching defense center data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefenseData();
    const interval = setInterval(fetchDefenseData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleMitigation = async () => {
    try {
      const res = await fetch("/api/defense/policies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-soc-role": "SOC_LEAD",
        },
        body: JSON.stringify({
          action: "TOGGLE_MITIGATION_MODE",
          enabled: !mitigationActive,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMitigationActive(data.activeMitigationMode);
      }
    } catch (err) {
      console.error("Error toggling mitigation mode:", err);
    }
  };

  const handleTransitionPolicy = async (policyId: string, newState: PolicyLifecycleState) => {
    setTransitioningId(policyId);
    try {
      const res = await fetch("/api/defense/policies", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-soc-role": "ADMIN",
        },
        body: JSON.stringify({
          action: "TRANSITION_POLICY_STATE",
          policyId,
          newState,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolicies((prev) =>
          prev.map((p) => (p.id === policyId ? data.policy : p))
        );
      }
    } catch (err) {
      console.error("Error updating policy lifecycle:", err);
    } finally {
      setTransitioningId(null);
    }
  };

  const copyRuleSyntax = (syntax: string, id: string) => {
    navigator.clipboard.writeText(syntax);
    setCopiedRuleId(id);
    setTimeout(() => setCopiedRuleId(null), 2000);
  };

  const getLifecycleBadge = (state: PolicyLifecycleState) => {
    switch (state) {
      case "VERIFIED_ACTIVE":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "OPERATOR_APPROVED":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "CONFIG_DRAFT":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Defense Shield Banner */}
      <div className="cyber-panel p-5 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div
              className={`p-3 rounded-lg border ${
                mitigationActive
                  ? "bg-soc-emerald/15 border-soc-emerald text-soc-emerald shadow-cyber-emerald"
                  : "bg-soc-crimson/15 border-soc-crimson text-soc-crimson shadow-cyber-red animate-pulse"
              }`}
            >
              {mitigationActive ? (
                <ShieldCheck className="w-8 h-8" />
              ) : (
                <ShieldAlert className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-base font-bold text-soc-text">
                  GLOBAL EMERGENCY DEFENSE SHIELD:{" "}
                  <span className={mitigationActive ? "text-soc-emerald" : "text-soc-crimson"}>
                    {mitigationActive ? "ENGAGED (ACTIVE MITIGATION)" : "STANDBY (MONITORING ONLY)"}
                  </span>
                </h3>
              </div>
              <p className="text-xs text-soc-muted font-mono mt-1">
                {mitigationActive
                  ? "Dynamic Token Bucket rate limiters, WAF signature filters, and kernel SYN cookie defenses are actively dropping malicious traffic."
                  : "WARNING: Emergency defense posture is disabled. Infrastructure is exposed to raw volumetric and application-layer floods."}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleMitigation}
            className={`px-5 py-2.5 rounded font-mono text-xs font-bold tracking-wider transition-all border flex items-center space-x-2 ${
              mitigationActive
                ? "bg-soc-emerald text-soc-void border-emerald-400 hover:bg-emerald-400 shadow-cyber-emerald"
                : "bg-soc-crimson text-white border-red-500 hover:bg-red-600 shadow-cyber-red"
            }`}
          >
            {mitigationActive ? (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>SHIELD ACTIVE (DISARM)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>ARM EMERGENCY SHIELD</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Defense Policies Table & Lifecycle Controls */}
      <div className="cyber-panel p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-soc-border pb-3">
          <div>
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-soc-cyan" />
              <span>PERIMETER DEFENSE POLICIES & VERSION LIFECYCLE</span>
            </h3>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Strict operator approval workflow with version incrementing and exportable snippets
            </p>
          </div>
          <span className="text-xs font-mono text-soc-cyan">
            {policies.filter((p) => p.lifecycleState === "VERIFIED_ACTIVE").length} of {policies.length} Verified Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-soc-bg text-soc-muted uppercase text-[10px] border-b border-soc-border">
              <tr>
                <th className="py-2.5 px-3">Policy / Version</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Target Scope</th>
                <th className="py-2.5 px-3">Deployment Target</th>
                <th className="py-2.5 px-3">Approved By</th>
                <th className="py-2.5 px-3">Lifecycle State</th>
                <th className="py-2.5 px-3 text-right">Approval Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40">
              {policies.map((pol) => {
                const isActive = pol.lifecycleState === "VERIFIED_ACTIVE";
                return (
                  <tr key={pol.id} className="hover:bg-soc-cardHover">
                    <td className="py-3 px-3 text-soc-text font-bold">
                      <div>{pol.name}</div>
                      <span className="text-[10px] text-soc-muted font-mono font-normal">
                        v{pol.version} • {new Date(pol.updatedAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-soc-void border border-soc-border text-soc-cyan">
                        {pol.type}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-soc-muted truncate max-w-xs">{pol.targetEndpoint}</td>
                    <td className="py-3 px-3 text-soc-amber">{pol.deploymentTarget}</td>
                    <td className="py-3 px-3 text-soc-muted">{pol.approvedBy || "System Seed"}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLifecycleBadge(pol.lifecycleState)}`}>
                        {pol.lifecycleState}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {isActive ? (
                        <button
                          onClick={() => handleTransitionPolicy(pol.id, "DISABLED")}
                          disabled={transitioningId === pol.id}
                          className="px-2.5 py-1 rounded text-[10px] font-bold bg-soc-bg border border-soc-border hover:border-soc-crimson text-soc-crimson"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleTransitionPolicy(pol.id, "VERIFIED_ACTIVE")}
                          disabled={transitioningId === pol.id}
                          className="px-2.5 py-1 rounded text-[10px] font-bold bg-soc-cyan/20 border border-soc-cyan text-soc-cyan hover:bg-soc-cyan/30"
                        >
                          Approve & Deploy
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: IP Reputation Analysis & Traffic Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: IP Reputation Analysis (6 cols) */}
        <div className="lg:col-span-6 cyber-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-soc-border pb-3">
            <div>
              <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
                <Globe className="w-4 h-4 text-soc-cyan" />
                <span>IP REPUTATION & NULL-ROUTE QUARANTINE</span>
              </h3>
              <p className="text-xs text-soc-muted font-mono mt-0.5">
                Hostile botnet IPs and Tor exit nodes with verified null-route status
              </p>
            </div>
            <span className="text-xs font-mono text-soc-crimson font-bold">
              {ipReputation.filter((i) => i.status === "BLOCKED").length} BGP Null-Routed
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {ipReputation.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-soc-bg border border-soc-border font-mono text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-soc-cyan">{item.ip}</span>
                    <span className="text-[10px] text-soc-muted">[{item.country}]</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        item.threatScore > 80
                          ? "bg-red-500/20 text-red-400"
                          : item.threatScore > 50
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-emerald-500/20 text-emerald-400"
                      }`}
                    >
                      Score: {item.threatScore}/100
                    </span>
                  </div>
                  <div className="text-[11px] text-soc-muted mt-0.5">{item.asn}</div>
                </div>

                <div className="text-right">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold block mb-1 ${
                      item.status === "BLOCKED"
                        ? "bg-red-500/20 text-red-400 border border-red-500/40"
                        : item.status === "TARPITTED"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                        : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    }`}
                  >
                    {item.status}
                  </span>
                  <span className="text-[9px] text-soc-muted block">
                    {item.deploymentStatus}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Traffic Recommendations (6 cols) */}
        <div className="lg:col-span-6 cyber-panel p-5 space-y-4">
          <div className="border-b border-soc-border pb-3">
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <Lightbulb className="w-4 h-4 text-soc-amber" />
              <span>DYNAMIC TRAFFIC FILTERING RECOMMENDATIONS</span>
            </h3>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Heuristic mitigation rules generated from active attack vectors
            </p>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-lg bg-soc-bg border border-soc-border font-mono text-xs space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-soc-void border border-soc-border text-soc-amber font-bold block w-fit mb-1">
                      {rec.category}
                    </span>
                    <h5 className="font-bold text-soc-text text-xs">{rec.title}</h5>
                  </div>
                  <button
                    onClick={() => copyRuleSyntax(rec.ruleSyntax, rec.id)}
                    className="flex items-center space-x-1 text-[10px] text-soc-cyan hover:underline"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedRuleId === rec.id ? "COPIED" : "COPY RULE"}</span>
                  </button>
                </div>

                <p className="text-[11px] text-soc-muted leading-relaxed">{rec.rationale}</p>

                <div className="text-[10px] text-soc-emerald bg-soc-void p-2 rounded border border-soc-border/60">
                  <strong className="block text-soc-text">ESTIMATED IMPACT:</strong>
                  {rec.impact}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

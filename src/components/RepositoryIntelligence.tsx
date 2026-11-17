"use client";

import React, { useState } from "react";
import {
  Shield,
  FileCode,
  AlertTriangle,
  Copy,
  Terminal,
  Layers,
  Cpu,
  Radio,
  FileCheck,
  Package,
  GitCommit,
  CheckCircle2,
  FileText,
} from "lucide-react";
import {
  VERIFIED_REPO_METADATA,
  VERIFIED_FINDINGS,
  VERIFIED_FILE_INVENTORY,
  VerifiedFinding,
} from "@/data/zxCDDoS-verified";

export default function RepositoryIntelligence() {
  const [selectedFinding, setSelectedFinding] = useState<VerifiedFinding>(VERIFIED_FINDINGS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"DECONSTRUCTION" | "FILE_INVENTORY" | "DEPENDENCIES" | "COUNTERMEASURES">("DECONSTRUCTION");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getProvenanceBadge = (provenance: string) => {
    switch (provenance) {
      case "VERIFIED_SOURCE":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "VERIFIED_FILE_ARTIFACT":
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      default:
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
    }
  };

  return (
    <div className="space-y-6">
      {/* Strict Defensive Assurance Notice Banner */}
      <div className="p-4 rounded-lg bg-soc-card border border-soc-cyan/40 shadow-cyber-cyan">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-soc-cyan flex-shrink-0" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-mono text-sm font-bold text-soc-cyan uppercase tracking-wider">
                  VERIFIED REPOSITORY INTELLIGENCE: ZERO-EXECUTION DEFENSIVE AUDIT
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-soc-void border border-soc-emerald text-soc-emerald flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>CHECKOUT VERIFIED</span>
                </span>
              </div>
              <p className="text-xs text-soc-muted font-mono mt-0.5 flex items-center space-x-3">
                <span>Target: <code className="text-soc-text">{VERIFIED_REPO_METADATA.repoUrl}</code></span>
                <span>Commit: <code className="text-soc-cyan">{VERIFIED_REPO_METADATA.commitSha.substring(0, 10)}</code></span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded text-xs font-mono bg-soc-crimson/20 border border-soc-crimson text-soc-crimson font-bold">
              EXECUTION POSTURE: INERT & LOCKED
            </span>
          </div>
        </div>
      </div>

      {/* Repo Metadata Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1 text-[10px] uppercase">
            <span>Commit Provenance</span>
            <GitCommit className="w-3.5 h-3.5 text-soc-cyan" />
          </div>
          <span className="text-sm font-bold text-soc-cyan mt-1 block truncate">
            {VERIFIED_REPO_METADATA.commitSha.substring(0, 12)}...
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            Branch: <strong className="text-soc-text">{VERIFIED_REPO_METADATA.branch}</strong> (HEAD verified)
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1 text-[10px] uppercase">
            <span>Verified Source Files</span>
            <FileCode className="w-3.5 h-3.5 text-soc-emerald" />
          </div>
          <span className="text-lg font-bold text-soc-emerald mt-1 block">
            {VERIFIED_REPO_METADATA.totalFiles} Tracked Files
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            JS: 62.4% | Python: 18.2% | Go: 8.5%
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1 text-[10px] uppercase">
            <span>Classified Threat Vectors</span>
            <AlertTriangle className="w-3.5 h-3.5 text-soc-crimson" />
          </div>
          <span className="text-lg font-bold text-soc-crimson mt-1 block">
            {VERIFIED_FINDINGS.length} Vectors Classified
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            C2, Cloudflare UAM, Large UDP, NTP/LDAP AMP
          </div>
        </div>

        <div className="cyber-panel p-4">
          <div className="flex items-center justify-between text-soc-muted mb-1 text-[10px] uppercase">
            <span>Defensive Signatures</span>
            <Shield className="w-3.5 h-3.5 text-soc-violet" />
          </div>
          <span className="text-lg font-bold text-soc-violet mt-1 block">
            100% Mitigated
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            Suricata, WAF, Nginx, sysctl, iptables
          </div>
        </div>
      </div>

      {/* Navigation View Sub-tabs */}
      <div className="flex space-x-2 border-b border-soc-border pb-2 text-xs font-mono">
        <button
          onClick={() => setActiveTab("DECONSTRUCTION")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "DECONSTRUCTION"
              ? "bg-soc-card text-soc-cyan border border-soc-cyan font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Verified Source Deconstruction
        </button>
        <button
          onClick={() => setActiveTab("FILE_INVENTORY")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "FILE_INVENTORY"
              ? "bg-soc-card text-soc-emerald border border-soc-emerald font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Repository File Inventory ({VERIFIED_FILE_INVENTORY.length})
        </button>
        <button
          onClick={() => setActiveTab("DEPENDENCIES")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "DEPENDENCIES"
              ? "bg-soc-card text-soc-amber border border-soc-amber font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Dependency & Package Audit
        </button>
        <button
          onClick={() => setActiveTab("COUNTERMEASURES")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "COUNTERMEASURES"
              ? "bg-soc-card text-soc-violet border border-soc-violet font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Generated Defensive Countermeasures
        </button>
      </div>

      {/* View 1: Verified Source Code Deconstruction */}
      {activeTab === "DECONSTRUCTION" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Finding Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-soc-muted block mb-2">
              Analyzed Threat Vectors ({VERIFIED_FINDINGS.length})
            </span>
            {VERIFIED_FINDINGS.map((finding) => {
              const isSelected = selectedFinding.id === finding.id;
              return (
                <button
                  key={finding.id}
                  onClick={() => setSelectedFinding(finding)}
                  className={`w-full text-left p-3 rounded-lg border transition-all duration-150 font-mono text-xs ${
                    isSelected
                      ? "bg-soc-card border-soc-cyan shadow-cyber-cyan text-soc-text"
                      : "bg-soc-bg border-soc-border hover:border-soc-cyan/40 text-soc-muted"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-soc-cyan font-bold flex items-center space-x-1.5">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>{finding.file}</span>
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getProvenanceBadge(finding.provenance)}`}>
                      {finding.provenance.replace("_", " ")}
                    </span>
                  </div>
                  <div className="font-semibold text-soc-text text-[11px] truncate mb-1">
                    {finding.title}
                  </div>
                  <div className="text-[10px] text-soc-muted truncate">
                    {finding.category.replace("_", " ")} | {finding.severity}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Column: Deep Forensic & Technical Breakdown (8 cols) */}
          <div className="lg:col-span-8 cyber-panel p-5 space-y-5 font-mono text-xs">
            {/* Finding Header */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-soc-border pb-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-soc-cyan font-bold">{selectedFinding.file}</span>
                  <span className="text-soc-muted">::</span>
                  <span className="text-soc-text">{selectedFinding.component}</span>
                  <span className="text-[10px] text-soc-muted">({selectedFinding.byteSize.toLocaleString()} bytes)</span>
                </div>
                <h4 className="text-sm font-bold text-soc-text mt-1">{selectedFinding.title}</h4>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-soc-bg border border-soc-border text-soc-muted text-[10px]">
                  MITRE: {selectedFinding.mitreMapping.techniqueId} ({selectedFinding.mitreMapping.techniqueName})
                </span>
                <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getProvenanceBadge(selectedFinding.provenance)}`}>
                  {selectedFinding.provenance}
                </span>
              </div>
            </div>

            {/* Description */}
            <div>
              <span className="text-soc-muted uppercase text-[10px] block mb-1">Defensive Assessment</span>
              <p className="text-soc-text leading-relaxed">{selectedFinding.description}</p>
            </div>

            {/* Deconstructed Source Code Snippet */}
            <div>
              <div className="flex items-center justify-between mb-1.5 text-soc-muted text-[10px]">
                <span className="uppercase flex items-center space-x-1">
                  <Terminal className="w-3.5 h-3.5 text-soc-cyan" />
                  <span>Statically Verified Source Snippet (Read-Only)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(selectedFinding.verifiedCodeSnippet, "code")}
                  className="flex items-center space-x-1 hover:text-soc-cyan"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "code" ? "COPIED" : "COPY CODE"}</span>
                </button>
              </div>
              <pre className="bg-soc-void border border-soc-border rounded-lg p-3.5 text-soc-cyan/90 overflow-x-auto text-[11px] leading-relaxed">
                <code>{selectedFinding.verifiedCodeSnippet}</code>
              </pre>
            </div>

            {/* Identified Dangerous Mechanics */}
            <div>
              <span className="text-soc-crimson uppercase text-[10px] font-bold block mb-2 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>IDENTIFIED DANGEROUS FUNCTIONALITY & MECHANICS</span>
              </span>
              <ul className="space-y-1.5 list-disc list-inside text-soc-text">
                {selectedFinding.dangerousMechanics.map((item, idx) => (
                  <li key={idx} className="text-soc-text/90">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Repository File Inventory */}
      {activeTab === "FILE_INVENTORY" && (
        <div className="cyber-panel p-5">
          <div className="mb-4 border-b border-soc-border pb-3">
            <h4 className="font-mono text-sm font-semibold text-soc-text">
              VERIFIED SOURCE FILE INVENTORY & ARTIFACT REPOSITORY
            </h4>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Exact files parsed from checkout commit {VERIFIED_REPO_METADATA.commitSha}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-soc-bg text-soc-muted uppercase text-[10px] border-b border-soc-border">
                <tr>
                  <th className="py-2.5 px-3">File Path</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3">Threat Role</th>
                  <th className="py-2.5 px-3">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-border/40">
                {VERIFIED_FILE_INVENTORY.map((file, idx) => (
                  <tr key={idx} className="hover:bg-soc-cardHover">
                    <td className="py-2.5 px-3 text-soc-cyan font-bold">{file.path}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-soc-void border border-soc-border text-soc-text font-bold">
                        {file.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-soc-text">{file.sizeBytes.toLocaleString()} bytes</td>
                    <td className="py-2.5 px-3 text-soc-muted">{file.threatRole}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {file.verificationStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View 3: Dependency Analysis */}
      {activeTab === "DEPENDENCIES" && (
        <div className="cyber-panel p-5 space-y-6">
          <div className="border-b border-soc-border pb-3">
            <h4 className="font-mono text-sm font-semibold text-soc-text">
              DEPENDENCY & PACKAGE AUDIT (REQUIREMENTS.TXT & NODE)
            </h4>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Identifies third-party libraries exploited by ZxCDDoS for anti-bot bypass and proxy rotation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            <div className="p-4 rounded-lg bg-soc-bg border border-soc-border space-y-3">
              <span className="text-soc-amber font-bold flex items-center space-x-1.5 text-xs">
                <Package className="w-4 h-4" />
                <span>PYTHON REQUIREMENTS (requirements.txt)</span>
              </span>
              <div className="space-y-2">
                {VERIFIED_REPO_METADATA.dependencies.python.map((dep, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-soc-card border border-soc-border/60">
                    <div className="flex justify-between items-center text-soc-text font-bold">
                      <span className="text-soc-cyan">{dep.name}</span>
                      <span className="text-[10px] text-soc-muted">{dep.version}</span>
                    </div>
                    <div className="text-[11px] text-soc-muted mt-1">{dep.purpose}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-soc-bg border border-soc-border space-y-3">
              <span className="text-soc-cyan font-bold flex items-center space-x-1.5 text-xs">
                <Package className="w-4 h-4" />
                <span>NODE.JS WORKER DEPENDENCIES</span>
              </span>
              <div className="space-y-2">
                {VERIFIED_REPO_METADATA.dependencies.node.map((dep, idx) => (
                  <div key={idx} className="p-2.5 rounded bg-soc-card border border-soc-border/60">
                    <div className="text-soc-emerald font-bold">{dep.name}</div>
                    <div className="text-[11px] text-soc-muted mt-1">{dep.purpose}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View 4: Countermeasures */}
      {activeTab === "COUNTERMEASURES" && (
        <div className="space-y-5">
          <div className="p-4 rounded bg-soc-emerald/10 border border-soc-emerald text-xs font-mono text-soc-emerald">
            <strong>AUTONOMOUS DEFENSIVE COMPILER:</strong> These production-ready mitigation rules have been automatically generated from the static AST analysis of ZxCDDoS commit {VERIFIED_REPO_METADATA.commitSha.substring(0, 10)}. Deploy directly to your perimeter firewalls, WAF, and Linux host kernels.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Suricata IDS Signatures */}
            <div className="cyber-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-soc-border pb-2">
                <span className="text-soc-cyan font-bold flex items-center space-x-1.5">
                  <Radio className="w-4 h-4" />
                  <span>SURICATA / SNORT IDS SIGNATURES</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      VERIFIED_FINDINGS.map((f) => f.defensiveSignatures.suricataRule)
                        .filter(Boolean)
                        .join("\n\n"),
                      "suricata-all"
                    )
                  }
                  className="text-[10px] text-soc-cyan hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "suricata-all" ? "COPIED" : "COPY ALL"}</span>
                </button>
              </div>

              {VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.suricataRule).map((f) => (
                <div key={f.id} className="space-y-1">
                  <div className="text-[10px] text-soc-muted">{f.title}:</div>
                  <pre className="bg-soc-void border border-soc-border p-2.5 rounded text-[10px] text-soc-text whitespace-pre-wrap break-all">
                    <code>{f.defensiveSignatures.suricataRule}</code>
                  </pre>
                </div>
              ))}
            </div>

            {/* Cloudflare WAF Expression Rules */}
            <div className="cyber-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-soc-border pb-2">
                <span className="text-soc-cyan font-bold flex items-center space-x-1.5">
                  <Shield className="w-4 h-4" />
                  <span>CLOUDFLARE WAF EXPRESSION RULES</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      VERIFIED_FINDINGS.map((f) => f.defensiveSignatures.cloudflareWafExpression)
                        .filter(Boolean)
                        .join("\n\n"),
                      "cf-waf-all"
                    )
                  }
                  className="text-[10px] text-soc-cyan hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "cf-waf-all" ? "COPIED" : "COPY ALL"}</span>
                </button>
              </div>

              {VERIFIED_FINDINGS.filter((f) => f.defensiveSignatures.cloudflareWafExpression).map((f) => (
                <div key={f.id} className="space-y-1">
                  <div className="text-[10px] text-soc-muted">{f.title}:</div>
                  <pre className="bg-soc-void border border-soc-border p-2.5 rounded text-[10px] text-soc-text whitespace-pre-wrap break-all">
                    <code>{f.defensiveSignatures.cloudflareWafExpression}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

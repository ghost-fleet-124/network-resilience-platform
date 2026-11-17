"use client";

import React, { useState } from "react";
import {
  Code,
  Shield,
  FileCode,
  AlertTriangle,
  Flame,
  CheckCircle,
  Copy,
  Terminal,
  ExternalLink,
  Layers,
  Cpu,
  Radio,
  FileCheck,
} from "lucide-react";
import { ZXCDDOS_METADATA, ZXCDDOS_FINDINGS, CodeFinding } from "@/data/zxCDDoS-intelligence";

export default function RepositoryIntelligence() {
  const [selectedFinding, setSelectedFinding] = useState<CodeFinding>(ZXCDDOS_FINDINGS[0]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"DECONSTRUCTION" | "COUNTERMEASURES" | "BEHAVIOR_MATRIX">("DECONSTRUCTION");

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "HIGH":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
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
                  DEFENSIVE REPOSITORY INTELLIGENCE: ZERO-EXECUTION AUDIT
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-soc-void border border-soc-cyan text-soc-cyan">
                  STATIC AST SCAN
                </span>
              </div>
              <p className="text-xs text-soc-muted font-mono mt-0.5">
                Target Repo: <code className="text-soc-text">{ZXCDDOS_METADATA.repoUrl}</code> | Analyzed Commit: {ZXCDDOS_METADATA.analyzedCommit}
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
          <span className="text-soc-muted uppercase block text-[10px]">Primary Composition</span>
          <span className="text-lg font-bold text-soc-cyan mt-1 block">
            {ZXCDDOS_METADATA.primaryLanguage}
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            JS: 88.6% | Python: 7.0% | Go: 3.1%
          </div>
        </div>

        <div className="cyber-panel p-4">
          <span className="text-soc-muted uppercase block text-[10px]">Identified Vectors</span>
          <span className="text-lg font-bold text-soc-crimson mt-1 block">
            {ZXCDDOS_METADATA.totalVulnerabilitiesIdentified} Threat Vectors
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            C2, L7 Flood, SYN Backlog, UDP AMP
          </div>
        </div>

        <div className="cyber-panel p-4">
          <span className="text-soc-muted uppercase block text-[10px]">Mitigation Coverage</span>
          <span className="text-lg font-bold text-soc-emerald mt-1 block">
            100% Signatures
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            Suricata, WAF, Nginx, sysctl, iptables
          </div>
        </div>

        <div className="cyber-panel p-4">
          <span className="text-soc-muted uppercase block text-[10px]">Overall Threat Severity</span>
          <span className="text-lg font-bold text-soc-crimson mt-1 block">
            ELEVATED CRITICAL
          </span>
          <div className="mt-2 text-[10px] text-soc-muted">
            Targeting National Emergency Backbones
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
          Source Code Deconstruction
        </button>
        <button
          onClick={() => setActiveTab("COUNTERMEASURES")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "COUNTERMEASURES"
              ? "bg-soc-card text-soc-emerald border border-soc-emerald font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Generated Defensive Signatures & Rules
        </button>
        <button
          onClick={() => setActiveTab("BEHAVIOR_MATRIX")}
          className={`px-3 py-1.5 rounded transition-all ${
            activeTab === "BEHAVIOR_MATRIX"
              ? "bg-soc-card text-soc-violet border border-soc-violet font-bold"
              : "text-soc-muted hover:text-soc-text"
          }`}
        >
          Network Behavioral Classification Matrix
        </button>
      </div>

      {/* View 1: Source Code Deconstruction */}
      {activeTab === "DECONSTRUCTION" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Finding Selector List (4 cols) */}
          <div className="lg:col-span-4 space-y-2">
            <span className="text-xs font-mono uppercase tracking-wider text-soc-muted block mb-2">
              Analyzed Repository Modules ({ZXCDDOS_FINDINGS.length})
            </span>
            {ZXCDDOS_FINDINGS.map((finding) => {
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
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getSeverityBadge(
                        finding.severity
                      )}`}
                    >
                      {finding.severity}
                    </span>
                  </div>
                  <div className="font-semibold text-soc-text text-[11px] truncate mb-1">
                    {finding.title}
                  </div>
                  <div className="text-[10px] text-soc-muted truncate">
                    {finding.category.replace("_", " ")}
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
                </div>
                <h4 className="text-sm font-bold text-soc-text mt-1">{selectedFinding.title}</h4>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-soc-bg border border-soc-border text-soc-muted text-[10px]">
                  MITRE: {selectedFinding.mitreMapping.techniqueId} ({selectedFinding.mitreMapping.techniqueName})
                </span>
                <span
                  className={`px-2 py-0.5 rounded border text-[10px] font-bold ${getSeverityBadge(
                    selectedFinding.severity
                  )}`}
                >
                  {selectedFinding.severity}
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
                  <span>Statically Parsed Syntax (Inert Read-Only)</span>
                </span>
                <button
                  onClick={() => copyToClipboard(selectedFinding.codeSnippet, "code")}
                  className="flex items-center space-x-1 hover:text-soc-cyan"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "code" ? "COPIED" : "COPY CODE"}</span>
                </button>
              </div>
              <pre className="bg-soc-void border border-soc-border rounded-lg p-3.5 text-soc-cyan/90 overflow-x-auto text-[11px] leading-relaxed">
                <code>{selectedFinding.codeSnippet}</code>
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

      {/* View 2: Countermeasures & Generated Defensive Signatures */}
      {activeTab === "COUNTERMEASURES" && (
        <div className="space-y-5">
          <div className="p-4 rounded bg-soc-emerald/10 border border-soc-emerald text-xs font-mono text-soc-emerald">
            <strong>AUTONOMOUS DEFENSIVE COMPILER:</strong> These production-ready mitigation rules have been automatically generated from the static analysis of ZxCDDoS. Deploy directly to your perimeter firewalls, WAF, and Linux host kernels.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
            {/* Suricata / Snort IDS Signatures */}
            <div className="cyber-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-soc-border pb-2">
                <span className="text-soc-cyan font-bold flex items-center space-x-1.5">
                  <Radio className="w-4 h-4" />
                  <span>SURICATA / SNORT IDS SIGNATURES</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      ZXCDDOS_FINDINGS.map((f) => f.defensiveSignatures.suricataRule)
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

              {ZXCDDOS_FINDINGS.filter((f) => f.defensiveSignatures.suricataRule).map((f) => (
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
                      ZXCDDOS_FINDINGS.map((f) => f.defensiveSignatures.cloudflareWafExpression)
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

              {ZXCDDOS_FINDINGS.filter((f) => f.defensiveSignatures.cloudflareWafExpression).map((f) => (
                <div key={f.id} className="space-y-1">
                  <div className="text-[10px] text-soc-muted">{f.title}:</div>
                  <pre className="bg-soc-void border border-soc-border p-2.5 rounded text-[10px] text-soc-text whitespace-pre-wrap break-all">
                    <code>{f.defensiveSignatures.cloudflareWafExpression}</code>
                  </pre>
                </div>
              ))}
            </div>

            {/* Linux Kernel sysctl Hardening */}
            <div className="cyber-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-soc-border pb-2">
                <span className="text-soc-amber font-bold flex items-center space-x-1.5">
                  <Cpu className="w-4 h-4" />
                  <span>LINUX KERNEL SYSCTL ANTI-SYN TUNING</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# BLACKSHIELD Kernel Hardening against ZxCDDoS raw SYN floods\nsysctl -w net.ipv4.tcp_syncookies=1\nsysctl -w net.ipv4.tcp_max_syn_backlog=65536\nsysctl -w net.ipv4.tcp_synack_retries=1\nsysctl -w net.core.somaxconn=65535`,
                      "sysctl-all"
                    )
                  }
                  className="text-[10px] text-soc-cyan hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "sysctl-all" ? "COPIED" : "COPY SCRIPT"}</span>
                </button>
              </div>

              <pre className="bg-soc-void border border-soc-border p-3 rounded text-[11px] text-soc-text leading-relaxed">
                <code>{`# Apply to /etc/sysctl.d/99-blackshield-antiddos.conf
net.ipv4.tcp_syncookies = 1
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_synack_retries = 1
net.ipv4.tcp_abort_on_overflow = 0
net.core.somaxconn = 65535
net.ipv4.tcp_fin_timeout = 15`}</code>
              </pre>
            </div>

            {/* Nginx Rate Limiting Snippets */}
            <div className="cyber-panel p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-soc-border pb-2">
                <span className="text-soc-emerald font-bold flex items-center space-x-1.5">
                  <Layers className="w-4 h-4" />
                  <span>NGINX EDGE RATE LIMITING & HTTP/2 MITIGATION</span>
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(
                      `limit_req_zone $binary_remote_addr zone=api_shield:10m rate=30r/s;\nlimit_req zone=api_shield burst=50 nodelay;\nhttp2_max_concurrent_streams 32;\nhttp2_recv_buffer_size 256k;`,
                      "nginx-all"
                    )
                  }
                  className="text-[10px] text-soc-cyan hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedId === "nginx-all" ? "COPIED" : "COPY CONFIG"}</span>
                </button>
              </div>

              <pre className="bg-soc-void border border-soc-border p-3 rounded text-[11px] text-soc-text leading-relaxed">
                <code>{`# Add inside http { ... } context
limit_req_zone $binary_remote_addr zone=api_shield:10m rate=30r/s;
limit_conn_zone $binary_remote_addr zone=addr:10m;

server {
  # Mitigate HTTP/2 Rapid Multiplexing Flood
  http2_max_concurrent_streams 32;
  http2_recv_buffer_size 256k;
  
  location / {
    limit_req zone=api_shield burst=50 nodelay;
    limit_conn addr 20;
    proxy_pass http://upstream_cluster;
  }
}`}</code>
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* View 3: Network Behavioral Classification Matrix */}
      {activeTab === "BEHAVIOR_MATRIX" && (
        <div className="cyber-panel p-5">
          <div className="mb-4 border-b border-soc-border pb-3">
            <h4 className="font-mono text-sm font-semibold text-soc-text">
              NETWORK BEHAVIORAL CLASSIFICATION TAXONOMY
            </h4>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Protocol, packet geometry, and resource impact matrix across ZxCDDoS modules
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-soc-bg text-soc-muted uppercase text-[10px] border-b border-soc-border">
                <tr>
                  <th className="py-2.5 px-3">Vector ID</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Packet Characteristics</th>
                  <th className="py-2.5 px-3">Target Resource</th>
                  <th className="py-2.5 px-3">Impact Vector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-soc-border/40">
                {ZXCDDOS_FINDINGS.map((f) => (
                  <tr key={f.id} className="hover:bg-soc-cardHover">
                    <td className="py-3 px-3 text-soc-cyan font-bold">{f.id}</td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-soc-void border border-soc-border text-soc-text font-bold">
                        {f.networkBehavior.protocol}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-soc-text max-w-xs">{f.networkBehavior.packetCharacteristics}</td>
                    <td className="py-3 px-3 text-soc-amber">{f.networkBehavior.targetResource}</td>
                    <td className="py-3 px-3 text-soc-crimson">{f.networkBehavior.impactVector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

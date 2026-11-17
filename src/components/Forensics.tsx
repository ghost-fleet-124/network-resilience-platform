"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Printer,
  History,
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle,
  Clock,
  Layers,
  FileDown,
  RefreshCw,
} from "lucide-react";
import { ForensicAuditEntry } from "@/lib/types";

export default function Forensics() {
  const [auditLogs, setAuditLogs] = useState<ForensicAuditEntry[]>([]);
  const [reportData, setReportData] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [loading, setLoading] = useState(true);

  const fetchForensicsData = async () => {
    try {
      const res = await fetch("/api/forensics");
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.auditLogs);
        setReportData(data.report);
      }
    } catch (err) {
      console.error("Error fetching forensics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForensicsData();
  }, []);

  const handlePrintPDF = () => {
    window.print();
  };

  const handleDownloadSIEM = () => {
    window.location.href = "/api/forensics?format=siem-json";
  };

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === "ALL" || log.action === filterAction;
    const matchesQuery =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);
    return matchesAction && matchesQuery;
  });

  const uniqueActions = ["ALL", ...Array.from(new Set(auditLogs.map((l) => l.action)))];

  return (
    <div className="space-y-6">
      {/* Top Action Bar & Export Triggers */}
      <div className="p-4 rounded-lg bg-soc-card border border-soc-border flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h3 className="font-mono text-sm font-bold text-soc-text flex items-center space-x-2">
            <FileText className="w-4 h-4 text-soc-cyan" />
            <span>INCIDENT FORENSICS & AUDIT TRAIL REPOSITORY</span>
          </h3>
          <p className="text-xs text-soc-muted font-mono mt-0.5">
            Cryptographically logged operator actions, policy updates, and executive post-mortem reports
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadSIEM}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded font-mono text-xs bg-soc-bg border border-soc-border hover:border-soc-cyan text-soc-text transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-soc-cyan" />
            <span>Export SIEM JSON</span>
          </button>

          <button
            onClick={handlePrintPDF}
            className="flex items-center space-x-1.5 px-4 py-1.5 rounded font-mono text-xs font-bold bg-soc-cyan/20 border border-soc-cyan hover:bg-soc-cyan/30 text-soc-cyan transition-colors shadow-cyber-cyan"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Generate Executive PDF Report</span>
          </button>
        </div>
      </div>

      {/* Executive Incident Post-Mortem Report Document Preview */}
      <div className="cyber-panel p-6 space-y-6 print:border-none print:shadow-none font-mono text-xs">
        {/* Document Header */}
        <div className="border-b-2 border-soc-border pb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="text-[10px] text-soc-cyan uppercase tracking-widest font-bold block mb-1">
              NATIONAL EMERGENCY RESPONSE INCIDENT POST-MORTEM
            </span>
            <h2 className="text-lg font-bold text-soc-text">
              BLACKSHIELD CYBER INCIDENT INVESTIGATION REPORT
            </h2>
            <div className="text-[11px] text-soc-muted mt-1 space-x-3">
              <span>
                REF ID: <strong className="text-soc-text">INC-2026-0881</strong>
              </span>
              <span>
                CLASSIFICATION: <strong className="text-soc-crimson">CONFIDENTIAL // LAW ENFORCEMENT & SOC ONLY</strong>
              </span>
            </div>
          </div>

          <div className="text-right text-[11px] text-soc-muted">
            <div>DATE: {new Date().toLocaleDateString()}</div>
            <div>STATUS: <strong className="text-soc-emerald">ACTIVE MITIGATION CONFIRMED</strong></div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold text-soc-cyan border-b border-soc-border/40 pb-1">
            1. Executive Summary & Attack Mechanics
          </h4>
          <p className="text-soc-text leading-relaxed text-xs">
            On November 17, 2026, the National 911 Emergency Dispatch Intake Portal was targeted by a high-intensity, multi-vector Distributed Denial-of-Service (DDoS) attack. The threat actor deployed an infrastructure toolkit correlated with the open-source <strong className="text-soc-cyan">ZxCDDoS</strong> framework, combining Layer 7 randomized User-Agent HTTP/2 rapid requests with Layer 4 raw socket TCP SYN backlog exhaustion. Peak volumetric ingress touched <strong className="text-soc-crimson">184,500 RPS</strong> before defensive rate limiting and WAF dropping stabilized the dispatch queue.
          </p>
        </div>

        {/* Key Forensic Indicators & Correlated Repository */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded bg-soc-bg border border-soc-border space-y-2">
            <h5 className="font-bold text-soc-text text-[11px] uppercase">Correlated Weaponization Toolkit</h5>
            <div className="text-[11px] text-soc-muted space-y-1">
              <div>Repository: <code className="text-soc-cyan">https://github.com/naimxbzbd/ZxCDDoS/tree/main</code></div>
              <div>C2 Signature: <code className="text-soc-amber">!* &lt;method&gt; &lt;ip&gt; &lt;port&gt; &lt;time&gt;</code></div>
              <div>Execution Mode: <strong className="text-soc-emerald">Zero-Execution Static AST Parsed</strong></div>
              <div>Primary Vectors: Node.js Cluster L7 + Raw Socket SYN Flooder</div>
            </div>
          </div>

          <div className="p-3.5 rounded bg-soc-bg border border-soc-border space-y-2">
            <h5 className="font-bold text-soc-text text-[11px] uppercase">Impact Assessment & Mitigation Efficacy</h5>
            <div className="text-[11px] text-soc-muted space-y-1">
              <div>Target Uptime: <strong className="text-soc-emerald">99.41% Maintained</strong></div>
              <div>Drop Ratio: <strong className="text-soc-emerald">78% Malicious Packets Neutralized</strong></div>
              <div>Dispatch Queue Latency: Reduced from 385ms to 112ms</div>
              <div>Active Defenses: Token Bucket + WAF + Kernel SYN Cookies</div>
            </div>
          </div>
        </div>

        {/* Executed Defensive Remediations */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase font-bold text-soc-emerald border-b border-soc-border/40 pb-1">
            2. Executed Defensive Remediations
          </h4>
          <ul className="list-disc list-inside space-y-1 text-soc-text text-xs">
            <li>Engaged WAF heuristic expression dropping spoofed HTTP/2 headers matching ZxCDDoS patterns.</li>
            <li>Enforced dynamic Token Bucket rate limiter (1,000 capacity / 250 refill rate) on <code>/api/mock/emergency-dispatch</code>.</li>
            <li>Hardened Linux host kernel network stack (<code>net.ipv4.tcp_syncookies = 1</code>, <code>somaxconn = 65535</code>).</li>
            <li>Null-routed malicious autonomous system blocks (AS49505, AS200019).</li>
          </ul>
        </div>
      </div>

      {/* Forensic Audit Log Trail Table */}
      <div className="cyber-panel p-5 space-y-4 no-print">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-soc-border pb-3">
          <div>
            <h3 className="font-mono text-sm font-semibold text-soc-text flex items-center space-x-2">
              <History className="w-4 h-4 text-soc-cyan" />
              <span>IMMUTABLE OPERATOR AUDIT TRAIL</span>
            </h3>
            <p className="text-xs text-soc-muted font-mono mt-0.5">
              Cryptographically verified event logs tracking all incident mitigations and system changes
            </p>
          </div>

          {/* Action Filter */}
          <div className="flex items-center space-x-2">
            <Search className="w-3.5 h-3.5 text-soc-muted" />
            <input
              type="text"
              placeholder="Search audit trail..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-soc-bg border border-soc-border focus:border-soc-cyan rounded px-2.5 py-1 text-xs font-mono text-soc-text outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-soc-bg text-soc-muted uppercase text-[10px] border-b border-soc-border">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Role</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">IP Address</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-soc-border/40">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-soc-cardHover">
                  <td className="py-2.5 px-3 text-soc-muted whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 text-soc-text font-bold">{log.userName}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-soc-void border border-soc-border text-soc-cyan">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-soc-amber font-semibold">{log.action}</td>
                  <td className="py-2.5 px-3 text-soc-text truncate max-w-xs">{log.resource}</td>
                  <td className="py-2.5 px-3 text-soc-muted">{log.ipAddress}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        log.status === "SUCCESS"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : "bg-red-500/10 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

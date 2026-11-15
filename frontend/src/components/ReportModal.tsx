import React from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  Server,
  Zap
} from 'lucide-react';
import { TestReport } from '../types';

interface ReportModalProps {
  report: TestReport | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const verdictColor = 
    report.sla_verdict === 'EXCELLENT' ? 'text-emerald-400 border-emerald-500 bg-emerald-950/40' :
    report.sla_verdict === 'HEALTHY' ? 'text-cyan-400 border-cyan-500 bg-cyan-950/40' :
    report.sla_verdict === 'DEGRADED' ? 'text-amber-400 border-amber-500 bg-amber-950/40' :
    'text-rose-400 border-rose-500 bg-rose-950/40';

  const downloadJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `resilience_report_${report.test_id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const openHtmlReport = () => {
    window.open(`/api/reports/${report.test_id}/html`, '_blank');
  };

  const cluster: any = report.cluster_analysis || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0f172a] border border-cyber-border rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider font-mono">
              Enterprise Resilience Assessment Report
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs font-mono text-slate-400">
            <div>
              Target: <span className="text-cyan-300 font-bold">{report.target_host}:{report.target_port}</span> | 
              Protocol: <span className="text-sky-300">{report.protocol}</span> | 
              Preset: <span className="text-purple-300">{report.intensity}</span>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-extrabold ${verdictColor}`}>
              SLA VERDICT: {report.sla_verdict}
            </div>
          </div>
        </div>

        {/* Abort Reason if applicable */}
        {report.abort_reason && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Termination Reason: {report.abort_reason}</span>
          </div>
        )}

        {/* RPS Performance Summary (Target vs Generated vs Processed) */}
        <div className="mb-5 p-4 rounded-xl bg-[#090e1b] border border-cyan-800/60 font-mono text-xs">
          <div className="text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span>Enterprise Request-Per-Second (RPS) Outcome</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Requested Target</div>
              <div className="text-base font-extrabold text-purple-400 mt-0.5">
                {(report.target_rps || 80000).toLocaleString()} RPS
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Peak Generated</div>
              <div className="text-base font-extrabold text-cyan-400 mt-0.5">
                {report.peak_generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Peak Received</div>
              <div className="text-base font-extrabold text-sky-400 mt-0.5">
                {report.peak_received_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-slate-400 text-[10px] uppercase">Peak Successful</div>
              <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                {report.peak_successful_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS
              </div>
            </div>
          </div>

          {/* Cluster Scaling Analysis */}
          {cluster.nodes_needed_for_target > 1 && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-3.5 h-3.5 text-purple-400" />
                <span>Distributed Generator Sizing: <b>{cluster.cluster_nodes_active || 1}</b> node active ({cluster.achieved_generated_rps?.toLocaleString()} RPS)</span>
              </div>
              <span className="text-purple-300 font-bold">
                {cluster.nodes_needed_for_target} Machines Required for 100% Target
              </span>
            </div>
          )}
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 font-mono">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Total Operations</div>
            <div className="text-lg font-bold text-slate-100 mt-1">
              {(report.total_requests || report.total_packets_sent).toLocaleString()}
            </div>
            <div className="text-[10px] text-emerald-400">Success: {report.successful_operations.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Packet Loss Rate</div>
            <div className={`text-lg font-bold mt-1 ${report.packet_loss_pct > 2 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {report.packet_loss_pct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-slate-400">Recv: {report.total_packets_received.toLocaleString()}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">Average Latency</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">
              {report.avg_latency_ms.toFixed(1)} ms
            </div>
            <div className="text-[10px] text-slate-400">Jitter: {report.avg_jitter_ms.toFixed(1)}ms</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase">P95 / P99 Tail</div>
            <div className="text-lg font-bold text-purple-400 mt-1">
              {report.p95_latency_ms.toFixed(1)} ms
            </div>
            <div className="text-[10px] text-slate-400">P99: {report.p99_latency_ms.toFixed(1)}ms</div>
          </div>
        </div>

        {/* Throughput & Duration row */}
        <div className="grid grid-cols-3 gap-3 mb-5 font-mono text-xs">
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Peak Bandwidth: </span>
            <span className="text-indigo-300 font-bold">{(report.peak_throughput_kbps / 1024).toFixed(1)} MB/s</span>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Total Duration: </span>
            <span className="text-slate-200 font-bold">{report.duration_sec}s</span>
          </div>
          <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
            <span className="text-slate-400">Status: </span>
            <span className="text-cyan-300 font-bold">{report.status}</span>
          </div>
        </div>

        {/* Recommendations & Findings */}
        <div className="mb-6">
          <h3 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider mb-2">
            Resilience Engineering Analysis & Recommendations
          </h3>
          <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed bg-slate-900/60 border border-slate-800/80 p-3.5 rounded-xl">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-cyan-400 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <div className="text-[11px] font-mono text-slate-500">
            Test ID: {report.test_id}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={openHtmlReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold shadow-md transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Printable Report</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

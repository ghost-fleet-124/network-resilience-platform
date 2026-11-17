import React from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  FileText, 
  AlertTriangle, 
  Server,
  Zap,
  Globe,
  CheckCircle2
} from 'lucide-react';
import { TestReport } from '../types';

interface ReportModalProps {
  report: TestReport | null;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
  if (!report) return null;

  const verdictBadge = 
    report.sla_verdict === 'EXCELLENT' ? 'text-emerald-400 border-emerald-800 bg-emerald-950/60' :
    report.sla_verdict === 'HEALTHY' ? 'text-blue-400 border-blue-800 bg-blue-950/60' :
    report.sla_verdict === 'DEGRADED' ? 'text-amber-400 border-amber-800 bg-amber-950/60' :
    'text-rose-400 border-rose-800 bg-rose-950/60';

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
  const webAnalysis = report.website_analysis;

  const scheduledCount = report.requests_scheduled ?? Math.round(report.target_rps * report.duration_sec);
  const dispatchedCount = report.requests_dispatched ?? report.total_requests;
  const completedCount = report.requests_completed ?? (report.successful_operations + report.failed_operations);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-lg max-w-3xl w-full p-6 shadow-2xl relative my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-400" />
            <h2 className="text-base font-semibold text-white">
              Resilience Assessment Report
            </h2>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-xs font-mono text-slate-400">
            <div>
              Target: <span className="text-white font-medium">{report.target_host}:{report.target_port}</span> | 
              Protocol: <span className="text-blue-300">{report.protocol}</span> | 
              Preset: <span className="text-slate-300">{report.intensity}</span>
            </div>
            <div className={`px-2.5 py-0.5 rounded border text-xs font-semibold ${verdictBadge}`}>
              SLA VERDICT: {report.sla_verdict}
            </div>
          </div>
        </div>

        {/* Abort Reason if applicable */}
        {report.abort_reason && (
          <div className="mb-4 p-3 rounded-md bg-rose-950/40 border border-rose-800 text-xs font-mono text-rose-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Termination Reason: {report.abort_reason}</span>
          </div>
        )}

        {/* Throughput & RPS Summary */}
        <div className="mb-4 p-4 rounded-md bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
            <span className="font-semibold text-white">Velocity & Throughput Summary</span>
            <span className="text-slate-400 font-mono">Duration: {report.duration_sec}s</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-sans">Target Rate</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {(report.target_rps || 80000).toLocaleString()} RPS
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-blue-400 text-[10px] uppercase font-sans">Peak Generated</span>
              <div className="text-sm font-bold text-blue-300 mt-0.5">
                {report.peak_generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-emerald-400 text-[10px] uppercase font-sans">Peak Received</span>
              <div className="text-sm font-bold text-emerald-300 mt-0.5">
                {report.peak_received_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400 text-[10px] uppercase font-sans">Peak Bandwidth</span>
              <div className="text-sm font-bold text-slate-200 mt-0.5">
                {(report.peak_throughput_kbps / 1024).toFixed(1)} MB/s
              </div>
            </div>
          </div>
        </div>

        {/* Client vs Server Request Accounting */}
        <div className="mb-4 p-4 rounded-md bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
            <span className="font-semibold text-white">Request Lifecycle Accounting</span>
            <span className="text-[11px] text-slate-400 font-mono">Client vs Target Server</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-sans">Scheduled</span>
              <span className="font-bold text-slate-200">{scheduledCount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-blue-400 block font-sans">Dispatched</span>
              <span className="font-bold text-blue-300">{dispatchedCount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-300 block font-sans">Completed</span>
              <span className="font-bold text-slate-100">{completedCount.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-emerald-400 block font-sans">Successful</span>
              <span className="font-bold text-emerald-400">{report.successful_operations.toLocaleString()}</span>
            </div>
            <div className="p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-rose-400 block font-sans">Failed / Drops</span>
              <span className="font-bold text-rose-400">{report.failed_operations.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Website Scorecard if present */}
        {webAnalysis && (
          <div className="mb-4 p-4 rounded-md bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                Website & API Capacity Analysis
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                webAnalysis.objective_met ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
              }`}>
                {webAnalysis.objective_met ? 'OBJECTIVES MET' : 'SLA DEGRADED'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Success Rate</span>
                <span className="font-bold text-emerald-400">{webAnalysis.successful_request_pct ?? 100}%</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Max Sustainable RPS</span>
                <span className="font-bold text-slate-200">{(webAnalysis.max_sustainable_rps || 0).toLocaleString()} RPS</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">P95 Latency</span>
                <span className="font-bold text-slate-200">{report.p95_latency_ms.toFixed(1)} ms</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-sans">Timeouts</span>
                <span className="font-bold text-amber-400">{webAnalysis.timeouts_count ?? 0}</span>
              </div>
            </div>

            {webAnalysis.summary && (
              <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded border border-slate-800 leading-relaxed mt-2">
                {webAnalysis.summary}
              </p>
            )}
          </div>
        )}

        {/* Engineering Recommendations */}
        <div className="mb-5 space-y-2">
          <h3 className="text-xs font-semibold text-slate-300">
            Resilience Engineering Analysis & Next Steps
          </h3>
          <ul className="space-y-1 text-xs text-slate-400 bg-slate-950 border border-slate-800 p-3 rounded-md">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">&bull;</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs font-mono">
          <span className="text-slate-500">ID: {report.test_id}</span>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-sans font-medium transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
            <button
              onClick={openHtmlReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-sans font-medium transition-colors cursor-pointer"
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

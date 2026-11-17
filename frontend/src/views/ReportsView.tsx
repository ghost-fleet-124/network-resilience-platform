import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Activity, 
  Server, 
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import { TestReport } from '../types';

interface ReportsViewProps {
  reports: TestReport[];
  selectedReport: TestReport | null;
  onSelectReport: (report: TestReport) => void;
  onNavigateToHistory: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  reports,
  selectedReport,
  onSelectReport,
  onNavigateToHistory
}) => {
  // If no report selected, default to the latest one
  const report = selectedReport || (reports.length > 0 ? reports[0] : null);

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resilience-report-${report.test_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!report) {
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-900">No Test Reports Available</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Execute a resilience evaluation or load test from the "New Test" view to generate an SLA report.
        </p>
      </div>
    );
  }

  const verdictColor = 
    report.sla_verdict === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
    report.sla_verdict === 'HEALTHY' ? 'bg-blue-50 text-blue-800 border-blue-300' :
    report.sla_verdict === 'DEGRADED' ? 'bg-amber-50 text-amber-800 border-amber-300' :
    'bg-rose-50 text-rose-800 border-rose-300';

  const scheduled = report.requests_scheduled ?? (report.duration_sec * report.target_rps);
  const dispatched = report.requests_dispatched ?? (report.total_requests || report.total_packets_sent);
  const completed = report.requests_completed ?? (report.successful_operations + report.failed_operations);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToHistory}
            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-600 cursor-pointer"
            title="Back to History"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-xs font-semibold text-slate-900 flex items-center gap-2">
              <span>Resilience Assessment Report</span>
              <span className="font-mono text-slate-400">#{report.test_id.substring(0, 8)}</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluated on {new Date(report.started_at).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Report Selector & Export buttons */}
        <div className="flex items-center gap-2">
          {reports.length > 1 && (
            <select
              value={report.test_id}
              onChange={(e) => {
                const found = reports.find(r => r.test_id === e.target.value);
                if (found) onSelectReport(found);
              }}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-700 focus:outline-none"
            >
              {reports.map(r => (
                <option key={r.test_id} value={r.test_id}>
                  {r.target_host}:{r.target_port} ({r.protocol}) - {new Date(r.started_at).toLocaleTimeString()}
                </option>
              ))}
            </select>
          )}

          <button
            onClick={downloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Main SLA Verdict Banner */}
      <div className={`border rounded-lg p-5 shadow-sm ${verdictColor}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider opacity-75">SLA Verdict</span>
            <div className="text-xl font-bold mt-0.5">{report.sla_verdict}</div>
            <p className="text-xs mt-1 max-w-2xl opacity-90 leading-relaxed">
              {report.website_analysis?.summary || (
                report.sla_verdict === 'EXCELLENT' 
                  ? 'Target demonstrated pristine resilience with zero degradation, low latency variance, and perfect request fulfillment.'
                  : report.sla_verdict === 'HEALTHY'
                  ? 'Target handled the specified load within normal operational tolerances.'
                  : report.sla_verdict === 'DEGRADED'
                  ? 'Target experienced latency elevation or transient dropped connections under sustained pressure.'
                  : 'Target reached saturation or broke connection limits during execution.'
              )}
            </p>
          </div>
          <div className="text-right font-mono shrink-0">
            <span className="text-[10px] uppercase opacity-75">Peak Achieved Throughput</span>
            <div className="text-2xl font-bold">
              {report.peak_generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal ml-1">RPS</span>
            </div>
            <div className="text-[11px] opacity-80">Configured: {report.target_rps.toLocaleString()} RPS</div>
          </div>
        </div>
      </div>

      {/* Target & Test Scope Summary */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Test Execution Summary</h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Target Host</span>
            <div className="text-sm font-bold text-slate-900 truncate">{report.target_host}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Port & Protocol</span>
            <div className="text-sm font-bold text-slate-900">{report.target_port} &bull; {report.protocol}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Workload Preset</span>
            <div className="text-sm font-bold text-blue-600">{report.intensity}</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Test Duration</span>
            <div className="text-sm font-bold text-slate-900">{report.duration_sec} seconds</div>
          </div>
        </div>
      </div>

      {/* PRIORITY 4: Real Request Accounting Lifecycle */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Request Lifecycle Accounting</h4>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Strict differentiation between client scheduling, dispatch, and server-side confirmed fulfillment.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded">
            <span className="text-[10px] font-sans text-slate-500 uppercase">1. Requests Scheduled</span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {scheduled.toLocaleString()}
            </div>
            <p className="text-[11px] font-sans text-slate-500 mt-1">
              Theoretical workload curve calculated for duration and preset.
            </p>
          </div>

          <div className="p-4 bg-blue-50/50 border border-blue-200 rounded">
            <span className="text-[10px] font-sans text-blue-700 uppercase">2. Requests Dispatched</span>
            <div className="text-xl font-bold text-blue-700 mt-1">
              {dispatched.toLocaleString()}
            </div>
            <p className="text-[11px] font-sans text-slate-500 mt-1">
              Actually written to network socket buffers by generator engine.
            </p>
          </div>

          <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded">
            <span className="text-[10px] font-sans text-emerald-800 uppercase">3. Confirmed Completed</span>
            <div className="text-xl font-bold text-emerald-700 mt-1">
              {completed.toLocaleString()}
            </div>
            <p className="text-[11px] font-sans text-slate-500 mt-1">
              Received full HTTP response headers or transport ACKs.
            </p>
          </div>
        </div>

        {/* Operational Status Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between">
            <span className="text-slate-500 font-sans">Successful Ops:</span>
            <span className="font-bold text-emerald-600">{report.successful_operations.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between">
            <span className="text-slate-500 font-sans">Failed / Errors:</span>
            <span className="font-bold text-rose-600">{report.failed_operations.toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between">
            <span className="text-slate-500 font-sans">Timeouts:</span>
            <span className="font-bold text-amber-600">{(report.timeouts_count || 0).toLocaleString()}</span>
          </div>
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between">
            <span className="text-slate-500 font-sans">Connection Errors:</span>
            <span className="font-bold text-rose-600">{(report.connection_errors || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Latency & Distribution Analysis */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">Latency Distribution (Round-Trip Time)</h4>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Average</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{report.avg_latency_ms.toFixed(1)} ms</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] font-sans text-slate-500 uppercase">P50 (Median)</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{report.p50_latency_ms.toFixed(1)} ms</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] font-sans text-slate-500 uppercase">P95</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{report.p95_latency_ms.toFixed(1)} ms</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] font-sans text-slate-500 uppercase">P99</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{report.p99_latency_ms.toFixed(1)} ms</div>
          </div>
          <div className="p-3 bg-slate-50 border border-slate-200 rounded text-center">
            <span className="text-[10px] font-sans text-slate-500 uppercase">Jitter</span>
            <div className="text-base font-bold text-slate-900 mt-0.5">{report.avg_jitter_ms.toFixed(1)} ms</div>
          </div>
        </div>
      </div>

      {/* HTTP Status Codes Distribution */}
      {report.status_codes && Object.keys(report.status_codes).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-4">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">HTTP Response Status Codes</h4>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {Object.entries(report.status_codes).map(([code, count]) => {
              const is2xx = code.startsWith('2');
              const is3xx = code.startsWith('3');
              const is4xx = code.startsWith('4');
              const is5xx = code.startsWith('5');

              const badgeColor = 
                is2xx ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                is3xx ? 'bg-blue-50 text-blue-700 border-blue-200' :
                is4xx ? 'bg-amber-50 text-amber-700 border-amber-200' :
                'bg-rose-50 text-rose-700 border-rose-200';

              return (
                <div key={code} className={`p-3 rounded border flex items-center justify-between ${badgeColor}`}>
                  <span className="font-bold text-sm">HTTP {code}</span>
                  <span className="font-semibold">{count.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Engineering Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
            Resilience Engineering Recommendations
          </h4>
          <ul className="space-y-2 text-xs text-slate-700 list-disc list-inside">
            {report.recommendations.map((rec, i) => (
              <li key={i} className="leading-relaxed">
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
};

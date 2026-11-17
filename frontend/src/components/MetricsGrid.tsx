import React from 'react';
import { 
  Activity, 
  Clock, 
  TrendingUp, 
  Server, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Send,
  Download
} from 'lucide-react';
import { MetricSnapshot } from '../types';

interface MetricsGridProps {
  snapshot: MetricSnapshot | null;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ snapshot }) => {
  const targetRps = snapshot ? snapshot.target_rps : 0;
  const generatedRps = snapshot ? snapshot.generated_rps : 0;
  const receivedRps = snapshot ? snapshot.received_rps : 0;
  const successfulRps = snapshot ? snapshot.successful_rps : 0;
  const failedRps = snapshot ? snapshot.failed_rps : 0;

  // Explicit lifecycle accounting
  const scheduledCount = snapshot?.requests_scheduled ?? (snapshot ? Math.round(targetRps * snapshot.elapsed_sec) : 0);
  const dispatchedCount = snapshot?.requests_dispatched ?? (snapshot?.total_requests ?? 0);
  const completedCount = snapshot?.requests_completed ?? ((snapshot?.success_count || 0) + (snapshot?.error_count || 0));
  const successCount = snapshot?.success_count ?? 0;
  const errorCount = snapshot?.error_count ?? 0;
  const connectionErrors = snapshot?.connection_errors ?? 0;

  // Latencies
  const avgLat = snapshot?.avg_latency_ms ?? 0;
  const p50Lat = snapshot?.p50_latency_ms ?? 0;
  const p95Lat = snapshot?.p95_latency_ms ?? 0;
  const p99Lat = snapshot?.p99_latency_ms ?? 0;
  const jitter = snapshot?.jitter_ms ?? 0;
  const throughput = snapshot?.throughput_kbps ?? 0;
  const activeConns = snapshot?.active_conns ?? 0;

  // Success rate %
  const totalOps = successCount + errorCount;
  const successRatePct = totalOps > 0 ? ((successCount / totalOps) * 100).toFixed(1) : '100.0';

  // Status code breakdown
  const statusCodes = snapshot?.status_codes || {};
  const status2xx = Object.entries(statusCodes).filter(([c]) => c.startsWith('2')).reduce((sum, [, count]) => sum + count, 0);
  const status3xx = Object.entries(statusCodes).filter(([c]) => c.startsWith('3')).reduce((sum, [, count]) => sum + count, 0);
  const status4xx = Object.entries(statusCodes).filter(([c]) => c.startsWith('4')).reduce((sum, [, count]) => sum + count, 0);
  const status5xx = Object.entries(statusCodes).filter(([c]) => c.startsWith('5')).reduce((sum, [, count]) => sum + count, 0);
  const timeouts = snapshot?.timeouts_count ?? (statusCodes['504'] || 0);

  const hasStatusCodes = Object.keys(statusCodes).length > 0;

  return (
    <div className="space-y-4">
      
      {/* 4 Main Observable KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        
        {/* KPI 1: Rate Velocity */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Request Throughput</span>
            <span className="font-mono text-[11px] text-blue-400">Target: {targetRps.toLocaleString()} RPS</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {generatedRps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-xs font-normal text-slate-400 ml-1">RPS</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Server Confirmed:</span>
            <span className="font-mono text-slate-200">{receivedRps.toLocaleString(undefined, { maximumFractionDigits: 0 })} RPS</span>
          </div>
        </div>

        {/* KPI 2: Success Rate */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Success Rate</span>
            <span className={`font-mono text-[11px] ${parseFloat(successRatePct) >= 99 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {successRatePct}%
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {successCount.toLocaleString()}
            <span className="text-xs font-normal text-slate-400 ml-1">ok</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Failures / Drops:</span>
            <span className={`font-mono ${errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>{errorCount.toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 3: Response Latency (P95) */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Latency (P95)</span>
            <span className="font-mono text-[11px] text-slate-400">Avg: {avgLat.toFixed(1)}ms</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {p95Lat.toFixed(1)}
            <span className="text-xs font-normal text-slate-400 ml-1">ms</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>P50: {p50Lat.toFixed(1)}ms</span>
            <span>P99: {p99Lat.toFixed(1)}ms</span>
          </div>
        </div>

        {/* KPI 4: Bandwidth & Connections */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-medium">Network Data Rate</span>
            <span className="font-mono text-[11px] text-slate-400">{activeConns} conns</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white tracking-tight">
            {(throughput / 1024).toFixed(2)}
            <span className="text-xs font-normal text-slate-400 ml-1">MB/s</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
            <span>Throughput:</span>
            <span className="font-mono text-slate-200">{(throughput).toFixed(0)} kbps</span>
          </div>
        </div>

      </div>

      {/* Request Lifecycle Accounting: Scheduled vs Dispatched vs Completed */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div>
            <h3 className="text-xs font-semibold text-white">Client vs Server Request Accounting</h3>
            <p className="text-[11px] text-slate-400">
              Clear distinction between client-dispatched requests and target-confirmed responses.
            </p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            RFC Pacing Engine
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-sans">Scheduled</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">{scheduledCount.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-sans">planned workload</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-blue-400 uppercase tracking-wider block font-sans">Dispatched</span>
            <div className="text-sm font-bold text-blue-300 mt-0.5">{dispatchedCount.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-sans">emitted by client</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">Completed</span>
            <div className="text-sm font-bold text-slate-100 mt-0.5">{completedCount.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-sans">server responded</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block font-sans">Successful</span>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">{successCount.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 font-sans">2xx / verified acks</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-rose-400 uppercase tracking-wider block font-sans">Failed / Errors</span>
            <div className={`text-sm font-bold mt-0.5 ${errorCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
              {errorCount.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-sans">4xx / 5xx / drops</span>
          </div>

          <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase tracking-wider block font-sans">Timeouts</span>
            <div className={`text-sm font-bold mt-0.5 ${timeouts > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {timeouts.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-500 font-sans">client timeouts (504)</span>
          </div>
        </div>
      </div>

      {/* HTTP Status Code Distribution (when HTTP requests exist) */}
      {hasStatusCodes && (
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-xs font-semibold text-white">HTTP Status Code Distribution</h3>
            <span className="text-xs font-mono text-slate-400">Total Responses: {completedCount.toLocaleString()}</span>
          </div>

          {/* Distribution Bar */}
          <div className="w-full bg-slate-950 rounded h-3 overflow-hidden flex border border-slate-800">
            {completedCount > 0 && (
              <>
                <div style={{ width: `${(status2xx / completedCount) * 100}%` }} className="bg-emerald-500" title={`2xx: ${status2xx}`} />
                <div style={{ width: `${(status3xx / completedCount) * 100}%` }} className="bg-blue-500" title={`3xx: ${status3xx}`} />
                <div style={{ width: `${(status4xx / completedCount) * 100}%` }} className="bg-amber-500" title={`4xx: ${status4xx}`} />
                <div style={{ width: `${(status5xx / completedCount) * 100}%` }} className="bg-rose-500" title={`5xx: ${status5xx}`} />
              </>
            )}
          </div>

          {/* Code Badges */}
          <div className="flex items-center gap-3 flex-wrap text-xs font-mono">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              2xx Success: <strong>{status2xx.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              3xx Redirect: <strong>{status3xx.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              4xx Client Error: <strong>{status4xx.toLocaleString()}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              5xx Server Error: <strong>{status5xx.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}

    </div>
  );
};

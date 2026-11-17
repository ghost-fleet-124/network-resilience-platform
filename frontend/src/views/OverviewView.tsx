import React from 'react';
import { 
  PlayCircle, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  Server, 
  ArrowRight,
  ExternalLink,
  Activity
} from 'lucide-react';
import { MetricSnapshot, TestReport, ApprovedScope, TestStatus } from '../types';

interface OverviewViewProps {
  reports: TestReport[];
  scopes: ApprovedScope[];
  currentSnapshot: MetricSnapshot | null;
  onNavigateToNewTest: (target?: ApprovedScope) => void;
  onSelectReport: (report: TestReport) => void;
  onNavigateToTargets: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  reports,
  scopes,
  currentSnapshot,
  onNavigateToNewTest,
  onSelectReport,
  onNavigateToTargets,
}) => {
  const isTesting = currentSnapshot?.status === 'RUNNING' || currentSnapshot?.status === 'PAUSED';
  
  // Real aggregates (no fabricated data)
  const totalCompletedRequests = reports.reduce((sum, r) => sum + (r.successful_operations + r.failed_operations), 0);
  const peakAchievedRps = reports.reduce((max, r) => Math.max(max, r.peak_generated_rps), 0);
  const activeTargetsCount = scopes.filter(s => s.status === 'ACTIVE').length;
  const recentTests = reports.slice(0, 5);

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Welcome */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Network Resilience Platform</h2>
          <p className="text-xs text-slate-500 mt-1">
            Enterprise workload simulation, HTTP capacity verification, and target resilience auditing.
          </p>
        </div>
        <button
          onClick={() => onNavigateToNewTest()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Launch New Test</span>
        </button>
      </div>

      {/* Active Running Test Card if present */}
      {isTesting && currentSnapshot && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold text-emerald-900">Live Test In Progress</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                {currentSnapshot.status}
              </span>
            </div>
            <button
              onClick={() => onNavigateToNewTest()}
              className="text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer"
            >
              <span>View Execution Console</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mt-3 pt-3 border-t border-emerald-200/60 font-mono">
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-sans">Elapsed</span>
              <div className="text-base font-bold text-slate-900">{currentSnapshot.elapsed_sec.toFixed(1)}s</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-sans">Generated RPS</span>
              <div className="text-base font-bold text-blue-600">{currentSnapshot.generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-sans">Confirmed RPS</span>
              <div className="text-base font-bold text-emerald-600">{currentSnapshot.received_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase font-sans">P95 Latency</span>
              <div className="text-base font-bold text-slate-900">{currentSnapshot.p95_latency_ms.toFixed(1)} ms</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards (Real Data Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Active Tests</span>
            <Activity className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {isTesting ? 1 : 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Currently running test runs</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Authorized Targets</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {activeTargetsCount}
          </div>
          <button
            onClick={onNavigateToTargets}
            className="text-[11px] text-blue-600 hover:underline mt-1 cursor-pointer block"
          >
            Manage target scopes &rarr;
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Completed Requests</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {totalCompletedRequests.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total requests confirmed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Peak Measured Throughput</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {peakAchievedRps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            <span className="text-xs font-normal text-slate-500 ml-1">RPS</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Peak generator rate achieved</p>
        </div>

      </div>

      {/* Recent Tests Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-semibold text-slate-900">Recent Test Runs</h3>
            <p className="text-[11px] text-slate-500">Historical performance audits and resilience assessments</p>
          </div>
          <span className="text-xs font-mono text-slate-400">Total: {reports.length} runs</span>
        </div>

        {recentTests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No test runs recorded yet. Click "Launch New Test" above to start your first benchmark.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Target Host</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Preset</th>
                  <th className="py-2.5 px-3">Duration</th>
                  <th className="py-2.5 px-3">Peak RPS</th>
                  <th className="py-2.5 px-3">SLA Verdict</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {recentTests.map((r) => {
                  const verdictColor = 
                    r.sla_verdict === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    r.sla_verdict === 'HEALTHY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    r.sla_verdict === 'DEGRADED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200';

                  return (
                    <tr key={r.test_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-slate-900">
                        {r.target_host}:{r.target_port}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {r.protocol}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">
                        {r.intensity}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {r.duration_sec}s
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {r.peak_generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${verdictColor}`}>
                          {r.sla_verdict}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans text-[11px] text-slate-500">
                        {new Date(r.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(r.started_at).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-4 text-right font-sans">
                        <button
                          onClick={() => onSelectReport(r)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

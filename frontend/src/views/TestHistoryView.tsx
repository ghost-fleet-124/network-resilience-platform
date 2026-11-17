import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  FileText, 
  PlayCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { TestReport, Protocol } from '../types';

interface TestHistoryViewProps {
  reports: TestReport[];
  onSelectReport: (report: TestReport) => void;
  onRerunTest: (report: TestReport) => void;
}

export const TestHistoryView: React.FC<TestHistoryViewProps> = ({
  reports,
  onSelectReport,
  onRerunTest
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('ALL');
  const [verdictFilter, setVerdictFilter] = useState<string>('ALL');

  // Filter reports
  const filteredReports = reports.filter(r => {
    const matchesSearch = 
      r.target_host.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.test_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProtocol = protocolFilter === 'ALL' || r.protocol === protocolFilter;
    const matchesVerdict = verdictFilter === 'ALL' || r.sla_verdict === verdictFilter;
    return matchesSearch && matchesProtocol && matchesVerdict;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-semibold text-slate-900">Historical Test Runs</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all resilience evaluations, stress runs, and capacity assessments.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Total Logged Runs: <span className="font-bold text-slate-900">{reports.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by host, test ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {/* Protocol Filter */}
          <select
            value={protocolFilter}
            onChange={(e) => setProtocolFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Protocols</option>
            <option value="HTTP_WEBSITE">HTTP Website</option>
            <option value="TCP">TCP</option>
            <option value="UDP">UDP</option>
            <option value="WEBSOCKET">WebSocket</option>
            <option value="GAME_UDP">Game UDP</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Verdicts</option>
            <option value="EXCELLENT">EXCELLENT</option>
            <option value="HEALTHY">HEALTHY</option>
            <option value="DEGRADED">DEGRADED</option>
            <option value="SATURATED / FAILED">SATURATED / FAILED</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Test ID / Target</th>
                <th className="py-3 px-3">Protocol</th>
                <th className="py-3 px-3">Preset</th>
                <th className="py-3 px-3">Duration</th>
                <th className="py-3 px-3">Peak RPS</th>
                <th className="py-3 px-3">Completed Ops</th>
                <th className="py-3 px-3">SLA Verdict</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-sans text-xs">
                    No historical test runs found.
                  </td>
                </tr>
              ) : (
                filteredReports.map(report => {
                  const verdictColor = 
                    report.sla_verdict === 'EXCELLENT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    report.sla_verdict === 'HEALTHY' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    report.sla_verdict === 'DEGRADED' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200';

                  const completedCount = report.requests_completed || (report.successful_operations + report.failed_operations);

                  return (
                    <tr key={report.test_id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{report.target_host}:{report.target_port}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{report.test_id.substring(0, 8)}...</div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700">
                        {report.protocol}
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-700">
                        {report.intensity}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {report.duration_sec}s
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {report.peak_generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {completedCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${verdictColor}`}>
                          {report.sla_verdict}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans text-[11px] text-slate-500">
                        {new Date(report.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &bull; {new Date(report.started_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSelectReport(report)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Report</span>
                          </button>
                          <button
                            onClick={() => onRerunTest(report)}
                            title="Re-run this test configuration"
                            className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

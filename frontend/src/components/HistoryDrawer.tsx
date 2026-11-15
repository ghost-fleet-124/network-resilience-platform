import React, { useEffect, useState } from 'react';
import { X, History, ExternalLink, Calendar, CheckCircle, AlertTriangle } from 'lucide-react';
import { TestReport } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectReport: (report: TestReport) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectReport
}) => {
  const [reports, setReports] = useState<TestReport[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/reports')
        .then((res) => res.json())
        .then((data) => {
          setReports(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0f172a] border-l border-cyber-border h-full flex flex-col p-6 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Test Audit History ({reports.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            <div className="text-center py-10 text-xs font-mono text-slate-500">
              Loading test records...
            </div>
          ) : reports.length === 0 ? (
            <div className="text-center py-10 text-xs font-mono text-slate-500">
              No historical test runs recorded yet.
            </div>
          ) : (
            reports.map((r) => {
              const verdictClass = 
                r.sla_verdict === 'EXCELLENT' ? 'text-emerald-400' :
                r.sla_verdict === 'HEALTHY' ? 'text-cyan-400' :
                r.sla_verdict === 'DEGRADED' ? 'text-amber-400' : 'text-rose-400';

              return (
                <div
                  key={r.test_id}
                  onClick={() => {
                    onSelectReport(r);
                    onClose();
                  }}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-xs font-mono mb-1.5">
                    <span className="font-bold text-slate-200">
                      {r.target_host}:{r.target_port}
                    </span>
                    <span className={`font-bold ${verdictClass}`}>
                      {r.sla_verdict}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mb-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                      {r.protocol}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">
                      {r.intensity}
                    </span>
                    <span>{r.duration_sec}s</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {r.finished_at}
                    </span>
                    <span className="text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      View Report &rarr;
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

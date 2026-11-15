import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, Download, Trash2, FileText, Database, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { LegalPolicy } from '../types';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ isOpen, onClose }) => {
  const [policy, setPolicy] = useState<LegalPolicy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setActionMessage(null);
    setShowDeleteConfirm(false);
    fetch('/api/legal/privacy')
      .then((res) => res.json())
      .then((data) => {
        setPolicy(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load privacy policy:', err);
        setLoading(false);
      });
  }, [isOpen]);

  const handleExportData = async () => {
    setIsExporting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/legal/privacy/export', { method: 'POST' });
      const data = await res.json();
      
      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resilience_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionMessage({
        type: 'success',
        message: `Export completed: ${data.total_reports} test reports and ${data.audit_events?.length || 0} audit events downloaded.`
      });
    } catch (e: any) {
      setActionMessage({ type: 'error', message: 'Failed to export test data: ' + e.message });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/legal/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Purge failed');
      
      setActionMessage({
        type: 'success',
        message: `Historical reports purged: ${data.purged_reports_count} test reports permanently removed.`
      });
      setShowDeleteConfirm(false);
    } catch (e: any) {
      setActionMessage({ type: 'error', message: 'Failed to purge data: ' + e.message });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e1526] border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-700/60 flex items-center justify-center text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Privacy Policy & Data Retention Schedule</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300">
                  GDPR & SOC2 Aligned
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Transparent data collection, encrypted retention, and self-service privacy rights
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-4 text-xs font-sans text-slate-300">
          
          {/* Notification Banner */}
          {actionMessage && (
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 font-mono text-xs ${
              actionMessage.type === 'success' 
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' 
                : 'bg-rose-950/60 border-rose-700 text-rose-300'
            }`}>
              {actionMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{actionMessage.message}</span>
            </div>
          )}

          {/* Self-Service Privacy Actions Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyber-border flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-bold font-mono text-slate-200">Self-Service Privacy Controls</div>
              <div className="text-[11px] text-slate-400">Download your audit records or execute a GDPR/CCPA data purge</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isExporting ? 'Exporting...' : 'Export Data (JSON)'}</span>
              </button>
              
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Purge Reports</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDeleteData}
                    disabled={isDeleting}
                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold transition-colors cursor-pointer"
                  >
                    {isDeleting ? 'Purging...' : 'Confirm Purge'}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-mono hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Structured Clauses */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono">
              Loading privacy policy clauses...
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {(policy?.clauses || []).map((clause) => (
                <div key={clause.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-xs font-mono text-purple-300">
                      {clause.section}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">{clause.id}</span>
                  </div>
                  <div className="text-slate-300 font-semibold text-xs">{clause.summary}</div>
                  <p className="text-slate-400 text-xs leading-relaxed">{clause.content}</p>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-cyber-border bg-[#0a0f1d] flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-purple-400" />
            <span>90-Day Active Telemetry Retention • 365-Day Security Audit Log</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

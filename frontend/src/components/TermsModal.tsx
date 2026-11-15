import React, { useEffect, useState } from 'react';
import { X, ShieldAlert, CheckCircle2, FileText, AlertTriangle, Scale, Lock } from 'lucide-react';
import { LegalPolicy } from '../types';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  const [policy, setPolicy] = useState<LegalPolicy | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetch('/api/legal/terms')
      .then((res) => res.json())
      .then((data) => {
        setPolicy(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load terms:', err);
        setLoading(false);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-[#0e1526] border border-cyan-800/60 rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-border bg-[#0a0f1d]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-700/60 flex items-center justify-center text-cyan-400">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Acceptable Use Policy & Legal Terms</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  v2.4.0
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Mandatory rules of engagement for lawful resilience & load testing
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
          
          {/* Strict Prohibition Callout */}
          <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-rose-300 font-bold uppercase tracking-wider text-xs">
                Zero Tolerance Policy — Unauthorized Testing Prohibited
              </div>
              <p className="text-rose-200/90 text-xs leading-relaxed">
                Unauthorized disruption, denial-of-service (DoS/DDoS) attacks, and testing against third-party systems without explicit written permission are strictly prohibited by law. Violations will result in immediate termination of access and reporting to appropriate authorities.
              </p>
            </div>
          </div>

          {/* Critical Disclaimer: Acceptance alone != Authorization */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-amber-300 font-bold uppercase tracking-wider text-xs">
                Authorization Scope Requirement
              </div>
              <p className="text-amber-200/90 text-xs leading-relaxed">
                <strong>Acknowledging these Terms & Conditions does NOT by itself grant permission to test an external target.</strong> External targets must be explicitly registered and validated under an active organization testing scope by an authorized officer.
              </p>
            </div>
          </div>

          {/* Structured Clauses */}
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-mono">
              Loading legal governance specifications...
            </div>
          ) : (
            <div className="space-y-4 pt-1">
              {(policy?.clauses || []).map((clause) => (
                <div key={clause.id} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 text-xs font-mono text-cyan-300">
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
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Audit-logged compliance framework</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono transition-colors cursor-pointer"
          >
            I Understand & Agree
          </button>
        </div>

      </div>
    </div>
  );
};

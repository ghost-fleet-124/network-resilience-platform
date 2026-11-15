import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X, Server, Zap } from 'lucide-react';
import { IntensityPreset, PresetDetails } from '../types';

interface HighIntensityConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetHost: string;
  targetPort: number;
  intensity: IntensityPreset;
  presetInfo?: PresetDetails;
  clusterCapacityRps: number;
}

export const HighIntensityConfirmationModal: React.FC<HighIntensityConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetHost,
  targetPort,
  intensity,
  presetInfo,
  clusterCapacityRps
}) => {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const targetRps = presetInfo?.target_rps || 500000;
  const nodesNeeded = Math.max(1, Math.ceil(targetRps / (clusterCapacityRps || 100000)));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-amber-500/60 rounded-2xl max-w-lg w-full p-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-950/60 border border-amber-600/80 flex items-center justify-center text-amber-400 shadow-md">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold font-mono text-amber-400 uppercase tracking-wider">
              High-Intensity Workload Authorization
            </h2>
            <p className="text-xs text-slate-300">
              Target workload meets or exceeds 500,000 Requests/Sec.
            </p>
          </div>
        </div>

        {/* Target Profile Box */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-4 font-mono text-xs">
          <div className="flex justify-between">
            <span className="text-slate-400">Target Server:</span>
            <span className="text-cyan-300 font-bold">{targetHost}:{targetPort}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Requested Workload:</span>
            <span className="text-purple-400 font-extrabold text-sm">{targetRps.toLocaleString()} Target RPS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Selected Intensity:</span>
            <span className="text-slate-200">{intensity}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-slate-800">
            <span className="text-slate-400">Current Cluster Capacity:</span>
            <span className="text-emerald-400 font-bold">{clusterCapacityRps.toLocaleString()} RPS (Local Node)</span>
          </div>
          {targetRps > clusterCapacityRps && (
            <div className="text-[11px] text-amber-400/90 font-sans pt-1">
              Note: Local generator nodes will run at 100% capacity ({clusterCapacityRps.toLocaleString()} RPS). An enterprise cluster of <b>{nodesNeeded} worker machines</b> is required to achieve full 100% saturation.
            </div>
          )}
        </div>

        {/* Acknowledgment Checkbox */}
        <div className="mb-6 p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 flex items-start gap-3">
          <input
            type="checkbox"
            id="auth-check"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            className="mt-1 w-4 h-4 accent-amber-500 rounded cursor-pointer"
          />
          <label htmlFor="auth-check" className="text-xs text-slate-200 cursor-pointer select-none leading-relaxed">
            I certify that I am the authorized owner or possess explicit, written approval to conduct high-volume network capacity and resilience stress testing against this endpoint.
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!acknowledged}
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm & Launch Test</span>
          </button>
        </div>

      </div>
    </div>
  );
};

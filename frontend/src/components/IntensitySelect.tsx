import React from 'react';
import { Gauge, Flame, Zap, Shield, Rocket, Activity, AlertOctagon, Sparkles } from 'lucide-react';
import { IntensityPreset, PresetDetails } from '../types';

interface IntensitySelectProps {
  selectedIntensity: IntensityPreset;
  onSelect: (i: IntensityPreset) => void;
  disabled: boolean;
  presetsInfo: Record<string, PresetDetails>;
}

interface PresetUIDef {
  id: IntensityPreset;
  label: string;
  targetBadge: string;
  sublabel: string;
  icon: React.ReactNode;
  colorScheme: {
    border: string;
    bg: string;
    text: string;
    glow: string;
  };
}

export const IntensitySelect: React.FC<IntensitySelectProps> = ({
  selectedIntensity,
  onSelect,
  disabled,
  presetsInfo
}) => {
  const tiers: PresetUIDef[] = [
    {
      id: 'LOW',
      label: 'Low',
      targetBadge: '80K RPS',
      sublabel: 'Basic Connectivity',
      icon: <Shield className="w-4 h-4" />,
      colorScheme: {
        border: 'border-slate-700',
        bg: 'bg-slate-900/50',
        text: 'text-slate-300',
        glow: 'border-cyan-500 bg-cyan-950/30 text-cyan-400 ring-1 ring-cyan-500'
      }
    },
    {
      id: 'MEDIUM',
      label: 'Medium',
      targetBadge: '200K RPS',
      sublabel: 'Normal Production',
      icon: <Activity className="w-4 h-4" />,
      colorScheme: {
        border: 'border-slate-700',
        bg: 'bg-slate-900/50',
        text: 'text-slate-300',
        glow: 'border-sky-500 bg-sky-950/30 text-sky-400 ring-1 ring-sky-500'
      }
    },
    {
      id: 'HIGH',
      label: 'High',
      targetBadge: '500K RPS',
      sublabel: 'Peak Surge Load',
      icon: <Zap className="w-4 h-4" />,
      colorScheme: {
        border: 'border-slate-700',
        bg: 'bg-slate-900/50',
        text: 'text-slate-300',
        glow: 'border-blue-500 bg-blue-950/30 text-blue-400 ring-1 ring-blue-500'
      }
    },
    {
      id: 'LARGE',
      label: 'Large',
      targetBadge: '750K RPS',
      sublabel: 'Heavy Launch Workload',
      icon: <Flame className="w-4 h-4" />,
      colorScheme: {
        border: 'border-slate-700',
        bg: 'bg-slate-900/50',
        text: 'text-slate-300',
        glow: 'border-amber-500 bg-amber-950/30 text-amber-400 ring-1 ring-amber-500'
      }
    },
    {
      id: 'MASSIVE',
      label: 'Massive',
      targetBadge: '1.0M RPS',
      sublabel: 'Mega-Scale Stress',
      icon: <Rocket className="w-4 h-4" />,
      colorScheme: {
        border: 'border-slate-700',
        bg: 'bg-slate-900/50',
        text: 'text-slate-300',
        glow: 'border-orange-500 bg-orange-950/30 text-orange-400 ring-1 ring-orange-500'
      }
    },
    {
      id: 'ULTRA_MASSIVE',
      label: 'Ultra Massive',
      targetBadge: '2.0M RPS',
      sublabel: 'Tournament High-Capacity',
      icon: <Flame className="w-4 h-4 text-purple-400" />,
      colorScheme: {
        border: 'border-purple-800',
        bg: 'bg-purple-950/20',
        text: 'text-purple-300',
        glow: 'border-purple-400 bg-purple-950/40 text-purple-300 ring-1 ring-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
      }
    },
    {
      id: 'SUPER_MASSIVE',
      label: 'Super Massive',
      targetBadge: '3.0M RPS',
      sublabel: 'Hyper-Scale Global',
      icon: <AlertOctagon className="w-4 h-4 text-rose-400" />,
      colorScheme: {
        border: 'border-rose-800',
        bg: 'bg-rose-950/20',
        text: 'text-rose-300',
        glow: 'border-rose-400 bg-rose-950/40 text-rose-300 ring-1 ring-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
      }
    },
    {
      id: 'SUPER_ULTRA_MASSIVE',
      label: 'Super Ultra Massive',
      targetBadge: '5.0M RPS',
      sublabel: 'Enterprise Apex Capacity',
      icon: <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />,
      colorScheme: {
        border: 'border-cyan-500/80',
        bg: 'bg-gradient-to-br from-purple-950/60 via-slate-900 to-cyan-950/60',
        text: 'text-cyan-300',
        glow: 'border-cyan-400 bg-gradient-to-r from-purple-900/50 via-slate-900 to-cyan-900/50 text-cyan-300 ring-2 ring-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
      }
    }
  ];

  const currentInfo = presetsInfo[selectedIntensity];

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              3. Explicit Numerical Request-Per-Second (RPS) Intensity Tiers
            </h2>
            <p className="text-xs text-slate-400">
              Select requested workload target. Workloads are sharded across available generator workers.
            </p>
          </div>
        </div>

        {/* Selected Tier badge */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-purple-800/60 text-xs font-mono">
          <span className="text-slate-400">Requested Workload:</span>
          <span className="text-purple-400 font-extrabold">{currentInfo?.target_rps.toLocaleString() || '80,000'} RPS</span>
        </div>
      </div>

      {/* 8 Preset Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {tiers.map((t) => {
          const isSelected = selectedIntensity === t.id;
          const info = presetsInfo[t.id];
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(t.id)}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all relative ${
                isSelected
                  ? t.colorScheme.glow
                  : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-300'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`p-1 rounded-md ${isSelected ? 'bg-white/10' : 'bg-slate-800 text-slate-400'}`}>
                    {t.icon}
                  </div>
                  <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    {t.targetBadge}
                  </span>
                </div>
                <div className="font-bold text-xs text-slate-100 leading-snug line-clamp-1">{t.label}</div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{t.sublabel}</div>
              </div>

              {info && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 font-mono text-[10px] space-y-0.5 text-slate-400">
                  <div className="flex justify-between">
                    <span>Target:</span>
                    <span className="text-cyan-400 font-bold">{info.target_rps.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cluster:</span>
                    <span className="text-slate-200">{info.recommended_cluster_nodes} node{info.recommended_cluster_nodes > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Traffic Budget & Cluster Sizing Summary Banner */}
      {currentInfo && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-900/80 border border-cyber-border flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold uppercase tracking-wider">
              [{currentInfo.label}]:
            </span>
            <span className="text-slate-300 font-sans">{currentInfo.description}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Requested Workload:</span>
              <span className="text-cyan-400 font-extrabold">{currentInfo.target_rps.toLocaleString()} RPS</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Socket Pool:</span>
              <span className="text-emerald-400 font-bold">{currentInfo.max_conns.toLocaleString()} conns</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Bandwidth Ceiling:</span>
              <span className="text-amber-400 font-bold">{(currentInfo.bandwidth_cap_mbps / 1000).toFixed(1)} Gbps</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Cluster Sizing:</span>
              <span className="text-purple-300 font-bold">{currentInfo.recommended_cluster_nodes} Generator Node(s)</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

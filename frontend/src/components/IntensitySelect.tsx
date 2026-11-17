import React from 'react';
import { Gauge, Shield, Zap, Activity, Flame, Rocket, AlertTriangle } from 'lucide-react';
import { IntensityPreset, PresetDetails } from '../types';

interface IntensitySelectProps {
  selectedIntensity: IntensityPreset;
  onSelect: (i: IntensityPreset) => void;
  disabled: boolean;
  presetsInfo: Record<string, PresetDetails>;
}

interface PresetOption {
  id: IntensityPreset;
  label: string;
  targetRps: number;
  badge: string;
  tagline: string;
  requiresCluster?: boolean;
}

export const IntensitySelect: React.FC<IntensitySelectProps> = ({
  selectedIntensity,
  onSelect,
  disabled,
  presetsInfo
}) => {
  const tiers: PresetOption[] = [
    {
      id: 'LOW',
      label: 'Low',
      targetRps: 80000,
      badge: '80,000 RPS',
      tagline: 'Single Node Baseline'
    },
    {
      id: 'MEDIUM',
      label: 'Medium',
      targetRps: 200000,
      badge: '200,000 RPS',
      tagline: 'Standard Workload'
    },
    {
      id: 'HIGH',
      label: 'High',
      targetRps: 500000,
      badge: '500,000 RPS',
      tagline: 'Peak Surge Simulation'
    },
    {
      id: 'LARGE',
      label: 'Large',
      targetRps: 750000,
      badge: '750,000 RPS',
      tagline: 'Heavy Launch Traffic'
    },
    {
      id: 'MASSIVE',
      label: 'Massive',
      targetRps: 1000000,
      badge: '1,000,000 RPS',
      tagline: 'Enterprise Capacity',
      requiresCluster: true
    },
    {
      id: 'ULTRA_MASSIVE',
      label: 'Ultra Massive',
      targetRps: 2000000,
      badge: '2,000,000 RPS',
      tagline: 'Multi-Cluster Distributed',
      requiresCluster: true
    },
    {
      id: 'SUPER_MASSIVE',
      label: 'Super Massive',
      targetRps: 3000000,
      badge: '3,000,000 RPS',
      tagline: 'High-Throughput Sharded',
      requiresCluster: true
    },
    {
      id: 'SUPER_ULTRA_MASSIVE',
      label: 'Super Ultra',
      targetRps: 5000000,
      badge: '5,000,000 RPS',
      tagline: 'Max Distributed Ceiling',
      requiresCluster: true
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">Step 4</span>
            <h2 className="text-sm font-semibold text-white">Workload Intensity & Target RPS</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the numerical request rate profile. Actual achieved rate is bounded by generator hardware and network limits.
          </p>
        </div>

        {/* Selected Tier Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-400">Target Rate:</span>
          <span className="px-2 py-0.5 rounded bg-blue-950/60 border border-blue-800 text-blue-300 font-semibold">
            {tiers.find(t => t.id === selectedIntensity)?.badge || '80,000 RPS'}
          </span>
        </div>
      </div>

      {/* Grid of 8 Presets */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiers.map((tier) => {
          const isSelected = selectedIntensity === tier.id;
          const meta = presetsInfo[tier.id];
          const nodes = meta?.recommended_cluster_nodes || (tier.requiresCluster ? 4 : 1);

          return (
            <button
              key={tier.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(tier.id)}
              className={`p-3 rounded-md border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-blue-500 text-white ring-1 ring-blue-500/50 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">{tier.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                )}
              </div>
              <div className="text-sm font-mono font-bold text-slate-100 tracking-tight">
                {tier.badge}
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 pt-1 border-t border-slate-800/80">
                <span>{tier.tagline}</span>
                <span className="font-mono">{nodes} {nodes > 1 ? 'nodes' : 'node'}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

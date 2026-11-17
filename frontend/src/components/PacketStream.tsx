import React from 'react';
import { Server, Globe, Cpu, HardDrive, ShieldCheck, Activity } from 'lucide-react';
import { MetricSnapshot, Protocol } from '../types';

interface PacketStreamProps {
  snapshot: MetricSnapshot | null;
  host: string;
  port: number;
  protocol: Protocol;
}

export const PacketStream: React.FC<PacketStreamProps> = ({
  snapshot,
  host,
  port,
  protocol
}) => {
  const isRunning = snapshot?.status === 'RUNNING';
  const cpuPct = snapshot?.cpu_usage_pct ?? 0;
  const ramPct = snapshot?.ram_usage_pct ?? 0;
  const activeWorkers = snapshot?.active_conns ?? 0;
  const capacityPct = snapshot?.generator_capacity_pct ?? 0;
  const circuitStatus = snapshot?.safety_circuit_status ?? 'NORMAL';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-semibold text-white">System Resources & Execution Topology</h3>
          <p className="text-[11px] text-slate-400">
            Real-time hardware utilization and socket pool status on generator infrastructure.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
            Circuit: <strong className={circuitStatus === 'NORMAL' ? 'text-emerald-400' : 'text-rose-400'}>{circuitStatus}</strong>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        
        {/* Node CPU */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Node CPU
            </span>
            <span className="font-mono text-white">{cpuPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${cpuPct > 80 ? 'bg-rose-500' : 'bg-blue-500'}`}
              style={{ width: `${Math.min(100, cpuPct)}%` }}
            />
          </div>
        </div>

        {/* Node RAM */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="w-3.5 h-3.5 text-purple-400" />
              Node Memory
            </span>
            <span className="font-mono text-white">{ramPct.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full transition-all ${ramPct > 85 ? 'bg-amber-500' : 'bg-purple-500'}`}
              style={{ width: `${Math.min(100, ramPct)}%` }}
            />
          </div>
        </div>

        {/* Active Sockets / Virtual Users */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-slate-400 block font-medium">Active Socket Pool</span>
          <div className="text-lg font-bold font-mono text-white">
            {activeWorkers}
            <span className="text-xs font-normal text-slate-400 ml-1">conns</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Pooled TCP/UDP streams</span>
        </div>

        {/* Target Destination */}
        <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
          <span className="text-slate-400 block font-medium">Target Host Endpoint</span>
          <div className="text-xs font-mono font-bold text-slate-200 truncate" title={`${host}:${port}`}>
            {host}:{port}
          </div>
          <span className="text-[10px] text-slate-500 block font-mono">
            {protocol} Transport
          </span>
        </div>

      </div>
    </div>
  );
};

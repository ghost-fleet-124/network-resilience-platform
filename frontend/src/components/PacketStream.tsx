import React from 'react';
import { Server, ShieldCheck, Zap, Radio, Globe, ArrowRight } from 'lucide-react';
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
  const opsRate = snapshot ? Math.max(snapshot.req_per_sec, snapshot.packets_per_sec) : 0;
  const isLoss = (snapshot?.packet_loss_pct || 0) > 2.0;

  return (
    <div className="bg-[#0b101e] border border-cyber-border rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300 uppercase tracking-wider font-bold">
          <Zap className="w-4 h-4 text-cyan-400" />
          <span>Live Network Topology & Flow Dynamics</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Pipeline:</span>
          <span className="text-cyan-400 font-bold">{isRunning ? 'ACTIVE SOCKET DISPATCH' : 'IDLE'}</span>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 py-4 rounded-xl bg-slate-950/60 border border-slate-800/80 overflow-hidden">
        
        {/* Generator Node */}
        <div className="flex items-center gap-3 z-10">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-900/60 to-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Server className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 font-mono">ANTIGRAVITY LOAD AGENT</div>
            <div className="text-[11px] text-slate-400 font-mono">
              Workers: {snapshot?.active_conns || 0} active
            </div>
            <div className="text-[10px] text-cyan-400 font-mono">
              Rate: {opsRate.toFixed(0)} ops/s
            </div>
          </div>
        </div>

        {/* Animated Packet Stream Vector */}
        <div className="flex-1 mx-8 relative flex items-center justify-center">
          {/* Track line */}
          <div className="w-full h-0.5 bg-slate-800 relative">
            {isRunning && (
              <div 
                className={`absolute inset-0 bg-gradient-to-r from-transparent ${
                  isLoss ? 'via-rose-500' : 'via-cyan-400'
                } to-transparent animate-pulse`} 
              />
            )}
          </div>

          {/* Animated Flow Particles */}
          {isRunning && (
            <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
              <span className={`w-2.5 h-2.5 rounded-full ${isLoss ? 'bg-rose-400' : 'bg-cyan-400'} animate-ping`} />
              <span className={`w-2 h-2 rounded-full ${isLoss ? 'bg-amber-400' : 'bg-sky-400'} animate-ping delay-100`} />
              <span className={`w-2.5 h-2.5 rounded-full ${isLoss ? 'bg-rose-400' : 'bg-emerald-400'} animate-ping delay-200`} />
            </div>
          )}

          {/* Middle Protocol Badge */}
          <div className="absolute px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-[10px] font-mono font-bold text-cyan-300 shadow-md">
            {protocol} TRANSPORT
          </div>
        </div>

        {/* Target Server Node */}
        <div className="flex items-center gap-3 z-10 text-right">
          <div>
            <div className="text-xs font-bold text-slate-100 font-mono">TARGET SERVER</div>
            <div className="text-[11px] text-emerald-400 font-mono">
              {host}:{port}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Loss: {snapshot?.packet_loss_pct || 0}%
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Globe className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

      </div>
    </div>
  );
};

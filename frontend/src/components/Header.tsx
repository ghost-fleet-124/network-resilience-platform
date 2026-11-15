import React from 'react';
import { Activity, Wifi, WifiOff, History, Server, Cpu } from 'lucide-react';
import { MetricSnapshot } from '../types';

interface HeaderProps {
  isConnected: boolean;
  snapshot: MetricSnapshot | null;
  onOpenHistory: () => void;
  onToggleMockModal: () => void;
  onToggleClusterModal: () => void;
  mockRunning: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  snapshot,
  onOpenHistory,
  onToggleMockModal,
  onToggleClusterModal,
  mockRunning,
}) => {
  return (
    <header className="border-b border-cyber-border bg-[#0d1322]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <Activity className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                ANTIGRAVITY // RESILIENCE OPS
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-cyan-400 font-semibold tracking-wider">
                Enterprise 5M RPS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Distributed Network Load Testing & High-Capacity Protocol Resilience Engine
            </p>
          </div>
        </div>

        {/* Live System Diagnostics & Quick Actions */}
        <div className="flex items-center gap-3">
          
          {/* Cluster Manager Trigger */}
          <button
            onClick={onToggleClusterModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/40 hover:bg-purple-900/40 border border-purple-800/80 text-purple-300 text-xs font-mono transition-colors cursor-pointer"
            title="Inspect distributed generator cluster nodes & benchmark local machine limit"
          >
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Cluster Nodes</span>
          </button>

          {/* Mock Server Environment Status */}
          <button
            onClick={onToggleMockModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all cursor-pointer ${
              mockRunning 
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-400 hover:bg-emerald-900/40' 
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="Local sandbox targets for instant zero-setup testing"
          >
            <Server className={`w-3.5 h-3.5 ${mockRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">Mock Sandbox: {mockRunning ? 'ONLINE' : 'OFFLINE'}</span>
          </button>

          {/* Generator Host Health */}
          {snapshot && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-cyber-border text-xs font-mono">
              <span className="text-slate-400">HOST:</span>
              <span className="text-cyan-400">CPU {snapshot.cpu_usage_pct.toFixed(0)}%</span>
              <span className="text-slate-600">|</span>
              <span className="text-purple-400">RAM {snapshot.ram_usage_pct.toFixed(0)}%</span>
            </div>
          )}

          {/* WebSocket Status */}
          <div 
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono ${
              isConnected 
                ? 'bg-cyan-950/40 border-cyan-800 text-cyan-400' 
                : 'bg-rose-950/40 border-rose-800 text-rose-400'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
          </div>

          {/* Test History Button */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyber-border text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-cyan-400" />
            <span>Audit</span>
          </button>

        </div>

      </div>
    </header>
  );
};

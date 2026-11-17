import React from 'react';
import { Activity, Radio, History, Shield, Scale, Lock, Cpu, Server } from 'lucide-react';
import { MetricSnapshot } from '../types';

interface HeaderProps {
  isConnected: boolean;
  snapshot: MetricSnapshot | null;
  onOpenHistory: () => void;
  onToggleMockModal: () => void;
  onToggleClusterModal: () => void;
  onToggleScopeModal: () => void;
  onToggleTermsModal: () => void;
  onTogglePrivacyModal: () => void;
  mockRunning: boolean;
  activeView?: 'console' | 'scopes' | 'reports' | 'cluster';
  onChangeView?: (view: 'console' | 'scopes' | 'reports' | 'cluster') => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  snapshot,
  onOpenHistory,
  onToggleMockModal,
  onToggleClusterModal,
  onToggleScopeModal,
  onToggleTermsModal,
  onTogglePrivacyModal,
  mockRunning,
  activeView = 'console',
  onChangeView
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur sticky top-0 z-40 px-4 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white">
                  ResilienceOps
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
                  Enterprise Platform
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                High-Volume Resilience & Load Verification Platform
              </p>
            </div>
          </div>

          {/* Navigation Tabs if onChangeView is passed */}
          {onChangeView && (
            <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-slate-800">
              <button
                onClick={() => onChangeView('console')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  activeView === 'console'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                Live Console
              </button>
              <button
                onClick={() => onToggleScopeModal()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                Target Scopes
              </button>
              <button
                onClick={() => onOpenHistory()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                Test Reports
              </button>
              <button
                onClick={() => onToggleClusterModal()}
                className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition-colors cursor-pointer"
              >
                Cluster Nodes
              </button>
            </nav>
          )}
        </div>

        {/* Right Action & Status Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Scope Manager */}
          <button
            onClick={onToggleScopeModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Manage Authorized Organizational Scopes"
          >
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Approved Scopes</span>
          </button>

          {/* Cluster Capacity pill */}
          <button
            onClick={onToggleClusterModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Cluster Hardware Capacity"
          >
            <Cpu className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Cluster</span>
          </button>

          {/* Test History Trigger */}
          <button
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            title="Inspect historical test runs & SLA reports"
          >
            <History className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Mock Server Environment Status */}
          <button
            onClick={onToggleMockModal}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium transition-colors cursor-pointer ${
              mockRunning 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400 hover:bg-emerald-900/40' 
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
            title="Local Sandbox / Staging Environment"
          >
            <Server className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mock Lab:</span>
            <span>{mockRunning ? 'Online' : 'Stopped'}</span>
          </button>

          {/* Telemetry Connection Status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-mono ${
              isConnected
                ? 'bg-slate-800/80 border-slate-700 text-emerald-400'
                : 'bg-rose-950/30 border-rose-900/50 text-rose-400'
            }`}
            title={isConnected ? 'Live WebSocket telemetry active' : 'Telemetry disconnected'}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
            <span className="text-[11px] font-sans hidden sm:inline">{isConnected ? 'Telemetry' : 'Disconnected'}</span>
          </div>

          {/* Legal / Policy Links Dropdown / Modals */}
          <button
            onClick={onToggleTermsModal}
            className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Acceptable Use Policy"
          >
            <Scale className="w-3.5 h-3.5" />
            <span>AUP</span>
          </button>

          <button
            onClick={onTogglePrivacyModal}
            className="hidden xl:flex items-center gap-1 px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Privacy & Data Governance"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy</span>
          </button>
        </div>
      </div>
    </header>
  );
};

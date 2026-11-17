import React from 'react';
import { 
  LayoutDashboard, 
  PlayCircle, 
  ShieldCheck, 
  History, 
  FileText, 
  Settings,
  Activity,
  Server,
  Radio
} from 'lucide-react';
import { TestStatus } from '../types';

export type NavView = 'overview' | 'new-test' | 'targets' | 'history' | 'reports' | 'settings';

interface SidebarProps {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  isConnected: boolean;
  isTesting: boolean;
  currentStatus: TestStatus;
  mockRunning: boolean;
  activeTestCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  setActiveView,
  isConnected,
  isTesting,
  currentStatus,
  mockRunning,
  activeTestCount
}) => {
  const navItems = [
    { id: 'overview' as NavView, label: 'Overview', icon: LayoutDashboard },
    { id: 'new-test' as NavView, label: 'New Test', icon: PlayCircle, badge: isTesting ? 'Running' : undefined },
    { id: 'targets' as NavView, label: 'Authorized Targets', icon: ShieldCheck },
    { id: 'history' as NavView, label: 'Test History', icon: History },
    { id: 'reports' as NavView, label: 'Reports', icon: FileText },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-60 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 tracking-tight">ResilienceOps</h1>
            <p className="text-[11px] text-slate-500">Enterprise Load Platform</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-700 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-slate-200 space-y-2 text-xs">
        {/* Test Engine Status */}
        <div className="px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium">Engine:</span>
          <span className={`font-mono font-semibold flex items-center gap-1.5 ${
            isTesting ? 'text-emerald-600' : 'text-slate-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isTesting ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
            {currentStatus}
          </span>
        </div>

        {/* Telemetry Connectivity */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-slate-400" />
            Telemetry
          </span>
          <span className={`font-medium ${isConnected ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>

        {/* Mock Sandbox Lab */}
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Server className="w-3 h-3 text-slate-400" />
            Mock Staging
          </span>
          <span className={`font-medium ${mockRunning ? 'text-emerald-600' : 'text-slate-400'}`}>
            {mockRunning ? 'Online (9001-9005)' : 'Stopped'}
          </span>
        </div>
      </div>
    </aside>
  );
};

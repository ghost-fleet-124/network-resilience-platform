import React, { useState } from 'react';
import { 
  Settings, 
  Server, 
  Cpu, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Square, 
  RefreshCw,
  Trash2,
  ExternalLink
} from 'lucide-react';

interface SettingsViewProps {
  mockRunning: boolean;
  mockPorts: Record<string, number>;
  onStartMocks: () => Promise<void>;
  onStopMocks: () => Promise<void>;
  mockLoading: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  mockRunning,
  mockPorts,
  onStartMocks,
  onStopMocks,
  mockLoading
}) => {
  const [activeTab, setActiveTab] = useState<'sandbox' | 'cluster' | 'aup' | 'privacy'>('sandbox');
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);

  const runClusterBenchmark = async () => {
    setBenchmarkLoading(true);
    setBenchmarkResult(null);
    try {
      const res = await fetch('/api/targets/cluster/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration_sec: 2 })
      });
      const data = await res.json();
      setBenchmarkResult(data);
    } catch (err) {
      console.error('Benchmark failed:', err);
    } finally {
      setBenchmarkLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">Platform Settings & Infrastructure</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Local staging lab management, cluster benchmarking, compliance governance, and policies.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
        {[
          { id: 'sandbox' as const, label: 'Local Staging Lab (Mock Targets)', icon: Server },
          { id: 'cluster' as const, label: 'Cluster Benchmarking', icon: Cpu },
          { id: 'aup' as const, label: 'Acceptable Use Policy (AUP)', icon: ShieldCheck },
          { id: 'privacy' as const, label: 'Privacy & Data Governance', icon: FileText },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium border-b-2 transition-colors cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Local Staging Lab */}
      {activeTab === 'sandbox' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Local Staging Servers (Daemon)</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Safe, zero-risk local endpoints for validating HTTP GET/POST, TCP, UDP, WebSocket, and Netcode workloads.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded text-xs font-semibold inline-flex items-center gap-1.5 border ${
                mockRunning 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${mockRunning ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {mockRunning ? 'Staging Online' : 'Staging Stopped'}
              </span>

              {mockRunning ? (
                <button
                  onClick={onStopMocks}
                  disabled={mockLoading}
                  className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Stop Servers</span>
                </button>
              ) : (
                <button
                  onClick={onStartMocks}
                  disabled={mockLoading}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Servers</span>
                </button>
              )}
            </div>
          </div>

          {/* Port Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>HTTP Staging API</span>
                <span className="font-mono text-blue-600">Port 9003</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Endpoints: <code>/search</code> (GET), <code>/api/cart</code> (POST), <code>/api/auth</code> (POST)</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>High-Speed UDP Receiver</span>
                <span className="font-mono text-blue-600">Port 9001</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Stateless high-throughput packet sink with telemetry capture.</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>Raw TCP Echo Server</span>
                <span className="font-mono text-blue-600">Port 9002</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Full-duplex stream handler for raw TCP throughput testing.</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>WebSocket Gateway</span>
                <span className="font-mono text-blue-600">Port 9004</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Bidirectional ping/pong and echo frame validation.</p>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>Game Netcode Simulator</span>
                <span className="font-mono text-blue-600">Port 9005</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Tick rate simulation (60Hz / 128Hz) packet sequence checker.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Cluster Benchmarking */}
      {activeTab === 'cluster' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Cluster Capacity Benchmark</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates local CPU, memory buffers, and socket limits to determine genuine maximum RPS output.
              </p>
            </div>
            <button
              onClick={runClusterBenchmark}
              disabled={benchmarkLoading}
              className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {benchmarkLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
              <span>{benchmarkLoading ? 'Benchmarking Hardware...' : 'Run Hardware Benchmark'}</span>
            </button>
          </div>

          {benchmarkResult && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3 text-xs">
              <div className="font-semibold text-slate-900">Hardware Benchmark Results</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 font-sans">Single-Core Max RPS</span>
                  <div className="text-base font-bold text-blue-600">
                    {benchmarkResult.single_core_max_rps?.toLocaleString()} RPS
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 font-sans">Cluster Total Capacity</span>
                  <div className="text-base font-bold text-emerald-600">
                    {benchmarkResult.total_cluster_capacity_rps?.toLocaleString()} RPS
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 font-sans">Active Workers</span>
                  <div className="text-base font-bold text-slate-900">
                    {benchmarkResult.worker_count}
                  </div>
                </div>
                <div className="p-2.5 bg-white border border-slate-200 rounded">
                  <span className="text-[10px] text-slate-500 font-sans">Max Concurrent Conns</span>
                  <div className="text-base font-bold text-slate-900">
                    {benchmarkResult.max_concurrent_connections?.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Acceptable Use Policy */}
      {activeTab === 'aup' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Enterprise Acceptable Use Policy (AUP)</h3>
            <p className="text-[11px] text-slate-500">Legal governance and authorization requirements</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            <p className="font-semibold text-slate-900">1. Authorized Resilience Testing Mandate</p>
            <p>
              This Network Resilience Platform is engineered strictly for authorized capacity verification, stress evaluation, and network resilience audits. Workloads may only be dispatched against network endpoints, IP addresses, domains, and servers owned by your organization or where you possess explicit, written, documented authorization.
            </p>

            <p className="font-semibold text-slate-900">2. Prohibited Activities</p>
            <p>
              Under no circumstances may this platform be deployed against unauthorized third-party infrastructure, public service endpoints, educational institutions, government portals, or financial institutions without explicit written consent. Violations of this policy will result in immediate termination of cluster credentials and audit log export for legal review.
            </p>

            <p className="font-semibold text-slate-900">3. Target Authorization Architecture</p>
            <p>
              All target destinations must be registered in the server-side Authorized Scope Registry. The Safety Governor will inspect, normalize, and enforce host, port, protocol, and RPS boundaries before and during test dispatch.
            </p>
          </div>
        </div>
      )}

      {/* Tab 4: Privacy Policy */}
      {activeTab === 'privacy' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4 text-xs text-slate-700 leading-relaxed">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900">Privacy Policy & Data Retention</h3>
            <p className="text-[11px] text-slate-500">Audit logs, metrics storage, and telemetry governance</p>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            <p className="font-semibold text-slate-900">1. Telemetry and Test Metrics</p>
            <p>
              All test reports, SLA verdicts, latency percentiles, and execution statistics are persisted in local server-side storage (e.g. <code>backend/app/data/reports.json</code>). No external third-party tracking or telemetry aggregation services are contacted.
            </p>

            <p className="font-semibold text-slate-900">2. Retention and Purging</p>
            <p>
              Historical test audits are maintained to evaluate infrastructure resilience trends over time. Administrators may export reports as JSON or purge records at any time.
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

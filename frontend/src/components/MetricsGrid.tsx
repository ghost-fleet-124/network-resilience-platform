import React from 'react';
import { 
  Activity, 
  Zap, 
  Clock, 
  TrendingUp, 
  Radio, 
  Layers,
  ArrowDownUp,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { MetricSnapshot } from '../types';

interface MetricsGridProps {
  snapshot: MetricSnapshot | null;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ snapshot }) => {
  const targetRps = snapshot ? snapshot.target_rps : 0;
  const generatedRps = snapshot ? snapshot.generated_rps : 0;
  const receivedRps = snapshot ? snapshot.received_rps : 0;
  const successfulRps = snapshot ? snapshot.successful_rps : 0;
  const failedRps = snapshot ? snapshot.failed_rps : 0;
  
  const pps = snapshot ? snapshot.packets_per_sec : 0;
  const activeConns = snapshot ? snapshot.active_conns : 0;
  const avgLat = snapshot ? snapshot.avg_latency_ms : 0;
  const p95Lat = snapshot ? snapshot.p95_latency_ms : 0;
  const p99Lat = snapshot ? snapshot.p99_latency_ms : 0;
  const jitter = snapshot ? snapshot.jitter_ms : 0;
  const lossPct = snapshot ? snapshot.packet_loss_pct : 0;
  const throughput = snapshot ? snapshot.throughput_kbps : 0;
  const errorRate = snapshot ? snapshot.error_rate_pct : 0;
  
  const generatorCapPct = snapshot ? snapshot.generator_capacity_pct : 0;
  const clusterMaxRps = snapshot ? snapshot.cluster_max_achievable_rps : 100000;
  const nodesNeeded = snapshot ? snapshot.nodes_needed_for_target : 1;

  return (
    <div className="space-y-3">
      
      {/* 4-Pillar Enterprise RPS Breakdown Banner */}
      <div className="bg-[#0b101e] border border-cyan-500/40 rounded-2xl p-4 shadow-[0_0_20px_rgba(6,182,212,0.15)]">
        <div className="flex items-center justify-between text-xs font-mono mb-3 border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2 text-cyan-400 font-extrabold uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Enterprise Request-Per-Second (RPS) Velocity Breakdown</span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-slate-400">Generator Cluster Ceiling:</span>
            <span className="text-emerald-400 font-bold">{clusterMaxRps.toLocaleString()} RPS (Local Node)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
          
          {/* Pillar 1: Target Requested RPS */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-purple-800/80">
            <div className="text-[11px] text-purple-300 uppercase tracking-wider font-semibold">1. Requested Target</div>
            <div className="text-2xl font-extrabold text-purple-400 mt-1">
              {targetRps.toLocaleString()}
              <span className="text-xs text-slate-400 font-sans ml-1">RPS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Configured workload target</div>
          </div>

          {/* Pillar 2: Actual Generated RPS */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-800/80">
            <div className="text-[11px] text-cyan-300 uppercase tracking-wider font-semibold">2. Outbound Generated</div>
            <div className="text-2xl font-extrabold text-cyan-400 mt-1">
              {generatedRps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs text-slate-400 font-sans ml-1">RPS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
              <span>Traffic dispatched by nodes</span>
              {pps > 0 && <span className="text-cyan-300">{pps.toFixed(0)} PPS</span>}
            </div>
          </div>

          {/* Pillar 3: Received Acknowledged RPS */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-sky-800/80">
            <div className="text-[11px] text-sky-300 uppercase tracking-wider font-semibold">3. Received / Echoed</div>
            <div className="text-2xl font-extrabold text-sky-400 mt-1">
              {receivedRps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs text-slate-400 font-sans ml-1">RPS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Acknowledged by server</div>
          </div>

          {/* Pillar 4: Successfully Processed vs Failed */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-800/80">
            <div className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold flex items-center justify-between">
              <span>4. Processed Success</span>
              <span className="text-rose-400 text-[10px]">Fail: {failedRps.toFixed(0)}/s</span>
            </div>
            <div className="text-2xl font-extrabold text-emerald-400 mt-1">
              {successfulRps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-xs text-slate-400 font-sans ml-1">RPS</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
              <span className="text-emerald-400">Total: {snapshot?.success_count || 0}</span>
              <span className="text-rose-400">Drops: {snapshot?.error_count || 0}</span>
            </div>
          </div>

        </div>

        {/* Capacity Warning Banner if Target Exceeds Generator Capacity */}
        {snapshot?.capacity_warning && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs font-mono flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-pulse text-amber-400" />
            <span>{snapshot.capacity_warning}</span>
          </div>
        )}
      </div>

      {/* Secondary Metrics Row (Latency, Tail P95/P99, Loss & Jitter, Concurrency, Throughput, Generator Load) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        
        {/* 1. Concurrency Sockets */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Concurrency</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-extrabold text-sky-400 font-mono">
            {activeConns.toLocaleString()}
            <span className="text-xs text-slate-500 font-sans ml-1">conns</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Success: {snapshot?.successful_conns || 0}
          </div>
        </div>

        {/* 2. Average Latency */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Average Latency</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono">
            {avgLat.toFixed(1)}
            <span className="text-xs text-slate-500 font-sans ml-1">ms</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Min: {snapshot ? snapshot.min_latency_ms.toFixed(1) : 0}ms &bull; Max: {snapshot ? snapshot.max_latency_ms.toFixed(1) : 0}ms
          </div>
        </div>

        {/* 3. Tail Latencies (P95 / P99) */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Tail Latency</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400 font-mono">
            {p95Lat.toFixed(1)}
            <span className="text-xs text-slate-500 font-sans ml-1">ms (P95)</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            P50: {snapshot ? snapshot.p50_latency_ms.toFixed(1) : 0}ms &bull; P99: <span className="text-purple-300 font-bold">{p99Lat.toFixed(1)}ms</span>
          </div>
        </div>

        {/* 4. Packet Loss & Jitter */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Loss & Jitter</span>
            <Radio className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-2xl font-extrabold font-mono ${lossPct > 2 ? 'text-rose-400' : 'text-amber-400'}`}>
            {lossPct.toFixed(1)}%
            <span className="text-xs text-slate-500 font-sans ml-1">loss</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Jitter: {jitter.toFixed(1)}ms &bull; Recv: {snapshot?.total_packets_received || 0}
          </div>
        </div>

        {/* 5. Network Throughput */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Throughput</span>
            <ArrowDownUp className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-400 font-mono">
            {(throughput / 1024).toFixed(1)}
            <span className="text-xs text-slate-500 font-sans ml-1">MB/s</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            {((throughput * 8) / 1000000).toFixed(2)} Gbps &bull; Err: {errorRate.toFixed(1)}%
          </div>
        </div>

        {/* 6. Generator Node Load */}
        <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono uppercase mb-1.5">
            <span>Generator Load</span>
            <Server className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-extrabold text-cyan-400 font-mono">
            {generatorCapPct.toFixed(0)}%
            <span className="text-xs text-slate-500 font-sans ml-1">capacity</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400 font-mono">
            Scale: {nodesNeeded} node{nodesNeeded > 1 ? 's' : ''} needed for target
          </div>
        </div>

      </div>

    </div>
  );
};

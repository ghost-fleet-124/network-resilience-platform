import React, { useState, useEffect } from 'react';
import { X, Server, Cpu, Zap, Activity, CheckCircle, RefreshCw } from 'lucide-react';
import { ClusterNode } from '../types';

interface ClusterManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClusterManagerModal: React.FC<ClusterManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const [nodes, setNodes] = useState<ClusterNode[]>([]);
  const [totalCapacity, setTotalCapacity] = useState<number>(100000);
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);

  const fetchNodes = async () => {
    try {
      const res = await fetch('/api/targets/cluster/nodes');
      const data = await res.json();
      setNodes(data.nodes || []);
      setTotalCapacity(data.total_capacity_rps || 100000);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNodes();
    }
  }, [isOpen]);

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch('/api/targets/cluster/benchmark', { method: 'POST' });
      const data = await res.json();
      await fetchNodes();
    } catch (e) {
      console.error(e);
    } finally {
      setIsBenchmarking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-cyber-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-mono text-slate-100 uppercase tracking-wider">
              Distributed Generator Cluster Topology
            </h2>
            <p className="text-xs text-slate-400">
              Active load-generator machines, measured hardware baselines, and sharded allocations.
            </p>
          </div>
        </div>

        {/* Cluster Summary Banner */}
        <div className="grid grid-cols-3 gap-3 mb-5 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase">Active Generator Nodes</div>
            <div className="text-lg font-bold text-cyan-400 mt-1">{nodes.length} Machines</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 text-[11px] uppercase">Total Measured Capacity</div>
            <div className="text-lg font-bold text-emerald-400 mt-1">{totalCapacity.toLocaleString()} RPS</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="text-slate-400 text-[11px] uppercase">Hardware Benchmark</div>
            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="mt-1 flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-700 text-cyan-300 font-bold text-[11px] transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isBenchmarking ? 'animate-spin' : ''}`} />
              <span>{isBenchmarking ? 'Benchmarking...' : 'Test Local Limit'}</span>
            </button>
          </div>
        </div>

        {/* Node Cards List */}
        <div className="space-y-3 mb-6">
          {nodes.map((node) => (
            <div
              key={node.node_id}
              className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between font-mono text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-700 text-cyan-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-slate-200 flex items-center gap-2">
                    <span>{node.name}</span>
                    {node.is_local && (
                      <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[10px] border border-cyan-800">
                        PRIMARY HOST
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    IP: {node.ip_address} &bull; {node.cpu_cores} Cores &bull; Status: <span className="text-emerald-400">{node.status}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-slate-400 text-[11px]">Hardware Limit:</div>
                <div className="text-emerald-400 font-bold text-sm">
                  {node.measured_max_rps.toLocaleString()} RPS
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Close Cluster Panel
          </button>
        </div>

      </div>
    </div>
  );
};

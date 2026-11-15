import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { MetricSnapshot } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LiveChartsProps {
  history: MetricSnapshot[];
}

export const LiveCharts: React.FC<LiveChartsProps> = ({ history }) => {
  const labels = history.map((s) => `${s.elapsed_sec.toFixed(0)}s`);

  // Chart 1: Latencies
  const latencyData = {
    labels,
    datasets: [
      {
        label: 'Avg Latency (ms)',
        data: history.map((s) => s.avg_latency_ms),
        borderColor: '#10b981', // emerald
        backgroundColor: 'rgba(16, 185, 129, 0.05)',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'P95 Tail (ms)',
        data: history.map((s) => s.p95_latency_ms),
        borderColor: '#a855f7', // purple
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.8,
        borderDash: [4, 4],
      },
      {
        label: 'P99 Tail (ms)',
        data: history.map((s) => s.p99_latency_ms),
        borderColor: '#f43f5e', // rose
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.8,
      },
      {
        label: 'Jitter (ms)',
        data: history.map((s) => s.jitter_ms),
        borderColor: '#06b6d4', // cyan
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  };

  // Chart 2: Throughput and Traffic Velocity
  const throughputData = {
    labels,
    datasets: [
      {
        label: 'Operations/Sec (RPS/PPS)',
        data: history.map((s) => Math.max(s.req_per_sec, s.packets_per_sec)),
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        yAxisID: 'y',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Throughput (KB/s)',
        data: history.map((s) => s.throughput_kbps),
        borderColor: '#818cf8',
        backgroundColor: 'transparent',
        yAxisID: 'y1',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 1.8,
      },
    ],
  };

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          boxWidth: 12,
          font: { family: 'JetBrains Mono', size: 11 },
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#38bdf8',
        bodyColor: '#e2e8f0',
        titleFont: { family: 'JetBrains Mono' },
        bodyFont: { family: 'JetBrains Mono' },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
      },
      y: {
        grid: { color: 'rgba(51, 65, 85, 0.2)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
        beginAtZero: true,
      },
    },
  };

  const dualAxisOptions = {
    ...commonOptions,
    scales: {
      ...commonOptions.scales,
      y: {
        ...commonOptions.scales.y,
        position: 'left' as const,
        title: { display: true, text: 'Ops / sec', color: '#64748b' },
      },
      y1: {
        position: 'right' as const,
        grid: { drawOnChartArea: false },
        ticks: { color: '#818cf8', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: 'KB/s', color: '#818cf8' },
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Latency Chart */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col h-72">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
            Live Round-Trip Latency & Tail Percentiles (P95/P99)
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
            Sub-Millisecond Resolution
          </span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <Line data={latencyData} options={commonOptions} />
        </div>
      </div>

      {/* Throughput & RPS Chart */}
      <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4 shadow-lg flex flex-col h-72">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-300 font-bold uppercase tracking-wider">
            Live Traffic Velocity (Ops/Sec) & Throughput (KB/s)
          </span>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
            Synchronized Dual Axis
          </span>
        </div>
        <div className="flex-1 w-full min-h-0">
          <Line data={throughputData} options={dualAxisOptions} />
        </div>
      </div>
    </div>
  );
};

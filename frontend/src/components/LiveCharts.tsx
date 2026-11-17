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
  if (history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-center text-xs text-slate-500 font-mono">
        Telemetry stream idle. Start a workload to render live time-series performance charts.
      </div>
    );
  }

  const labels = history.map((s) => `${s.elapsed_sec.toFixed(0)}s`);

  // Chart 1: Response Latency (P50, P95, P99)
  const latencyData = {
    labels,
    datasets: [
      {
        label: 'Average Latency (ms)',
        data: history.map((s) => s.avg_latency_ms),
        borderColor: '#3b82f6', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.8,
        fill: true,
      },
      {
        label: 'P95 Tail Latency (ms)',
        data: history.map((s) => s.p95_latency_ms),
        borderColor: '#f59e0b', // amber
        backgroundColor: 'transparent',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.8,
      },
      {
        label: 'P99 Latency (ms)',
        data: history.map((s) => s.p99_latency_ms),
        borderColor: '#ef4444', // red
        backgroundColor: 'transparent',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.5,
        borderDash: [3, 3],
      }
    ],
  };

  // Chart 2: Throughput Velocity (Generated RPS vs Received RPS)
  const throughputData = {
    labels,
    datasets: [
      {
        label: 'Generated (Outbound RPS)',
        data: history.map((s) => s.generated_rps),
        borderColor: '#0284c7', // sky
        backgroundColor: 'rgba(2, 132, 199, 0.08)',
        yAxisID: 'y',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 2,
        fill: true,
      },
      {
        label: 'Received (Confirmed RPS)',
        data: history.map((s) => s.received_rps),
        borderColor: '#10b981', // emerald
        backgroundColor: 'transparent',
        yAxisID: 'y',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.8,
      },
      {
        label: 'Throughput (KB/s)',
        data: history.map((s) => s.throughput_kbps),
        borderColor: '#6366f1', // indigo
        backgroundColor: 'transparent',
        yAxisID: 'y1',
        tension: 0.2,
        pointRadius: 0,
        borderWidth: 1.2,
        borderDash: [4, 4],
      }
    ],
  };

  const chartOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#94a3b8',
          font: { size: 10, family: 'Inter, sans-serif' },
          boxWidth: 10,
          boxHeight: 10,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#f8fafc',
        bodyColor: '#cbd5e1',
        titleFont: { size: 11 },
        bodyFont: { size: 11 },
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 9 } },
        grid: { color: '#1e293b' },
      },
      y: {
        ticks: { color: '#64748b', font: { size: 9 } },
        grid: { color: '#1e293b' },
      },
    },
  };

  const dualAxisOptions = {
    ...chartOptions,
    scales: {
      ...chartOptions.scales,
      y1: {
        position: 'right' as const,
        ticks: { color: '#818cf8', font: { size: 9 } },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Latency Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <h3 className="text-xs font-semibold text-white">Latency Percentiles (ms)</h3>
          <span className="text-[11px] font-mono text-slate-400">P50 / P95 / P99 Tail</span>
        </div>
        <div className="h-56">
          <Line data={latencyData} options={chartOptions} />
        </div>
      </div>

      {/* Throughput Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <h3 className="text-xs font-semibold text-white">Traffic Velocity & Throughput</h3>
          <span className="text-[11px] font-mono text-slate-400">Generated vs Confirmed RPS</span>
        </div>
        <div className="h-56">
          <Line data={throughputData} options={dualAxisOptions} />
        </div>
      </div>
    </div>
  );
};

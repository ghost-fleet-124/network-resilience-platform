import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Clock, ShieldAlert, Cpu } from 'lucide-react';
import { Protocol } from '../types';

interface AdvancedSettingsProps {
  protocol: Protocol;
  packetSize: number;
  setPacketSize: (v: number) => void;
  gameTickHz: number;
  setGameTickHz: (v: number) => void;
  httpFollowRedirects: boolean;
  setHttpFollowRedirects: (v: boolean) => void;
  httpKeepAlive: boolean;
  setHttpKeepAlive: (v: boolean) => void;
  wsPath: string;
  setWsPath: (v: string) => void;
  errorThreshold: number;
  setErrorThreshold: (v: number) => void;
  latencyThreshold: number;
  setLatencyThreshold: (v: number) => void;
  rampUpSec: number;
  setRampUpSec: (v: number) => void;
  sustainedSec: number;
  setSustainedSec: (v: number) => void;
  rampDownSec: number;
  setRampDownSec: (v: number) => void;
  disabled: boolean;
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
  protocol,
  packetSize,
  setPacketSize,
  gameTickHz,
  setGameTickHz,
  httpFollowRedirects,
  setHttpFollowRedirects,
  httpKeepAlive,
  setHttpKeepAlive,
  wsPath,
  setWsPath,
  errorThreshold,
  setErrorThreshold,
  latencyThreshold,
  setLatencyThreshold,
  rampUpSec,
  setRampUpSec,
  sustainedSec,
  setSustainedSec,
  rampDownSec,
  setRampDownSec,
  disabled
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isHttp = protocol === 'HTTP' || protocol === 'HTTPS' || protocol === 'HTTP_WEBSITE';
  const totalDuration = rampUpSec + sustainedSec + rampDownSec;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center text-slate-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-200">
              Advanced Timing & Protocol Tuning
            </span>
            <span className="ml-2 text-[11px] text-slate-400">
              (Ramp curves, connection reuse, packet framing & safety thresholds)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Total: {totalDuration}s
          </span>
          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4">
          
          {/* Workload Timing Curves (Ramp-up, Sustained, Ramp-down) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span>Workload Curve Timings</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Ramp-Up:</span>
                  <span className="font-mono text-white">{rampUpSec}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={rampUpSec}
                  onChange={(e) => setRampUpSec(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Sustained:</span>
                  <span className="font-mono text-white">{sustainedSec}s</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="300"
                  step="5"
                  value={sustainedSec}
                  onChange={(e) => setSustainedSec(parseInt(e.target.value) || 5)}
                  disabled={disabled}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Ramp-Down:</span>
                  <span className="font-mono text-white">{rampDownSec}s</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={rampDownSec}
                  onChange={(e) => setRampDownSec(parseInt(e.target.value) || 0)}
                  disabled={disabled}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* HTTP Specific Settings */}
          {isHttp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={httpKeepAlive}
                  onChange={(e) => setHttpKeepAlive(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Connection Reuse (HTTP Keep-Alive)</span>
                  <p className="text-[11px] text-slate-400">Reuses TCP connections across requests for maximum throughput</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={httpFollowRedirects}
                  onChange={(e) => setHttpFollowRedirects(e.target.checked)}
                  disabled={disabled}
                  className="rounded border-slate-700 text-blue-500 focus:ring-0"
                />
                <div>
                  <span className="font-medium">Follow HTTP Redirects (3xx)</span>
                  <p className="text-[11px] text-slate-400">Automatically resolves 301, 302, 307 and 308 redirects</p>
                </div>
              </label>
            </div>
          )}

          {/* Transport Specific Settings (UDP / TCP / WS / Game) */}
          {!isHttp && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
              {protocol === 'UDP' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Packet Size (Bytes)</label>
                  <input
                    type="number"
                    min="32"
                    max="1400"
                    value={packetSize}
                    onChange={(e) => setPacketSize(parseInt(e.target.value) || 256)}
                    disabled={disabled}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {protocol === 'GAME_UDP' && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">Tick Rate (Hz)</label>
                  <input
                    type="number"
                    min="10"
                    max="128"
                    value={gameTickHz}
                    onChange={(e) => setGameTickHz(parseInt(e.target.value) || 60)}
                    disabled={disabled}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {protocol === 'WEBSOCKET' && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300">WebSocket Path</label>
                  <input
                    type="text"
                    value={wsPath}
                    onChange={(e) => setWsPath(e.target.value)}
                    disabled={disabled}
                    className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Safety & Circuit Breaker Thresholds */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Safety Circuit Breakers</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Abort if Error Rate Exceeds ({errorThreshold}%)
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={errorThreshold}
                  onChange={(e) => setErrorThreshold(parseFloat(e.target.value) || 50)}
                  disabled={disabled}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] text-slate-400">
                  Abort if P95 Latency Exceeds ({latencyThreshold}ms)
                </label>
                <input
                  type="number"
                  min="100"
                  max="30000"
                  step="500"
                  value={latencyThreshold}
                  onChange={(e) => setLatencyThreshold(parseFloat(e.target.value) || 5000)}
                  disabled={disabled}
                  className="w-full bg-slate-950 border border-slate-700 px-3 py-1.5 text-xs font-mono text-white rounded focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

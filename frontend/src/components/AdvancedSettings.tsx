import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Clock, TrendingUp } from 'lucide-react';
import { Protocol } from '../types';

interface AdvancedSettingsProps {
  protocol: Protocol;
  packetSize: number;
  setPacketSize: (v: number) => void;
  gameTickHz: number;
  setGameTickHz: (v: number) => void;
  httpMethod: string;
  setHttpMethod: (v: string) => void;
  httpPath: string;
  setHttpPath: (v: string) => void;
  httpPayload: string;
  setHttpPayload: (v: string) => void;
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
  httpMethod,
  setHttpMethod,
  httpPath,
  setHttpPath,
  httpPayload,
  setHttpPayload,
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

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-4 shadow-lg">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left text-slate-300 hover:text-white transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-cyan-400">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              4. Advanced Workload Curves & Protocol Tuning
            </span>
            <span className="ml-2 text-[11px] text-slate-500 font-sans">
              (Ramp-Up, Sustained, Ramp-Down timings, payload size & safety ceilings)
            </span>
          </div>
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 text-xs font-mono">
          
          {/* Workload Timing Curves (Ramp-up, Sustained, Ramp-down) */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Traffic Workload Curve Choreography</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-slate-400 mb-1 flex justify-between">
                  <span>Ramp-Up Duration</span>
                  <span className="text-cyan-300 font-bold">{rampUpSec}s</span>
                </label>
                <input
                  type="range"
                  disabled={disabled}
                  min={0}
                  max={60}
                  step={5}
                  value={rampUpSec}
                  onChange={(e) => setRampUpSec(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <span className="text-[10px] text-slate-500">Gradual ascent to target RPS</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 flex justify-between">
                  <span>Sustained Peak Duration</span>
                  <span className="text-purple-300 font-bold">{sustainedSec}s</span>
                </label>
                <input
                  type="range"
                  disabled={disabled}
                  min={10}
                  max={300}
                  step={10}
                  value={sustainedSec}
                  onChange={(e) => setSustainedSec(parseInt(e.target.value))}
                  className="w-full accent-purple-500"
                />
                <span className="text-[10px] text-slate-500">Continuous peak workload phase</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 flex justify-between">
                  <span>Ramp-Down Duration</span>
                  <span className="text-emerald-300 font-bold">{rampDownSec}s</span>
                </label>
                <input
                  type="range"
                  disabled={disabled}
                  min={0}
                  max={60}
                  step={5}
                  value={rampDownSec}
                  onChange={(e) => setRampDownSec(parseInt(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <span className="text-[10px] text-slate-500">Graceful traffic cool-down</span>
              </div>
            </div>
          </div>

          {/* Protocol Tuning Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {(protocol === 'UDP' || protocol === 'GAME_UDP') && (
              <div>
                <label className="block text-slate-400 mb-1">Packet Payload Size (Bytes)</label>
                <input
                  type="number"
                  disabled={disabled}
                  min={32}
                  max={4096}
                  value={packetSize}
                  onChange={(e) => setPacketSize(parseInt(e.target.value) || 256)}
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500">Range: 32 - 4,096 bytes</span>
              </div>
            )}

            {protocol === 'GAME_UDP' && (
              <div>
                <label className="block text-slate-400 mb-1">Game Simulation Tick (Hz)</label>
                <select
                  disabled={disabled}
                  value={gameTickHz}
                  onChange={(e) => setGameTickHz(parseInt(e.target.value))}
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                >
                  <option value={20}>20 Hz (Battle Royale / MMO)</option>
                  <option value={30}>30 Hz (Console Multiplayer)</option>
                  <option value={60}>60 Hz (Standard Competitive)</option>
                  <option value={128}>128 Hz (Pro Tournament / CS-style)</option>
                </select>
              </div>
            )}

            {(protocol === 'HTTP' || protocol === 'HTTPS') && (
              <>
                <div>
                  <label className="block text-slate-400 mb-1">HTTP Method</label>
                  <select
                    disabled={disabled}
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="HEAD">HEAD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">API Endpoint Path</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={httpPath}
                    onChange={(e) => setHttpPath(e.target.value)}
                    placeholder="/api/auth"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                  />
                </div>
              </>
            )}

            {protocol === 'WEBSOCKET' && (
              <div>
                <label className="block text-slate-400 mb-1">WebSocket URL Path</label>
                <input
                  type="text"
                  disabled={disabled}
                  value={wsPath}
                  onChange={(e) => setWsPath(e.target.value)}
                  placeholder="/"
                  className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-cyan-500"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 flex items-center justify-between">
                <span>Auto-Cutoff Error %</span>
                <span className="text-amber-400">{errorThreshold}%</span>
              </label>
              <input
                type="range"
                disabled={disabled}
                min={10}
                max={90}
                value={errorThreshold}
                onChange={(e) => setErrorThreshold(parseInt(e.target.value))}
                className="w-full accent-amber-500"
              />
              <span className="text-[10px] text-slate-500">Terminates if error % exceeds ceiling</span>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 flex items-center justify-between">
                <span>Auto-Cutoff Latency</span>
                <span className="text-rose-400">{latencyThreshold} ms</span>
              </label>
              <input
                type="range"
                disabled={disabled}
                min={500}
                max={10000}
                step={500}
                value={latencyThreshold}
                onChange={(e) => setLatencyThreshold(parseInt(e.target.value))}
                className="w-full accent-rose-500"
              />
              <span className="text-[10px] text-slate-500">Prevents unmanaged congestion</span>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

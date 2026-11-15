import React, { useState } from 'react';
import { Sliders, ChevronDown, ChevronUp, Clock, TrendingUp, Globe, Shield } from 'lucide-react';
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
  httpHeaders: string;
  setHttpHeaders: (v: string) => void;
  httpFollowRedirects: boolean;
  setHttpFollowRedirects: (v: boolean) => void;
  httpKeepAlive: boolean;
  setHttpKeepAlive: (v: boolean) => void;
  httpTimeoutSec: number;
  setHttpTimeoutSec: (v: number) => void;
  httpVirtualUsers: number;
  setHttpVirtualUsers: (v: number) => void;
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
  httpHeaders,
  setHttpHeaders,
  httpFollowRedirects,
  setHttpFollowRedirects,
  httpKeepAlive,
  setHttpKeepAlive,
  httpTimeoutSec,
  setHttpTimeoutSec,
  httpVirtualUsers,
  setHttpVirtualUsers,
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
  const isHttpFamily = protocol === 'HTTP' || protocol === 'HTTPS' || protocol === 'HTTP_WEBSITE';

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
              (Ramp-Up, Sustained, Ramp-Down timings, headers, payloads & safety limits)
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
                  min={1}
                  max={60}
                  step={1}
                  value={rampUpSec}
                  onChange={(e) => setRampUpSec(parseInt(e.target.value))}
                  className="w-full accent-cyan-500"
                />
                <span className="text-[10px] text-slate-500">Gradual socket concurrency build-up</span>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 flex justify-between">
                  <span>Sustained Duration</span>
                  <span className="text-sky-300 font-bold">{sustainedSec}s</span>
                </label>
                <input
                  type="range"
                  disabled={disabled}
                  min={5}
                  max={300}
                  step={5}
                  value={sustainedSec}
                  onChange={(e) => setSustainedSec(parseInt(e.target.value))}
                  className="w-full accent-sky-500"
                />
                <span className="text-[10px] text-slate-500">100% full intensity test window</span>
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

          {/* Website / HTTP Specific Configuration */}
          {isHttpFamily && (
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-emerald-900/40 space-y-3">
              <div className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" />
                <span>Website Load Testing & HTTP Parameters</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">HTTP Method</label>
                  <select
                    disabled={disabled}
                    value={httpMethod}
                    onChange={(e) => setHttpMethod(e.target.value)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="GET">GET (Page visit / Read API)</option>
                    <option value="POST">POST (Form / Checkout / Auth)</option>
                    <option value="PUT">PUT (Update resource)</option>
                    <option value="HEAD">HEAD (Headers check)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">URL Path / Route</label>
                  <input
                    type="text"
                    disabled={disabled}
                    value={httpPath}
                    onChange={(e) => setHttpPath(e.target.value)}
                    placeholder="/ or /search?q=test"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex justify-between">
                    <span>Virtual Users / Concurrency</span>
                    <span className="text-emerald-400 font-bold">{httpVirtualUsers} conns</span>
                  </label>
                  <input
                    type="number"
                    disabled={disabled}
                    min={1}
                    max={2000}
                    value={httpVirtualUsers}
                    onChange={(e) => setHttpVirtualUsers(parseInt(e.target.value) || 50)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex justify-between">
                    <span>Response Timeout</span>
                    <span className="text-emerald-400 font-bold">{httpTimeoutSec}s</span>
                  </label>
                  <input
                    type="number"
                    disabled={disabled}
                    min={1}
                    max={60}
                    step={0.5}
                    value={httpTimeoutSec}
                    onChange={(e) => setHttpTimeoutSec(parseFloat(e.target.value) || 5.0)}
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg px-3 py-2 text-slate-200 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Toggles: Keep-Alive & Redirects */}
              <div className="flex flex-wrap items-center gap-6 pt-1 text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={httpKeepAlive}
                    onChange={(e) => setHttpKeepAlive(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 accent-emerald-500"
                  />
                  <span>Connection Reuse (HTTP Keep-Alive)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={httpFollowRedirects}
                    onChange={(e) => setHttpFollowRedirects(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4 accent-emerald-500"
                  />
                  <span>Follow HTTP 301/302 Redirects</span>
                </label>
              </div>

              {/* Headers and Body */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-slate-400 mb-1">Custom Request Headers (One per line)</label>
                  <textarea
                    disabled={disabled}
                    rows={3}
                    value={httpHeaders}
                    onChange={(e) => setHttpHeaders(e.target.value)}
                    placeholder="Authorization: Bearer my-token&#10;X-Custom-Header: test&#10;Accept: application/json"
                    className="w-full bg-[#0a0f1d] border border-slate-700 rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-mono text-[11px] resize-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">
                    Request Body / Payload {httpMethod === 'GET' ? '(Disabled for GET)' : '(POST/PUT)'}
                  </label>
                  <textarea
                    disabled={disabled || httpMethod === 'GET' || httpMethod === 'HEAD'}
                    rows={3}
                    value={httpPayload}
                    onChange={(e) => setHttpPayload(e.target.value)}
                    placeholder='{"action": "search", "query": "tournament", "page": 1}'
                    className={`w-full bg-[#0a0f1d] border rounded-lg p-2.5 text-slate-200 outline-none focus:border-emerald-500 font-mono text-[11px] resize-none ${
                      httpMethod === 'GET' || httpMethod === 'HEAD' ? 'opacity-40 cursor-not-allowed border-slate-800' : 'border-slate-700'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Protocol Tuning Grid for Non-HTTP */}
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

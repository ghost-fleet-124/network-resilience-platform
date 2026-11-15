import React from 'react';
import { Play, Square, Pause, Flame, AlertOctagon, RotateCcw, Clock } from 'lucide-react';
import { TestStatus } from '../types';

interface ControlBarProps {
  status: TestStatus;
  elapsedSec: number;
  durationSec: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onEmergencyStop: () => void;
  isStarting: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  status,
  elapsedSec,
  durationSec,
  onStart,
  onStop,
  onPause,
  onResume,
  onEmergencyStop,
  isStarting
}) => {
  const isRunning = status === 'RUNNING';
  const isPaused = status === 'PAUSED';
  const isIdle = status === 'IDLE' || status === 'COMPLETED' || status === 'ABORTED' || status === 'CIRCUIT_BROKEN';

  return (
    <div className="bg-[#0b101d] border border-cyber-border rounded-2xl p-4 shadow-xl flex flex-wrap items-center justify-between gap-4">
      
      {/* Left: Status and Timer */}
      <div className="flex items-center gap-4">
        {/* Status Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-xs">
          <span className="text-slate-400">ENGINE STATUS:</span>
          {isRunning && (
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              RUNNING
            </span>
          )}
          {isPaused && (
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              PAUSED
            </span>
          )}
          {status === 'STOPPING' && (
            <span className="flex items-center gap-1.5 text-slate-300 font-bold">
              STOPPING...
            </span>
          )}
          {isIdle && (
            <span className="text-slate-400 font-semibold">
              STANDBY / READY
            </span>
          )}
          {status === 'CIRCUIT_BROKEN' && (
            <span className="text-rose-400 font-bold flex items-center gap-1">
              <AlertOctagon className="w-3.5 h-3.5" />
              CIRCUIT BREAKER TRIPPED
            </span>
          )}
        </div>

        {/* Elapsed Timer */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">DURATION:</span>
          <span className="text-cyan-300 font-bold text-sm">
            {elapsedSec.toFixed(1)}s
          </span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{durationSec}s</span>
        </div>
      </div>

      {/* Right: Operational Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        
        {/* Start Button */}
        {isIdle && (
          <button
            type="button"
            disabled={isStarting}
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isStarting ? 'INITIALIZING...' : 'START TEST'}</span>
          </button>
        )}

        {/* Pause / Resume Button */}
        {isRunning && (
          <button
            type="button"
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm transition-all cursor-pointer"
          >
            <Pause className="w-4 h-4" />
            <span>PAUSE</span>
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/40 text-sky-300 font-bold text-sm transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>RESUME</span>
          </button>
        )}

        {/* Stop Test */}
        {!isIdle && (
          <button
            type="button"
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm transition-all cursor-pointer"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>STOP TEST</span>
          </button>
        )}

        {/* EMERGENCY STOP - PROMINENT RED KILL SWITCH */}
        <button
          type="button"
          onClick={onEmergencyStop}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 text-white font-extrabold text-sm shadow-[0_0_15px_rgba(244,63,94,0.4)] border border-rose-500 transition-all transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          title="Instant cutoff: immediately drops all active worker sockets and triggers safety trip"
        >
          <AlertOctagon className="w-4 h-4 animate-bounce" />
          <span>EMERGENCY STOP</span>
        </button>

      </div>

    </div>
  );
};

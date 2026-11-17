import React from 'react';
import { Play, Square, Pause, AlertOctagon, RotateCcw, Clock } from 'lucide-react';
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
  const progressPct = Math.min(100, durationSec > 0 ? (elapsedSec / durationSec) * 100 : 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Execution Status & Timing */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">Status:</span>
            {isRunning && (
              <span className="flex items-center gap-1.5 text-emerald-400 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                RUNNING
              </span>
            )}
            {isPaused && (
              <span className="flex items-center gap-1.5 text-amber-400 font-semibold font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                PAUSED
              </span>
            )}
            {status === 'STOPPING' && (
              <span className="text-slate-300 font-semibold font-mono">
                STOPPING...
              </span>
            )}
            {isIdle && (
              <span className="text-slate-300 font-semibold font-mono">
                READY
              </span>
            )}
            {status === 'CIRCUIT_BROKEN' && (
              <span className="text-rose-400 font-semibold font-mono flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                CIRCUIT BROKEN
              </span>
            )}
          </div>

          {/* Test Timer */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 font-sans">Elapsed:</span>
            <span className="text-white font-semibold">
              {elapsedSec.toFixed(1)}s
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{durationSec}s</span>
          </div>
        </div>

        {/* Right: Operational Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Start Test */}
          {isIdle && (
            <button
              type="button"
              disabled={isStarting}
              onClick={onStart}
              className="flex items-center gap-2 px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isStarting ? 'INITIALIZING...' : 'START TEST'}</span>
            </button>
          )}

          {/* Pause / Resume */}
          {isRunning && (
            <button
              type="button"
              onClick={onPause}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              <span>Pause</span>
            </button>
          )}

          {isPaused && (
            <button
              type="button"
              onClick={onResume}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resume</span>
            </button>
          )}

          {/* Stop */}
          {!isIdle && (
            <button
              type="button"
              onClick={onStop}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Stop Test</span>
            </button>
          )}

          {/* Emergency Stop */}
          {!isIdle && (
            <button
              type="button"
              onClick={onEmergencyStop}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors cursor-pointer"
              title="Immediate hard socket cut-off"
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              <span>Emergency Abort</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar when running or active */}
      {!isIdle && (
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-800">
          <div
            className="bg-blue-500 h-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      )}
    </div>
  );
};

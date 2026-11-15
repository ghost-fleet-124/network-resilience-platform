import React from 'react';
import { X, Server, Play, Square, CheckCircle, Radio, Layers, Cpu, MessageSquare, Gamepad2 } from 'lucide-react';

interface MockServerControlProps {
  isOpen: boolean;
  onClose: () => void;
  isRunning: boolean;
  ports: Record<string, number>;
  onStart: () => void;
  onStop: () => void;
  loading: boolean;
}

export const MockServerControl: React.FC<MockServerControlProps> = ({
  isOpen,
  onClose,
  isRunning,
  ports,
  onStart,
  onStop,
  loading
}) => {
  if (!isOpen) return null;

  const mockServices = [
    { name: 'UDP 60Hz Tick Receiver', port: ports.UDP_TICK || 9001, icon: <Radio className="w-4 h-4 text-cyan-400" />, desc: 'Echoes datagrams for RTT, loss %, and jitter evaluation' },
    { name: 'TCP Stream & Echo Server', port: ports.TCP_ECHO || 9002, icon: <Layers className="w-4 h-4 text-sky-400" />, desc: 'Accepts persistent socket streams & echoes framed messages' },
    { name: 'HTTP Auth & Matchmaking API', port: ports.HTTP_AUTH || 9003, icon: <Cpu className="w-4 h-4 text-emerald-400" />, desc: 'Simulates REST player auth & queue APIs with JSON payloads' },
    { name: 'WebSocket Matchmaking Lobby', port: ports.WS_LOBBY || 9004, icon: <MessageSquare className="w-4 h-4 text-purple-400" />, desc: 'Maintains duplex lobby rooms & echoes ping heartbeats' },
    { name: 'Multiplayer Netcode Game Server', port: ports.GAME_SERVER || 9005, icon: <Gamepad2 className="w-4 h-4 text-cyan-300" />, desc: 'Dedicated 60Hz tick server parsing player movement inputs' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-cyber-border rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold font-mono text-slate-100 uppercase tracking-wider">
              Local Mock Sandbox Environment
            </h2>
            <p className="text-xs text-slate-400">
              Integrated real test servers for safe local baseline testing.
            </p>
          </div>
        </div>

        {/* Status card */}
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono font-bold text-slate-200">
              MOCK SANDBOX: {isRunning ? 'RUNNING & READY' : 'OFFLINE'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!isRunning ? (
              <button
                disabled={loading}
                onClick={onStart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start All</span>
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop All</span>
              </button>
            )}
          </div>
        </div>

        {/* Server Endpoints list */}
        <div className="space-y-2 mb-5">
          {mockServices.map((srv, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  {srv.icon}
                </div>
                <div>
                  <div className="font-bold text-slate-200">{srv.name}</div>
                  <div className="text-[11px] text-slate-400 font-sans">{srv.desc}</div>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-bold">
                :{srv.port}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            Close Sandbox Panel
          </button>
        </div>

      </div>
    </div>
  );
};

import React from 'react';
import { Radio, Activity, Cpu, Layers, MessageSquare, Gamepad2, Zap } from 'lucide-react';
import { Protocol } from '../types';

interface ProtocolSelectProps {
  selectedProtocol: Protocol;
  onSelect: (p: Protocol) => void;
  disabled: boolean;
}

interface ProtocolMeta {
  id: Protocol;
  name: string;
  badge: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  accent: string;
}

export const ProtocolSelect: React.FC<ProtocolSelectProps> = ({
  selectedProtocol,
  onSelect,
  disabled
}) => {
  const protocols: ProtocolMeta[] = [
    {
      id: 'UDP',
      name: 'UDP Datagrams',
      badge: 'Game Ticks & VoIP',
      tagline: 'Measures Packet Loss, Jitter & Real RTT',
      description: 'Ultra-low-overhead connectionless packets used by game physics and voice chat.',
      icon: <Radio className="w-5 h-5" />,
      accent: 'border-cyan-500/80 bg-cyan-950/20 text-cyan-400'
    },
    {
      id: 'GAME_UDP',
      name: 'Game Netcode (60Hz)',
      badge: 'Multiplayer Sim',
      tagline: 'Tick Synchronization & Player Input Loop',
      description: 'Simulates genuine multiplayer virtual players streaming player movement and receiving world state.',
      icon: <Gamepad2 className="w-5 h-5" />,
      accent: 'border-sky-500/80 bg-sky-950/20 text-sky-400'
    },
    {
      id: 'TCP',
      name: 'TCP Streams',
      badge: 'Stateful Sessions',
      tagline: 'Connection Handshake & Persistent Throughput',
      description: 'Reliable stream connection testing handshake speed, socket persistence, and continuous framing.',
      icon: <Layers className="w-5 h-5" />,
      accent: 'border-blue-500/80 bg-blue-950/20 text-blue-400'
    },
    {
      id: 'HTTP',
      name: 'HTTP / REST APIs',
      badge: 'Web & Auth',
      tagline: 'Request/Sec, Status Codes & Concurrency',
      description: 'Standard web service requests for login APIs, player inventory, and matchmaking endpoints.',
      icon: <Cpu className="w-5 h-5" />,
      accent: 'border-emerald-500/80 bg-emerald-950/20 text-emerald-400'
    },
    {
      id: 'HTTPS',
      name: 'HTTPS / TLS',
      badge: 'Encrypted APIs',
      tagline: 'TLS Cryptographic Handshake & Secure Web',
      description: 'Encrypted HTTPS transactions testing SSL/TLS termination overhead under load.',
      icon: <Activity className="w-5 h-5" />,
      accent: 'border-teal-500/80 bg-teal-950/20 text-teal-400'
    },
    {
      id: 'WEBSOCKET',
      name: 'WebSocket',
      badge: 'Live Matchmaking',
      tagline: 'Persistent Duplex Lobbies & Heartbeats',
      description: 'Bi-directional real-time communication channels for tournament matchmaking and live chat.',
      icon: <MessageSquare className="w-5 h-5" />,
      accent: 'border-purple-500/80 bg-purple-950/20 text-purple-400'
    },
    {
      id: 'GRPC',
      name: 'gRPC & QUIC',
      badge: 'Next-Gen RPC',
      tagline: 'Protobuf & HTTP/3 Transport Verification',
      description: 'Modern microservices transport testing multiplexed framing and transport handshake latency.',
      icon: <Zap className="w-5 h-5" />,
      accent: 'border-amber-500/80 bg-amber-950/20 text-amber-400'
    }
  ];

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-950/60 border border-sky-800 flex items-center justify-center text-sky-400">
            <Radio className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              2. Select Traffic Protocol
            </h2>
            <p className="text-xs text-slate-400">
              Choose the network transport matching the service you want to test.
            </p>
          </div>
        </div>
      </div>

      {/* Protocol Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {protocols.map((p) => {
          const isSelected = selectedProtocol === p.id;
          return (
            <button
              key={p.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(p.id)}
              className={`text-left rounded-xl p-3 border transition-all relative flex flex-col justify-between ${
                isSelected
                  ? `${p.accent} shadow-[0_0_15px_rgba(14,165,233,0.2)] ring-1 ring-cyan-400`
                  : 'bg-[#0a0f1d] border-slate-800 hover:border-slate-700 text-slate-300'
              } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.02]'}`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/10' : 'bg-slate-800/80 text-slate-400'}`}>
                    {p.icon}
                  </div>
                  <span className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                    isSelected ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/60' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {p.badge}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-100 mb-0.5">{p.name}</h3>
                <p className="text-[11px] font-medium text-cyan-400 mb-1.5">{p.tagline}</p>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.description}</p>
              </div>

              {isSelected && (
                <div className="mt-2 text-[10px] font-mono font-semibold text-cyan-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  ACTIVE SELECTION
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

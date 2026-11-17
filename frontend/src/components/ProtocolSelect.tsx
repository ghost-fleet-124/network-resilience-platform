import React from 'react';
import { Globe, Radio, Layers, MessageSquare, Gamepad2 } from 'lucide-react';
import { Protocol } from '../types';

interface ProtocolSelectProps {
  selectedProtocol: Protocol;
  onSelect: (p: Protocol) => void;
  disabled: boolean;
}

interface ProtocolOption {
  id: Protocol;
  title: string;
  category: string;
  description: string;
  icon: React.ReactNode;
}

export const ProtocolSelect: React.FC<ProtocolSelectProps> = ({
  selectedProtocol,
  onSelect,
  disabled
}) => {
  const protocols: ProtocolOption[] = [
    {
      id: 'HTTP_WEBSITE',
      title: 'HTTP / Website Load Test',
      category: 'Web & REST APIs',
      description: 'Full HTTP client engine: GET/POST, headers, keep-alive reuse, JSON/form payloads, status codes.',
      icon: <Globe className="w-4 h-4 text-blue-400" />
    },
    {
      id: 'TCP',
      title: 'TCP Stream Sessions',
      category: 'Transport Layer',
      description: 'Persistent stream sockets testing handshake latency, framed streams, and sustained connection concurrency.',
      icon: <Layers className="w-4 h-4 text-emerald-400" />
    },
    {
      id: 'UDP',
      title: 'UDP Datagrams',
      category: 'Datagram & Voice',
      description: 'Connectionless datagram testing packet loss, RFC 3550 jitter, and high-frequency delivery.',
      icon: <Radio className="w-4 h-4 text-sky-400" />
    },
    {
      id: 'WEBSOCKET',
      title: 'WebSocket Duplex',
      category: 'Real-Time Messaging',
      description: 'Bidirectional persistent channels for real-time lobbies, notifications, and event streams.',
      icon: <MessageSquare className="w-4 h-4 text-purple-400" />
    },
    {
      id: 'GAME_UDP',
      title: 'Game Netcode (60Hz)',
      category: 'Multiplayer Simulation',
      description: 'Tick-synchronized player input streams testing state frame sync and tick loss degradation.',
      icon: <Gamepad2 className="w-4 h-4 text-amber-400" />
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">Step 2</span>
            <h2 className="text-sm font-semibold text-white">Protocol Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select the underlying transport and communication protocol for this test run.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {protocols.map((proto) => {
          const isSelected = selectedProtocol === proto.id || 
            (proto.id === 'HTTP_WEBSITE' && (selectedProtocol === 'HTTP' || selectedProtocol === 'HTTPS'));

          return (
            <button
              key={proto.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(proto.id)}
              className={`text-left p-3 rounded-md border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-blue-500/80 ring-1 ring-blue-500/40 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 text-slate-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded ${isSelected ? 'bg-slate-700 text-blue-400' : 'bg-slate-900 text-slate-400'}`}>
                    {proto.icon}
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold">{proto.title}</h3>
                    <span className="text-[10px] text-slate-400">{proto.category}</span>
                  </div>
                </div>
                {isSelected && (
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                )}
              </div>
              <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                {proto.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

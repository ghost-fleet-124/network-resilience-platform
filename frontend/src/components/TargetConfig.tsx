import React, { useState, useEffect } from 'react';
import { Globe, ShieldCheck, ShieldAlert, Sparkles, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Protocol } from '../types';

interface TargetConfigProps {
  host: string;
  setHost: (h: string) => void;
  port: number;
  setPort: (p: number) => void;
  protocol: Protocol;
  setProtocol: (p: Protocol) => void;
  isTesting: boolean;
}

export const TargetConfig: React.FC<TargetConfigProps> = ({
  host,
  setHost,
  port,
  setPort,
  protocol,
  setProtocol,
  isTesting,
}) => {
  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    authorized: boolean;
    scope: string;
    message: string;
  }>({
    loading: false,
    authorized: true,
    scope: 'LOCAL_SANDBOX',
    message: 'Local endpoint authorized for testing.'
  });

  // Verify target authorization whenever host or port changes
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      if (!host) return;
      setAuthStatus(prev => ({ ...prev, loading: true }));
      try {
        const res = await fetch('/api/targets/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ host, port, protocol })
        });
        const data = await res.json();
        if (!cancelled) {
          setAuthStatus({
            loading: false,
            authorized: data.is_authorized,
            scope: data.scope,
            message: data.message
          });
        }
      } catch (e) {
        if (!cancelled) {
          setAuthStatus({
            loading: false,
            authorized: false,
            scope: 'UNVERIFIED',
            message: 'Could not contact verification gateway.'
          });
        }
      }
    }

    const timer = setTimeout(verify, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [host, port, protocol]);

  const isWebsiteMode = protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS';

  // Handle URL change with auto-parsing
  const handleHostOrUrlChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const u = new URL(trimmed);
        setHost(u.hostname);
        if (u.port) {
          setPort(parseInt(u.port));
        } else if (u.protocol === 'https:') {
          setPort(443);
          if (protocol !== 'HTTP_WEBSITE') setProtocol('HTTPS');
        } else if (u.protocol === 'http:') {
          setPort(80);
          if (protocol !== 'HTTP_WEBSITE') setProtocol('HTTP');
        }
        return;
      } catch {
        // Fall through to standard host assignment
      }
    }
    setHost(trimmed);
  };

  // Quick sandbox autofill presets
  const applySandboxTarget = (targetHost: string, targetPort: number, proto: Protocol) => {
    if (isTesting) return;
    setHost(targetHost);
    setPort(targetPort);
    setProtocol(proto);
  };

  return (
    <div className="bg-cyber-card border border-cyber-border rounded-2xl p-5 shadow-lg relative overflow-hidden">
      
      {/* Top Banner */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-800 flex items-center justify-center text-cyan-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              1. Target Server Configuration
            </h2>
            <p className="text-xs text-slate-400">
              Enter the server IP address and listening port you are authorized to test.
            </p>
          </div>
        </div>

        {/* Selected target preview badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono">
          <span className="text-slate-400">Active Target:</span>
          <span className="text-cyan-400 font-bold">{protocol.toLowerCase()}://{host || '...'}:{port}</span>
        </div>
      </div>

      {/* Input Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Host / URL Input */}
        <div className="md:col-span-8">
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5 flex items-center justify-between">
            <span>{isWebsiteMode ? 'Website URL or Hostname' : 'Server IP Address or Hostname'}</span>
            <span className="text-slate-500 font-sans normal-case text-[11px]">
              {isWebsiteMode ? 'e.g. https://mywebsite.com/api or 127.0.0.1' : 'e.g. 127.0.0.1 or api.mygameserver.com'}
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={isTesting}
              value={host}
              onChange={(e) => handleHostOrUrlChange(e.target.value)}
              placeholder={isWebsiteMode ? "https://example.com or 127.0.0.1" : "127.0.0.1"}
              className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 transition-all outline-none"
            />
            {authStatus.authorized ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
            )}
          </div>
        </div>

        {/* Port Input */}
        <div className="md:col-span-4">
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5 flex items-center justify-between">
            <span>Port Number</span>
            <span className="text-slate-500 font-sans normal-case text-[11px]">1 - 65535</span>
          </label>
          <input
            type="number"
            disabled={isTesting}
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 80)}
            placeholder={isWebsiteMode ? "443" : "9001"}
            className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 transition-all outline-none"
          />
        </div>

      </div>

      {/* Target Authorization Scope & Verification Note */}
      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-cyber-border text-xs">
        <div className="flex items-center gap-2">
          {authStatus.authorized ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          )}
          <span className={`font-mono ${authStatus.authorized ? 'text-emerald-300' : 'text-amber-300'}`}>
            [{authStatus.scope}] {authStatus.message}
          </span>
        </div>

        {/* Quick sandbox 1-click presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-400 font-mono">Quick Sandbox:</span>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9003, 'HTTP_WEBSITE')}
            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-700 transition-colors flex items-center gap-1"
          >
            <Globe className="w-3 h-3" /> Mock Website (9003)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9005, 'GAME_UDP')}
            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-[11px] font-mono border border-cyan-800 transition-colors flex items-center gap-1"
          >
            <Sparkles className="w-2.5 h-2.5" /> 60Hz Game (9005)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9001, 'UDP')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            UDP Tick (9001)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9002, 'TCP')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            TCP Echo (9002)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9004, 'WEBSOCKET')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-mono border border-slate-700 transition-colors"
          >
            WS Lobby (9004)
          </button>
        </div>
      </div>

    </div>
  );
};

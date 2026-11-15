import React, { useState, useEffect, useMemo } from 'react';
import { Globe, ShieldCheck, ShieldAlert, Sparkles, CheckCircle, AlertCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { Protocol } from '../types';

interface TargetConfigProps {
  host: string;
  setHost: (h: string) => void;
  port: number;
  setPort: (p: number) => void;
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  protocol: Protocol;
  setProtocol: (p: Protocol) => void;
  isTesting: boolean;
}

export const TargetConfig: React.FC<TargetConfigProps> = ({
  host,
  setHost,
  port,
  setPort,
  targetUrl,
  setTargetUrl,
  protocol,
  setProtocol,
  isTesting,
}) => {
  const isWebsiteMode = protocol === 'HTTP_WEBSITE';

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

  // Real-time URL validation for Website mode
  const urlValidation = useMemo(() => {
    if (!isWebsiteMode) return { valid: true, error: null };
    const raw = (targetUrl || '').trim();
    if (!raw) {
      return { valid: false, error: 'Target URL cannot be empty.' };
    }
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      return { valid: false, error: 'Target URL must start with http:// or https:// (e.g. http://127.0.0.1:9003/)' };
    }
    try {
      const u = new URL(raw);
      if (!u.hostname) {
        return { valid: false, error: 'Target URL must contain a valid hostname or IP address.' };
      }
      return { valid: true, error: null, parsed: u };
    } catch {
      return { valid: false, error: 'Malformed URL syntax. Please enter a valid URL.' };
    }
  }, [isWebsiteMode, targetUrl]);

  // Sync host and port from targetUrl when in Website mode
  useEffect(() => {
    if (isWebsiteMode && urlValidation.valid && urlValidation.parsed) {
      const u = urlValidation.parsed;
      setHost(u.hostname);
      const parsedPort = u.port ? parseInt(u.port) : (u.protocol === 'https:' ? 443 : 80);
      setPort(parsedPort);
    }
  }, [isWebsiteMode, urlValidation, setHost, setPort]);

  // Verify target authorization whenever host, port, or targetUrl changes
  useEffect(() => {
    let cancelled = false;
    async function verify() {
      const effectiveHost = host || (urlValidation.parsed ? urlValidation.parsed.hostname : '');
      const effectivePort = port || (urlValidation.parsed ? (urlValidation.parsed.port ? parseInt(urlValidation.parsed.port) : 80) : 80);
      if (!effectiveHost) return;

      setAuthStatus(prev => ({ ...prev, loading: true }));
      try {
        const res = await fetch('/api/targets/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            host: effectiveHost,
            port: effectivePort,
            protocol,
            target_url: isWebsiteMode ? targetUrl : undefined
          })
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

    const timer = setTimeout(verify, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [host, port, protocol, targetUrl, isWebsiteMode, urlValidation]);

  // Quick sandbox autofill presets
  const applySandboxTarget = (targetHost: string, targetPort: number, proto: Protocol, url?: string) => {
    if (isTesting) return;
    setHost(targetHost);
    setPort(targetPort);
    setProtocol(proto);
    if (url) {
      setTargetUrl(url);
    } else if (proto === 'HTTP_WEBSITE') {
      setTargetUrl(`http://${targetHost}:${targetPort}/`);
    }
  };

  const handleUrlChange = (val: string) => {
    setTargetUrl(val);
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
              1. Target {isWebsiteMode ? 'Website' : 'Server'} Configuration
            </h2>
            <p className="text-xs text-slate-400">
              {isWebsiteMode
                ? 'Enter the full website URL (HTTP/HTTPS) of your authorized target web server or API.'
                : 'Enter the server IP address and listening port you are authorized to test.'}
            </p>
          </div>
        </div>

        {/* Selected target preview badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs font-mono">
          <span className="text-slate-400">Target:</span>
          {isWebsiteMode ? (
            <span className="text-emerald-400 font-bold truncate max-w-xs">{targetUrl || 'http://...'}</span>
          ) : (
            <span className="text-cyan-400 font-bold">{protocol.toLowerCase()}://{host || '...'}:{port}</span>
          )}
        </div>
      </div>

      {/* Input Section */}
      {isWebsiteMode ? (
        /* HTTP Website Load Testing: Single Full-Width URL Input without Redundant Port */
        <div className="space-y-2">
          <label className="block text-xs font-mono text-slate-300 uppercase flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Target Website Full URL (HTTP / HTTPS)
            </span>
            <span className="text-slate-500 font-sans normal-case text-[11px]">
              Port & path automatically parsed from URL
            </span>
          </label>
          <div className="relative">
            <input
              type="text"
              disabled={isTesting}
              value={targetUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="http://127.0.0.1:9003/ or https://example.com/api"
              className={`w-full bg-[#0a0f1d] border ${
                urlValidation.valid ? 'border-slate-700 focus:border-emerald-500' : 'border-rose-600 focus:border-rose-500'
              } focus:ring-1 focus:ring-emerald-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 transition-all outline-none`}
            />
            {urlValidation.valid ? (
              authStatus.authorized ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
              )
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 absolute right-3.5 top-3" />
            )}
          </div>

          {/* Validation Error Message */}
          {!urlValidation.valid && urlValidation.error && (
            <div className="flex items-center gap-1.5 text-rose-400 text-xs font-mono px-1">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{urlValidation.error}</span>
            </div>
          )}

          {/* Parsed Endpoint Preview */}
          {urlValidation.valid && urlValidation.parsed && (
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 px-1">
              <span>Scheme: <strong className="text-slate-200">{urlValidation.parsed.protocol.replace(':', '').toUpperCase()}</strong></span>
              <span>Host: <strong className="text-slate-200">{urlValidation.parsed.hostname}</strong></span>
              <span>Port: <strong className="text-slate-200">{urlValidation.parsed.port || (urlValidation.parsed.protocol === 'https:' ? '443' : '80')}</strong></span>
              <span>Path: <strong className="text-slate-200">{urlValidation.parsed.pathname || '/'}</strong></span>
            </div>
          )}
        </div>
      ) : (
        /* Server Protocols (UDP, TCP, WebSocket, Game UDP): Host + Port Inputs */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8">
            <label className="block text-xs font-mono text-slate-300 uppercase mb-1.5 flex items-center justify-between">
              <span>Server IP Address or Hostname</span>
              <span className="text-slate-500 font-sans normal-case text-[11px]">
                e.g. 127.0.0.1 or api.mygameserver.com
              </span>
            </label>
            <div className="relative">
              <input
                type="text"
                disabled={isTesting}
                value={host}
                onChange={(e) => setHost(e.target.value.trim())}
                placeholder="127.0.0.1"
                className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 transition-all outline-none"
              />
              {authStatus.authorized ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400 absolute right-3.5 top-3" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-amber-400 absolute right-3.5 top-3" />
              )}
            </div>
          </div>

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
              placeholder="9001"
              className="w-full bg-[#0a0f1d] border border-slate-700 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-100 placeholder-slate-600 transition-all outline-none"
            />
          </div>
        </div>
      )}

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
            onClick={() => applySandboxTarget('127.0.0.1', 9003, 'HTTP_WEBSITE', 'http://127.0.0.1:9003/')}
            className="px-2 py-0.5 rounded bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-700 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Globe className="w-3 h-3" /> Mock Website (9003)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9005, 'GAME_UDP')}
            className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 text-cyan-200 text-[11px] font-mono border border-cyan-800 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-2.5 h-2.5" /> 60Hz Game (9005)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9001, 'UDP')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            UDP Tick (9001)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9002, 'TCP')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            TCP Echo (9002)
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => applySandboxTarget('127.0.0.1', 9004, 'WEBSOCKET')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 text-[11px] font-mono border border-slate-700 transition-colors cursor-pointer"
          >
            WS Lobby (9004)
          </button>
        </div>
      </div>

    </div>
  );
};

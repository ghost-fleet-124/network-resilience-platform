import React, { useState, useEffect, useMemo } from 'react';
import { Globe, Server, ShieldCheck, ShieldAlert, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
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
  onOpenScopeModal?: () => void;
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
  onOpenScopeModal
}) => {
  const isWebsiteMode = protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS';
  const [configMode, setConfigMode] = useState<'url' | 'hostPort'>(
    protocol === 'HTTP_WEBSITE' ? 'url' : 'hostPort'
  );

  const [authStatus, setAuthStatus] = useState<{
    loading: boolean;
    authorized: boolean;
    scope: string;
    scope_name?: string;
    authorized_by?: string;
    expires_at?: number;
    message: string;
    rejection_reason?: string;
  }>({
    loading: false,
    authorized: true,
    scope: 'LOCAL_SANDBOX',
    message: 'Local lab target authorized for testing.'
  });

  // URL parsing & validation
  const urlValidation = useMemo(() => {
    if (configMode !== 'url') return { valid: true, error: null };
    const raw = (targetUrl || '').trim();
    if (!raw) return { valid: false, error: 'Target URL cannot be empty.' };
    if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
      return { valid: false, error: 'URL must begin with http:// or https:// (e.g. http://127.0.0.1:9003/)' };
    }
    try {
      const u = new URL(raw);
      if (!u.hostname) return { valid: false, error: 'URL must include a valid hostname or IP address.' };
      return { valid: true, error: null, parsed: u };
    } catch {
      return { valid: false, error: 'Invalid URL syntax.' };
    }
  }, [configMode, targetUrl]);

  // Sync host & port from targetUrl
  useEffect(() => {
    if (configMode === 'url' && urlValidation.valid && urlValidation.parsed) {
      const u = urlValidation.parsed;
      setHost(u.hostname);
      const parsedPort = u.port ? parseInt(u.port) : (u.protocol === 'https:' ? 443 : 80);
      setPort(parsedPort);
    }
  }, [configMode, urlValidation, setHost, setPort]);

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
            target_url: configMode === 'url' ? targetUrl : undefined
          })
        });
        const data = await res.json();
        if (!cancelled) {
          setAuthStatus({
            loading: false,
            authorized: Boolean(data.is_authorized),
            scope: data.scope || 'UNKNOWN',
            scope_name: data.scope_name,
            authorized_by: data.authorized_by,
            expires_at: data.expires_at,
            message: data.message || '',
            rejection_reason: data.rejection_reason
          });
        }
      } catch (err: any) {
        if (!cancelled) {
          setAuthStatus({
            loading: false,
            authorized: false,
            scope: 'ERROR',
            message: 'Unable to communicate with authorization service.'
          });
        }
      }
    }

    const timer = setTimeout(verify, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [host, port, targetUrl, protocol, configMode, urlValidation]);

  // Quick preset targets
  const handleQuickPreset = (preset: { url?: string; host?: string; port?: number; proto: Protocol }) => {
    if (preset.url) {
      setConfigMode('url');
      setTargetUrl(preset.url);
      setProtocol(preset.proto);
    } else if (preset.host && preset.port) {
      setConfigMode('hostPort');
      setHost(preset.host);
      setPort(preset.port);
      setProtocol(preset.proto);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
      
      {/* Card Header & Configuration Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 font-mono">Step 1</span>
            <h2 className="text-sm font-semibold text-white">Target Infrastructure & Scope</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Specify the destination URL or host for resilience and load verification.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="inline-flex p-0.5 rounded-md bg-slate-800 border border-slate-700 text-xs">
          <button
            type="button"
            disabled={isTesting}
            onClick={() => {
              setConfigMode('url');
              if (protocol !== 'HTTP_WEBSITE' && protocol !== 'HTTP' && protocol !== 'HTTPS') {
                setProtocol('HTTP_WEBSITE');
              }
            }}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              configMode === 'url'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            Website / URL
          </button>
          <button
            type="button"
            disabled={isTesting}
            onClick={() => setConfigMode('hostPort')}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              configMode === 'hostPort'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5 text-slate-400" />
            Host & Port
          </button>
        </div>
      </div>

      {/* Target Input Section */}
      {configMode === 'url' ? (
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Target Destination URL
          </label>
          <div className="relative">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              disabled={isTesting}
              placeholder="https://example.com/api/v1/search or http://127.0.0.1:9003/"
              className={`w-full bg-slate-950 border px-3 py-2 text-xs font-mono text-white rounded-md placeholder-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                urlValidation.valid
                  ? 'border-slate-700 focus:border-blue-500 focus:ring-blue-500'
                  : 'border-rose-700 focus:border-rose-500 focus:ring-rose-500'
              } disabled:opacity-50`}
            />
          </div>
          {urlValidation.error && (
            <p className="text-[11px] text-rose-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {urlValidation.error}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Host / IP Address / Domain
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              disabled={isTesting}
              placeholder="127.0.0.1 or api.staging.example.com"
              className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Port
            </label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(parseInt(e.target.value) || 80)}
              disabled={isTesting}
              min={1}
              max={65535}
              placeholder="80, 443, 9001"
              className="w-full bg-slate-950 border border-slate-700 px-3 py-2 text-xs font-mono text-white rounded-md placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
          </div>
        </div>
      )}

      {/* Quick Targets / Presets */}
      <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
        <span className="text-[11px] text-slate-400">Quick Targets:</span>
        <button
          type="button"
          onClick={() => handleQuickPreset({ url: 'http://127.0.0.1:9003/search', proto: 'HTTP_WEBSITE' })}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
        >
          Mock HTTP (9003)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset({ url: 'https://api.staging.apexgaming.net/v1/health', proto: 'HTTP_WEBSITE' })}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
        >
          Staging Scope (Apex)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset({ host: '127.0.0.1', port: 9001, proto: 'UDP' })}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
        >
          Mock UDP (9001)
        </button>
        <button
          type="button"
          onClick={() => handleQuickPreset({ host: '127.0.0.1', port: 9002, proto: 'TCP' })}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[11px] font-mono transition-colors cursor-pointer"
        >
          Mock TCP (9002)
        </button>
      </div>

      {/* Target Authorization Scope Card */}
      <div className={`rounded-md p-3 border text-xs transition-colors ${
        authStatus.authorized
          ? 'bg-slate-950/80 border-slate-800'
          : 'bg-rose-950/20 border-rose-900/60'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            {authStatus.authorized ? (
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`font-semibold ${authStatus.authorized ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {authStatus.authorized ? 'Target Covered by Authorized Scope' : 'Target Authorization Required'}
                </span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                  {authStatus.scope}
                </span>
                {authStatus.scope_name && (
                  <span className="text-[11px] text-slate-400">
                    &bull; {authStatus.scope_name}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400">
                {authStatus.message}
              </p>

              {authStatus.rejection_reason && (
                <p className="text-[11px] text-rose-300/90 font-mono mt-1">
                  Reason: {authStatus.rejection_reason}
                </p>
              )}
            </div>
          </div>

          {onOpenScopeModal && !authStatus.authorized && (
            <button
              type="button"
              onClick={onOpenScopeModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs flex-shrink-0 transition-colors cursor-pointer"
            >
              <span>Scope Registry</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

    </div>
  );
};

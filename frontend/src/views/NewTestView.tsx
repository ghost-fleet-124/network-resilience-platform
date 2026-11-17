import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Pause, 
  RotateCcw, 
  AlertOctagon, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Activity, 
  Globe, 
  Send, 
  Layers, 
  Sliders, 
  Clock, 
  FileText,
  Radio,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { 
  ApprovedScope, 
  Protocol, 
  IntensityPreset, 
  PresetDetails, 
  MetricSnapshot, 
  TestReport,
  TestStatus 
} from '../types';

interface NewTestViewProps {
  scopes: ApprovedScope[];
  presetsInfo: Record<string, PresetDetails>;
  currentSnapshot: MetricSnapshot | null;
  onStartTest: (config: any) => Promise<void>;
  onStopTest: () => Promise<void>;
  onPauseTest: () => Promise<void>;
  onResumeTest: () => Promise<void>;
  onEmergencyStop: () => Promise<void>;
  onNavigateToTargets: () => void;
  onViewReport: (report: TestReport) => void;
  initialTarget?: ApprovedScope | null;
}

export const NewTestView: React.FC<NewTestViewProps> = ({
  scopes,
  presetsInfo,
  currentSnapshot,
  onStartTest,
  onStopTest,
  onPauseTest,
  onResumeTest,
  onEmergencyStop,
  onNavigateToTargets,
  onViewReport,
  initialTarget
}) => {
  // Test Lifecycle Status
  const currentStatus: TestStatus = currentSnapshot ? currentSnapshot.status : 'IDLE';
  const isTesting = currentStatus === 'RUNNING' || currentStatus === 'PAUSED' || currentStatus === 'INITIALIZING';

  // Step 1: Selected Target Scope
  const activeScopes = scopes.filter(s => s.status === 'ACTIVE');
  const [selectedScopeId, setSelectedScopeId] = useState<string>(
    initialTarget?.scope_id || (activeScopes[0]?.scope_id || 'custom')
  );

  // Target Details (Auto-derived from selected scope or custom)
  const [host, setHost] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(9003);
  const [targetUrl, setTargetUrl] = useState<string>('http://127.0.0.1:9003/search');
  const [serverVerification, setServerVerification] = useState<{
    verified: boolean;
    checking: boolean;
    message: string;
  }>({ verified: true, checking: false, message: '' });

  // Step 2: Protocol Selection (Defaults to HTTP_WEBSITE)
  const [protocol, setProtocol] = useState<Protocol>('HTTP_WEBSITE');

  // Step 3: HTTP Method (GET vs POST)
  const [httpMethod, setHttpMethod] = useState<'GET' | 'POST'>('GET');

  // Step 4: Request Details
  const [httpPath, setHttpPath] = useState<string>('/search');
  const [httpQueryParams, setHttpQueryParams] = useState<string>('q=load_test&limit=25');
  const [httpBodyType, setHttpBodyType] = useState<'json' | 'form' | 'raw'>('json');
  const [httpPayload, setHttpPayload] = useState<string>(
    JSON.stringify({ query: 'resilience_test', item_id: 101, quantity: 1 }, null, 2)
  );
  const [httpHeaders, setHttpHeaders] = useState<string>('X-Source: ResilienceOps-Client');
  
  // Advanced HTTP Details (hidden by default)
  const [showAdvancedHttp, setShowAdvancedHttp] = useState(false);
  const [httpTimeoutSec, setHttpTimeoutSec] = useState<number>(5.0);
  const [httpVirtualUsers, setHttpVirtualUsers] = useState<number>(50);
  const [httpFollowRedirects, setHttpFollowRedirects] = useState<boolean>(true);
  const [httpKeepAlive, setHttpKeepAlive] = useState<boolean>(true);

  // Transport fields for non-HTTP
  const [packetSize, setPacketSize] = useState<number>(256);
  const [gameTickHz, setGameTickHz] = useState<number>(60);
  const [wsPath, setWsPath] = useState<string>('/');

  // Step 5: Workload Presets & Timing
  const [intensity, setIntensity] = useState<IntensityPreset>('LOW');
  const [rampUpSec, setRampUpSec] = useState<number>(3);
  const [sustainedSec, setSustainedSec] = useState<number>(15);
  const [rampDownSec, setRampDownSec] = useState<number>(2);

  // Safety confirmation modal for very high intensity
  const [safetyAcknowledged, setSafetyAcknowledged] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  // When initialTarget changes or activeScopes loads, sync selection
  useEffect(() => {
    if (initialTarget) {
      setSelectedScopeId(initialTarget.scope_id);
    } else if (selectedScopeId === 'custom' && activeScopes.length > 0) {
      setSelectedScopeId(activeScopes[0].scope_id);
    }
  }, [initialTarget, scopes]);

  // Synchronize target inputs when selectedScopeId changes
  useEffect(() => {
    if (selectedScopeId === 'custom') {
      return;
    }
    const scope = scopes.find(s => s.scope_id === selectedScopeId);
    if (!scope) return;

    let cleanPattern = scope.target_pattern;
    let defaultPort = scope.allowed_ports && scope.allowed_ports.length > 0 ? scope.allowed_ports[0] : 80;
    
    // Normalize URL vs Host
    if (cleanPattern.startsWith('http://') || cleanPattern.startsWith('https://')) {
      try {
        const u = new URL(cleanPattern);
        setHost(u.hostname);
        const p = u.port ? parseInt(u.port) : (u.protocol === 'https:' ? 443 : 80);
        setPort(p);
        setTargetUrl(cleanPattern.endsWith('/') ? cleanPattern.slice(0, -1) : cleanPattern);
      } catch {
        setHost(cleanPattern);
        setPort(defaultPort);
        setTargetUrl(`http://${cleanPattern}:${defaultPort}`);
      }
    } else {
      setHost(cleanPattern);
      setPort(defaultPort);
      const scheme = defaultPort === 443 ? 'https' : 'http';
      setTargetUrl(`${scheme}://${cleanPattern}:${defaultPort}`);
    }

    // Verify target with backend server
    verifyWithServer(scope.scope_id, cleanPattern, defaultPort);
  }, [selectedScopeId, scopes]);

  const verifyWithServer = async (scopeId: string | undefined, targetHost: string, targetPort: number) => {
    setServerVerification({ verified: false, checking: true, message: 'Verifying with server authorization...' });
    try {
      const res = await fetch('/api/targets/scopes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_id: scopeId && scopeId !== 'custom' ? scopeId : undefined,
          host: targetHost,
          port: targetPort,
          protocol: protocol
        })
      });
      const data = await res.json();
      setServerVerification({
        verified: data.is_authorized,
        checking: false,
        message: data.message || (data.is_authorized ? 'Authorized' : 'Rejection')
      });
    } catch (err: any) {
      setServerVerification({
        verified: false,
        checking: false,
        message: 'Could not contact authorization server.'
      });
    }
  };

  const handleLaunchTest = async () => {
    setSubmissionError(null);
    setStarting(true);

    const isHttp = protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS';
    
    // Parse headers
    const parsedHeaders: Record<string, string> = {};
    if (httpHeaders.trim()) {
      httpHeaders.split('\n').forEach(line => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          const k = line.substring(0, idx).trim();
          const v = line.substring(idx + 1).trim();
          if (k && v) parsedHeaders[k] = v;
        }
      });
    }

    // Effective URL construction
    let effectiveUrl = targetUrl;
    if (isHttp && httpQueryParams.trim() && targetUrl) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      if (!targetUrl.includes(httpQueryParams.trim())) {
        effectiveUrl = `${targetUrl}${separator}${httpQueryParams.trim()}`;
      }
    }

    const payload = {
      target_id: selectedScopeId !== 'custom' ? selectedScopeId : undefined,
      scope_id: selectedScopeId !== 'custom' ? selectedScopeId : undefined,
      host,
      port,
      protocol,
      intensity,
      target_url: isHttp ? effectiveUrl : undefined,
      duration_sec: rampUpSec + sustainedSec + rampDownSec,
      ramp_up_sec: rampUpSec,
      sustained_sec: sustainedSec,
      ramp_down_sec: rampDownSec,
      packet_size_bytes: packetSize,
      game_tick_hz: gameTickHz,
      http_method: httpMethod,
      http_path: isHttp ? httpPath : undefined,
      http_payload: httpPayload,
      http_body_type: httpBodyType,
      http_content_type: httpBodyType === 'json' ? 'application/json' : httpBodyType === 'form' ? 'application/x-www-form-urlencoded' : 'text/plain',
      http_headers: Object.keys(parsedHeaders).length > 0 ? parsedHeaders : undefined,
      http_follow_redirects: httpFollowRedirects,
      http_keep_alive: httpKeepAlive,
      http_timeout_sec: httpTimeoutSec,
      http_virtual_users: httpVirtualUsers,
      ws_path: wsPath,
      safety_confirmation_acknowledged: safetyAcknowledged
    };

    try {
      await onStartTest(payload);
    } catch (err: any) {
      setSubmissionError(err.message || 'Failed to dispatch test');
    } finally {
      setStarting(false);
    }
  };

  const totalDuration = rampUpSec + sustainedSec + rampDownSec;
  const currentPreset = presetsInfo[intensity];
  const targetRps = currentPreset?.target_rps || 80000;
  const isHttp = protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS';

  // Selected Scope Details
  const currentScope = scopes.find(s => s.scope_id === selectedScopeId);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Live Execution Panel if Test is Active */}
      {isTesting && currentSnapshot && (
        <div className="bg-white border-2 border-emerald-500 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <div>
                <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                  Execution In Progress &bull; {currentSnapshot.status}
                </span>
                <p className="text-[11px] font-mono text-slate-500">
                  Target: {host}:{port} &bull; Protocol: {protocol} {isHttp ? `[${httpMethod}]` : ''}
                </p>
              </div>
            </div>

            {/* Live Operational Action Buttons */}
            <div className="flex items-center gap-2">
              {currentSnapshot.status === 'RUNNING' ? (
                <button
                  onClick={onPauseTest}
                  className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={onResumeTest}
                  className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </button>
              )}

              <button
                onClick={onStopTest}
                className="px-3.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5" />
                <span>Graceful Stop</span>
              </button>

              <button
                onClick={onEmergencyStop}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium inline-flex items-center gap-1.5 cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Emergency Abort</span>
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs font-mono text-slate-600 mb-1">
              <span>Elapsed: {currentSnapshot.elapsed_sec.toFixed(1)}s</span>
              <span>Total: {totalDuration}s</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
              <div 
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (currentSnapshot.elapsed_sec / totalDuration) * 100)}%` }}
              />
            </div>
          </div>

          {/* Real Live Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono pt-2">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-sans">Generated RPS</span>
              <div className="text-lg font-bold text-blue-600">
                {currentSnapshot.generated_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-sans">Confirmed RPS</span>
              <div className="text-lg font-bold text-emerald-600">
                {currentSnapshot.received_rps.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-sans">Completed Requests</span>
              <div className="text-lg font-bold text-slate-900">
                {(currentSnapshot.requests_completed || currentSnapshot.total_requests || 0).toLocaleString()}
              </div>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded">
              <span className="text-[10px] text-slate-500 uppercase font-sans">P95 Latency</span>
              <div className="text-lg font-bold text-slate-900">
                {currentSnapshot.p95_latency_ms.toFixed(1)} ms
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-6">
        
        <div>
          <h2 className="text-base font-semibold text-slate-900">Configure Resilience & Load Test</h2>
          <p className="text-xs text-slate-500 mt-1">
            Follow the 7-step guided workflow to benchmark web applications and infrastructure.
          </p>
        </div>

        {submissionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{submissionError}</span>
          </div>
        )}

        {/* STEP 1: Select Approved Target */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">1</span>
              <span>Select Authorized Target *</span>
            </label>
            <button
              onClick={onNavigateToTargets}
              className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage targets</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <select
                value={selectedScopeId}
                onChange={(e) => setSelectedScopeId(e.target.value)}
                disabled={isTesting}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {activeScopes.map(s => (
                  <option key={s.scope_id} value={s.scope_id}>
                    {s.name} ({s.target_pattern}) &bull; Max {s.max_rps_allowed.toLocaleString()} RPS
                  </option>
                ))}
                <option value="custom">-- Direct Custom Host (Requires matching scope) --</option>
              </select>
            </div>

            {/* Target Status Badge */}
            <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                {serverVerification.checking ? (
                  <span className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                ) : serverVerification.verified ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span className={`font-medium ${serverVerification.verified ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {serverVerification.message || (serverVerification.verified ? 'Approved & Verified' : 'Unverified Target')}
                </span>
              </div>
              {currentScope && (
                <span className="text-[11px] font-mono text-slate-500">
                  Cap: {currentScope.max_rps_allowed.toLocaleString()} RPS
                </span>
              )}
            </div>
          </div>

          {/* Direct host input if custom selected */}
          {selectedScopeId === 'custom' && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Target Host (e.g. 127.0.0.1 or www.abes.ac.in)"
                  value={host}
                  onChange={(e) => {
                    setHost(e.target.value);
                    verifyWithServer(undefined, e.target.value, port);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-900"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Port"
                  value={port}
                  onChange={(e) => {
                    const p = parseInt(e.target.value) || 80;
                    setPort(p);
                    verifyWithServer(undefined, host, p);
                  }}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-mono text-slate-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 2: Protocol Selection */}
        <div className="space-y-2 pt-4 border-t border-slate-200">
          <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">2</span>
            <span>Select Protocol *</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { id: 'HTTP_WEBSITE' as Protocol, label: 'HTTP Website', desc: 'Standard Web & APIs' },
              { id: 'TCP' as Protocol, label: 'Raw TCP', desc: 'Socket Connection' },
              { id: 'UDP' as Protocol, label: 'High-Vol UDP', desc: 'Stateless Flood' },
              { id: 'WEBSOCKET' as Protocol, label: 'WebSocket', desc: 'Realtime Bi-di' },
              { id: 'GAME_UDP' as Protocol, label: 'Game Netcode', desc: 'Tick Packet Simulation' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProtocol(p.id)}
                disabled={isTesting}
                className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                  protocol === p.id 
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-semibold' 
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="text-xs">{p.label}</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* STEP 3 & 4: HTTP Method & Request Details (Only when HTTP family) */}
        {isHttp && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {/* Step 3: Method */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">3</span>
                <span>Choose HTTP Method *</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setHttpMethod('GET')}
                  disabled={isTesting}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                    httpMethod === 'GET'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  GET (Read & Query)
                </button>
                <button
                  type="button"
                  onClick={() => setHttpMethod('POST')}
                  disabled={isTesting}
                  className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer border ${
                    httpMethod === 'POST'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  POST (Submit Body / Form)
                </button>
              </div>
            </div>

            {/* Step 4: Request Details */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">4</span>
                <span>Configure Request Details *</span>
              </label>

              {/* Target URL / Endpoint */}
              <div>
                <label className="block text-[11px] text-slate-600 font-medium mb-1">Target URL / Endpoint</label>
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  disabled={isTesting}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* GET Specific Configuration */}
              {httpMethod === 'GET' && (
                <div>
                  <label className="block text-[11px] text-slate-600 font-medium mb-1">
                    URL Query Parameters (appended to URL)
                  </label>
                  <input
                    type="text"
                    value={httpQueryParams}
                    onChange={(e) => setHttpQueryParams(e.target.value)}
                    placeholder="q=resilience_test&limit=25&category=audit"
                    disabled={isTesting}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* POST Specific Configuration */}
              {httpMethod === 'POST' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] text-slate-600 font-medium">Request Payload Body</label>
                    <div className="flex items-center gap-2 text-xs">
                      {(['json', 'form', 'raw'] as const).map(bt => (
                        <button
                          key={bt}
                          type="button"
                          onClick={() => setHttpBodyType(bt)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer border ${
                            httpBodyType === bt 
                              ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold' 
                              : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}
                        >
                          {bt.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    rows={4}
                    value={httpPayload}
                    onChange={(e) => setHttpPayload(e.target.value)}
                    disabled={isTesting}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-md font-mono text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Collapsible Advanced Settings */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvancedHttp(!showAdvancedHttp)}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium flex items-center gap-1 cursor-pointer py-1"
                >
                  {showAdvancedHttp ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showAdvancedHttp ? 'Hide Advanced HTTP Options' : 'Show Advanced HTTP Options (Headers, Concurrency, Keep-Alive)'}</span>
                </button>

                {showAdvancedHttp && (
                  <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-600 mb-1 font-medium">Custom Headers (One per line: Key: Value)</label>
                      <textarea
                        rows={2}
                        value={httpHeaders}
                        onChange={(e) => setHttpHeaders(e.target.value)}
                        placeholder="Authorization: Bearer token&#10;User-Agent: ResilienceTest/1.0"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs font-mono text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-slate-600 mb-1">Timeout (Sec)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={httpTimeoutSec}
                          onChange={(e) => setHttpTimeoutSec(parseFloat(e.target.value) || 5.0)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-600 mb-1">Virtual Users / Conns</label>
                        <input
                          type="number"
                          value={httpVirtualUsers}
                          onChange={(e) => setHttpVirtualUsers(parseInt(e.target.value) || 50)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id="keepalive"
                          checked={httpKeepAlive}
                          onChange={(e) => setHttpKeepAlive(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label htmlFor="keepalive" className="text-slate-700 cursor-pointer">HTTP Keep-Alive</label>
                      </div>
                      <div className="flex items-center gap-2 pt-4">
                        <input
                          type="checkbox"
                          id="redirects"
                          checked={httpFollowRedirects}
                          onChange={(e) => setHttpFollowRedirects(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <label htmlFor="redirects" className="text-slate-700 cursor-pointer">Follow Redirects</label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* STEP 5: Workload Presets & Duration */}
        <div className="space-y-3 pt-4 border-t border-slate-200">
          <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">5</span>
            <span>Configure Workload & Duration *</span>
          </label>

          {/* Intensity Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'LOW' as IntensityPreset, label: 'LOW', rps: '80K RPS', sub: 'Baseline probe' },
              { id: 'MEDIUM' as IntensityPreset, label: 'MEDIUM', rps: '200K RPS', sub: 'Standard audit' },
              { id: 'HIGH' as IntensityPreset, label: 'HIGH', rps: '500K RPS', sub: 'Stress evaluation' },
              { id: 'LARGE' as IntensityPreset, label: 'LARGE', rps: '1.0M RPS', sub: 'High throughput' },
              { id: 'MASSIVE' as IntensityPreset, label: 'MASSIVE', rps: '2.0M RPS', sub: 'Resilience boundary' },
              { id: 'ULTRA_MASSIVE' as IntensityPreset, label: 'ULTRA', rps: '3.0M RPS', sub: 'Cluster multi-node' },
              { id: 'SUPER_MASSIVE' as IntensityPreset, label: 'SUPER', rps: '4.0M RPS', sub: 'Enterprise tier' },
              { id: 'SUPER_ULTRA_MASSIVE' as IntensityPreset, label: 'EXTREME', rps: '5.0M RPS', sub: 'Maximum infrastructure' },
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setIntensity(p.id)}
                disabled={isTesting}
                className={`p-2.5 rounded-md border text-left cursor-pointer transition-colors ${
                  intensity === p.id
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>{p.label}</span>
                  <span className="font-mono text-blue-600">{p.rps}</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{p.sub}</div>
              </button>
            ))}
          </div>

          {/* Timing sliders */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs">
            <div>
              <label className="block text-slate-600 mb-1">Ramp-Up: <span className="font-mono font-bold text-slate-900">{rampUpSec}s</span></label>
              <input
                type="range"
                min={1}
                max={15}
                value={rampUpSec}
                onChange={(e) => setRampUpSec(parseInt(e.target.value))}
                disabled={isTesting}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Sustained: <span className="font-mono font-bold text-slate-900">{sustainedSec}s</span></label>
              <input
                type="range"
                min={5}
                max={60}
                value={sustainedSec}
                onChange={(e) => setSustainedSec(parseInt(e.target.value))}
                disabled={isTesting}
                className="w-full accent-blue-600"
              />
            </div>
            <div>
              <label className="block text-slate-600 mb-1">Ramp-Down: <span className="font-mono font-bold text-slate-900">{rampDownSec}s</span></label>
              <input
                type="range"
                min={1}
                max={10}
                value={rampDownSec}
                onChange={(e) => setRampDownSec(parseInt(e.target.value))}
                disabled={isTesting}
                className="w-full accent-blue-600"
              />
            </div>
          </div>
        </div>

        {/* STEP 6: Review Configuration */}
        <div className="space-y-2 pt-4 border-t border-slate-200">
          <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[11px] font-bold">6</span>
            <span>Review Configuration</span>
          </label>

          <div className="bg-slate-50 border border-slate-200 rounded-md p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Target</span>
              <div className="font-semibold text-slate-900 truncate" title={`${host}:${port}`}>
                {host}:{port}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Protocol & Method</span>
              <div className="font-semibold text-slate-900">
                {protocol} {isHttp ? `[${httpMethod}]` : ''}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Preset / Target Rate</span>
              <div className="font-semibold text-blue-600 font-mono">
                {intensity} ({targetRps.toLocaleString()} RPS)
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase">Total Duration</span>
              <div className="font-semibold text-slate-900 font-mono">
                {totalDuration} seconds
              </div>
            </div>
          </div>
        </div>

        {/* STEP 7: Start Test Action */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmSafety"
              checked={safetyAcknowledged}
              onChange={(e) => setSafetyAcknowledged(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="confirmSafety" className="text-xs text-slate-600 cursor-pointer">
              I certify this is an authorized workload within our private enterprise resilience scope.
            </label>
          </div>

          <button
            type="button"
            onClick={handleLaunchTest}
            disabled={isTesting || starting || !safetyAcknowledged || !serverVerification.verified}
            className="px-6 py-2.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shrink-0"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>{starting ? 'Dispatching Workload...' : 'Start Resilience Test'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};

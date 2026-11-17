import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TargetConfig } from './components/TargetConfig';
import { ProtocolSelect } from './components/ProtocolSelect';
import { HttpMethodConfig } from './components/HttpMethodConfig';
import { IntensitySelect } from './components/IntensitySelect';
import { AdvancedSettings } from './components/AdvancedSettings';
import { ControlBar } from './components/ControlBar';
import { MetricsGrid } from './components/MetricsGrid';
import { LiveCharts } from './components/LiveCharts';
import { PacketStream } from './components/PacketStream';
import { ReportModal } from './components/ReportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { MockServerControl } from './components/MockServerControl';
import { ClusterManagerModal } from './components/ClusterManagerModal';
import { HighIntensityConfirmationModal } from './components/HighIntensityConfirmationModal';
import { ScopeManagerModal } from './components/ScopeManagerModal';
import { TermsModal } from './components/TermsModal';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import { Protocol, IntensityPreset, TestReport, PresetDetails, TestStatus } from './types';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<'console' | 'scopes' | 'reports' | 'cluster'>('console');

  // Target & Protocol State
  const [host, setHost] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(9003);
  const [targetUrl, setTargetUrl] = useState<string>('http://127.0.0.1:9003/search');
  const [protocol, setProtocol] = useState<Protocol>('HTTP_WEBSITE');
  const [intensity, setIntensity] = useState<IntensityPreset>('LOW');

  // HTTP Specific Configuration (Priority 3)
  const [httpMethod, setHttpMethod] = useState<string>('GET');
  const [httpPath, setHttpPath] = useState<string>('/search');
  const [httpQueryParams, setHttpQueryParams] = useState<string>('q=resilience_test&limit=25');
  const [httpBodyType, setBodyType] = useState<'json' | 'form' | 'raw'>('json');
  const [httpPayload, setHttpPayload] = useState<string>(
    JSON.stringify({ query: 'resilience_test', item_id: 101, quantity: 1 }, null, 2)
  );
  const [httpHeaders, setHttpHeaders] = useState<string>('X-Source: ResilienceOps-Client');
  const [httpFollowRedirects, setHttpFollowRedirects] = useState<boolean>(true);
  const [httpKeepAlive, setHttpKeepAlive] = useState<boolean>(true);
  const [httpTimeoutSec, setHttpTimeoutSec] = useState<number>(5.0);
  const [httpVirtualUsers, setHttpVirtualUsers] = useState<number>(50);

  // Workload Timings (Ramp-up, Sustained, Ramp-down)
  const [rampUpSec, setRampUpSec] = useState<number>(3);
  const [sustainedSec, setSustainedSec] = useState<number>(20);
  const [rampDownSec, setRampDownSec] = useState<number>(3);

  // Transport Specific Configuration
  const [packetSize, setPacketSize] = useState<number>(256);
  const [gameTickHz, setGameTickHz] = useState<number>(60);
  const [wsPath, setWsPath] = useState<string>('/');
  const [errorThreshold, setErrorThreshold] = useState<number>(50);
  const [latencyThreshold, setLatencyThreshold] = useState<number>(5000);

  // Platform Presets Info & Cluster State
  const [presetsInfo, setPresetsInfo] = useState<Record<string, PresetDetails>>({});
  const [clusterCapacityRps, setClusterCapacityRps] = useState<number>(100000);

  // Mock Sandbox State
  const [mockRunning, setMockRunning] = useState<boolean>(true);
  const [mockPorts, setMockPorts] = useState<Record<string, number>>({});
  const [mockLoading, setMockLoading] = useState<boolean>(false);

  // Modals
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [mockModalOpen, setMockModalOpen] = useState<boolean>(false);
  const [clusterModalOpen, setClusterModalOpen] = useState<boolean>(false);
  const [scopeModalOpen, setScopeModalOpen] = useState<boolean>(false);
  const [termsModalOpen, setTermsModalOpen] = useState<boolean>(false);
  const [privacyModalOpen, setPrivacyModalOpen] = useState<boolean>(false);
  const [confirmHighIntensityOpen, setConfirmHighIntensityOpen] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<TestReport | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Callback when a test completes
  const handleTestFinished = useCallback((report: TestReport) => {
    setActiveReport(report);
    setNotification({
      type: 'success',
      message: `Test run finished with SLA verdict: ${report.sla_verdict} (Peak Achieved: ${report.peak_generated_rps.toLocaleString()} RPS)`
    });
  }, []);

  // Telemetry Hook
  const { currentSnapshot, chartHistory, isConnected, clearHistory } = useLiveTelemetry(handleTestFinished);
  const currentStatus: TestStatus = currentSnapshot ? currentSnapshot.status : 'IDLE';
  const isTesting = currentStatus === 'RUNNING' || currentStatus === 'PAUSED' || currentStatus === 'INITIALIZING';

  // Fetch presets metadata and cluster info on mount
  useEffect(() => {
    fetch('/api/targets/presets')
      .then((res) => res.json())
      .then((data) => setPresetsInfo(data))
      .catch((err) => console.error('Failed to load presets:', err));

    fetch('/api/targets/mock-status')
      .then((res) => res.json())
      .then((data) => {
        setMockRunning(data.is_running);
        setMockPorts(data.ports || {});
      })
      .catch((err) => console.error('Failed to load mock status:', err));

    fetch('/api/targets/cluster/nodes')
      .then((res) => res.json())
      .then((data) => setClusterCapacityRps(data.total_capacity_rps || 100000))
      .catch((err) => console.error('Failed to load cluster:', err));
  }, []);

  // Auto-sync port if protocol or localhost changes
  const handleSelectProtocol = (p: Protocol) => {
    setProtocol(p);
    if (p === 'HTTP_WEBSITE' || p === 'HTTP' || p === 'HTTPS') {
      if (!targetUrl || targetUrl.trim() === '') {
        setTargetUrl('http://127.0.0.1:9003/search');
      }
      try {
        const u = new URL(targetUrl || 'http://127.0.0.1:9003/search');
        setHost(u.hostname);
        setPort(u.port ? parseInt(u.port) : (u.protocol === 'https:' ? 443 : 80));
      } catch {
        setHost('127.0.0.1');
        setPort(9003);
      }
    } else if (host === '127.0.0.1' || host === 'localhost') {
      if (p === 'UDP') setPort(9001);
      else if (p === 'TCP') setPort(9002);
      else if (p === 'WEBSOCKET') setPort(9004);
      else if (p === 'GAME_UDP') setPort(9005);
    }
  };

  // Launch pre-flight check
  const handleInitiateStartTest = () => {
    const preset = presetsInfo[intensity];
    const targetRps = preset?.target_rps || 80000;
    const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0';

    if (targetRps >= 500000 && !isLocal) {
      setConfirmHighIntensityOpen(true);
      return;
    }

    executeStartTest(true);
  };

  // Start test API call
  const executeStartTest = async (safetyConfirmed: boolean) => {
    setNotification(null);
    setIsStarting(true);
    clearHistory();

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

    const isHttp = protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS';
    
    // Construct effective URL if query parameters are set
    let effectiveUrl = targetUrl;
    if (isHttp && httpQueryParams.trim() && targetUrl) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      if (!targetUrl.includes(httpQueryParams.trim())) {
        effectiveUrl = `${targetUrl}${separator}${httpQueryParams.trim()}`;
      }
    }

    const payload = {
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
      safety_confirmation_acknowledged: safetyConfirmed,
      emergency_threshold_error_pct: errorThreshold,
      emergency_threshold_latency_ms: latencyThreshold
    };

    try {
      const res = await fetch('/api/tests/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Failed to start workload');
      }
      setNotification({
        type: 'success',
        message: `Workload dispatched against ${host}:${port} (${protocol} ${isHttp ? `[${httpMethod}]` : ''} - Target: ${data.target_rps?.toLocaleString()} RPS)`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error launching workload'
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Operational Control Handlers
  const handleStopTest = async () => {
    try {
      const res = await fetch('/api/tests/stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) setActiveReport(data.report);
    } catch (err: any) {
      console.error('Stop error:', err);
    }
  };

  const handlePauseTest = async () => {
    try {
      await fetch('/api/tests/pause', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleResumeTest = async () => {
    try {
      await fetch('/api/tests/resume', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      const res = await fetch('/api/tests/emergency-stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) setActiveReport(data.report);
      setNotification({
        type: 'error',
        message: 'EMERGENCY SHUTDOWN: All worker sockets terminated immediately.'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Mock server management
  const handleStartMocks = async () => {
    setMockLoading(true);
    try {
      const res = await fetch('/api/targets/mock-start', { method: 'POST' });
      const data = await res.json();
      setMockRunning(true);
      setMockPorts(data.ports || {});
    } finally {
      setMockLoading(false);
    }
  };

  const handleStopMocks = async () => {
    setMockLoading(true);
    try {
      await fetch('/api/targets/mock-stop', { method: 'POST' });
      setMockRunning(false);
    } finally {
      setMockLoading(false);
    }
  };

  const totalCalculatedDuration = rampUpSec + sustainedSec + rampDownSec;
  const isHttpFamily = protocol === 'HTTP' || protocol === 'HTTPS' || protocol === 'HTTP_WEBSITE';

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      
      {/* Top Enterprise Header */}
      <Header
        isConnected={isConnected}
        snapshot={currentSnapshot}
        onOpenHistory={() => setHistoryOpen(true)}
        onToggleMockModal={() => setMockModalOpen(true)}
        onToggleClusterModal={() => setClusterModalOpen(true)}
        onToggleScopeModal={() => setScopeModalOpen(true)}
        onToggleTermsModal={() => setTermsModalOpen(true)}
        onTogglePrivacyModal={() => setPrivacyModalOpen(true)}
        mockRunning={mockRunning}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Alerts / Notification Bar */}
        {notification && (
          <div
            className={`p-3 rounded-md border flex items-center justify-between text-xs transition-colors ${
              notification.type === 'error'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white cursor-pointer ml-4 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Guided Two-Column Enterprise Console Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          
          {/* Left Column (5 Cols on large): Guided Configuration & Workload Controls */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* Step 1: Target Infrastructure & Scope Verification */}
            <TargetConfig
              host={host}
              setHost={setHost}
              port={port}
              setPort={setPort}
              targetUrl={targetUrl}
              setTargetUrl={setTargetUrl}
              protocol={protocol}
              setProtocol={handleSelectProtocol}
              isTesting={isTesting}
              onOpenScopeModal={() => setScopeModalOpen(true)}
            />

            {/* Step 2: Protocol Selection */}
            <ProtocolSelect
              selectedProtocol={protocol}
              onSelect={handleSelectProtocol}
              disabled={isTesting}
            />

            {/* Step 3: HTTP Method & Payload Specification (Front and Center for HTTP/Web) */}
            {isHttpFamily && (
              <HttpMethodConfig
                method={httpMethod}
                setMethod={setHttpMethod}
                path={httpPath}
                setPath={setHttpPath}
                payload={httpPayload}
                setPayload={setHttpPayload}
                bodyType={httpBodyType}
                setBodyType={setBodyType}
                headers={httpHeaders}
                setHeaders={setHttpHeaders}
                queryParams={httpQueryParams}
                setQueryParams={setHttpQueryParams}
                timeoutSec={httpTimeoutSec}
                setTimeoutSec={setHttpTimeoutSec}
                virtualUsers={httpVirtualUsers}
                setVirtualUsers={setHttpVirtualUsers}
                disabled={isTesting}
              />
            )}

            {/* Step 4: Workload Intensity & Numerical RPS Presets */}
            <IntensitySelect
              selectedIntensity={intensity}
              onSelect={setIntensity}
              disabled={isTesting}
              presetsInfo={presetsInfo}
            />

            {/* Step 5: Advanced Timing & Protocol Tuning (Collapsed by Default) */}
            <AdvancedSettings
              protocol={protocol}
              packetSize={packetSize}
              setPacketSize={setPacketSize}
              gameTickHz={gameTickHz}
              setGameTickHz={setGameTickHz}
              httpFollowRedirects={httpFollowRedirects}
              setHttpFollowRedirects={setHttpFollowRedirects}
              httpKeepAlive={httpKeepAlive}
              setHttpKeepAlive={setHttpKeepAlive}
              wsPath={wsPath}
              setWsPath={setWsPath}
              errorThreshold={errorThreshold}
              setErrorThreshold={setErrorThreshold}
              latencyThreshold={latencyThreshold}
              setLatencyThreshold={setLatencyThreshold}
              rampUpSec={rampUpSec}
              setRampUpSec={setRampUpSec}
              sustainedSec={sustainedSec}
              setSustainedSec={setSustainedSec}
              rampDownSec={rampDownSec}
              setRampDownSec={setRampDownSec}
              disabled={isTesting}
            />

            {/* Primary Action Control Bar */}
            <ControlBar
              status={currentStatus}
              elapsedSec={currentSnapshot?.elapsed_sec || 0}
              durationSec={totalCalculatedDuration}
              onStart={handleInitiateStartTest}
              onStop={handleStopTest}
              onPause={handlePauseTest}
              onResume={handleResumeTest}
              onEmergencyStop={handleEmergencyStop}
              isStarting={isStarting}
            />

          </div>

          {/* Right Column (7 Cols on large): Live Observability, Metrics & Telemetry Grid */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Real-time KPI Grid & Lifecycle Accounting */}
            <MetricsGrid snapshot={currentSnapshot} />

            {/* Live Time-Series Charts */}
            <LiveCharts history={chartHistory} />

            {/* System Resources & Execution Topology */}
            <PacketStream
              snapshot={currentSnapshot}
              host={host}
              port={port}
              protocol={protocol}
            />

          </div>

        </div>

      </main>

      {/* Enterprise Minimal Footer */}
      <footer className="border-t border-slate-800 py-3.5 px-6 text-center text-xs text-slate-500 font-mono mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setTermsModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Acceptable Use Policy
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setPrivacyModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Privacy Policy & Data Retention
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setScopeModalOpen(true)}
              className="text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              Authorized Scope Registry
            </button>
          </div>
          <div>
            ResilienceOps Platform &bull; Scalable up to 5,000,000 Requested RPS &bull; 2026
          </div>
        </div>
      </footer>

      {/* Modal Dialogs */}
      <ScopeManagerModal
        isOpen={scopeModalOpen}
        onClose={() => setScopeModalOpen(false)}
        onApplyTarget={(val) => {
          if (protocol === 'HTTP_WEBSITE' || protocol === 'HTTP' || protocol === 'HTTPS') {
            setTargetUrl(val.startsWith('http') ? val : `https://${val}/`);
          } else {
            setHost(val.replace('https://', '').replace('http://', '').split('/')[0]);
          }
        }}
      />

      <TermsModal
        isOpen={termsModalOpen}
        onClose={() => setTermsModalOpen(false)}
      />

      <PrivacyPolicyModal
        isOpen={privacyModalOpen}
        onClose={() => setPrivacyModalOpen(false)}
      />

      <ReportModal
        report={activeReport}
        onClose={() => setActiveReport(null)}
      />

      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onSelectReport={(rep) => setActiveReport(rep)}
      />

      <MockServerControl
        isOpen={mockModalOpen}
        onClose={() => setMockModalOpen(false)}
        isRunning={mockRunning}
        ports={mockPorts}
        onStart={handleStartMocks}
        onStop={handleStopMocks}
        loading={mockLoading}
      />

      <ClusterManagerModal
        isOpen={clusterModalOpen}
        onClose={() => setClusterModalOpen(false)}
      />

      <HighIntensityConfirmationModal
        isOpen={confirmHighIntensityOpen}
        onClose={() => setConfirmHighIntensityOpen(false)}
        onConfirm={() => executeStartTest(true)}
        targetHost={host}
        targetPort={port}
        intensity={intensity}
        presetInfo={presetsInfo[intensity]}
        clusterCapacityRps={clusterCapacityRps}
      />

    </div>
  );
}

export default App;

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TargetConfig } from './components/TargetConfig';
import { ProtocolSelect } from './components/ProtocolSelect';
import { IntensitySelect } from './components/IntensitySelect';
import { ControlBar } from './components/ControlBar';
import { MetricsGrid } from './components/MetricsGrid';
import { LiveCharts } from './components/LiveCharts';
import { PacketStream } from './components/PacketStream';
import { AdvancedSettings } from './components/AdvancedSettings';
import { ReportModal } from './components/ReportModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { MockServerControl } from './components/MockServerControl';
import { ClusterManagerModal } from './components/ClusterManagerModal';
import { HighIntensityConfirmationModal } from './components/HighIntensityConfirmationModal';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import { Protocol, IntensityPreset, TestReport, PresetDetails, TestStatus } from './types';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  // Target & Protocol State
  const [host, setHost] = useState<string>('127.0.0.1');
  const [port, setPort] = useState<number>(9001);
  const [targetUrl, setTargetUrl] = useState<string>('http://127.0.0.1:9003/');
  const [protocol, setProtocol] = useState<Protocol>('UDP');
  const [intensity, setIntensity] = useState<IntensityPreset>('LOW');

  // Workload Timings (Ramp-up, Sustained, Ramp-down)
  const [rampUpSec, setRampUpSec] = useState<number>(5);
  const [sustainedSec, setSustainedSec] = useState<number>(30);
  const [rampDownSec, setRampDownSec] = useState<number>(5);

  // Advanced Configuration State
  const [packetSize, setPacketSize] = useState<number>(256);
  const [gameTickHz, setGameTickHz] = useState<number>(60);
  const [httpMethod, setHttpMethod] = useState<string>('GET');
  const [httpPath, setHttpPath] = useState<string>('/');
  const [httpPayload, setHttpPayload] = useState<string>('{}');
  const [wsPath, setWsPath] = useState<string>('/');
  const [httpHeaders, setHttpHeaders] = useState<string>('');
  const [httpFollowRedirects, setHttpFollowRedirects] = useState<boolean>(true);
  const [httpKeepAlive, setHttpKeepAlive] = useState<boolean>(true);
  const [httpTimeoutSec, setHttpTimeoutSec] = useState<number>(5.0);
  const [httpVirtualUsers, setHttpVirtualUsers] = useState<number>(50);
  const [errorThreshold, setErrorThreshold] = useState<number>(50);
  const [latencyThreshold, setLatencyThreshold] = useState<number>(5000);

  // Platform Presets Info
  const [presetsInfo, setPresetsInfo] = useState<Record<string, PresetDetails>>({});

  // Mock Sandbox State
  const [mockRunning, setMockRunning] = useState<boolean>(true);
  const [mockPorts, setMockPorts] = useState<Record<string, number>>({});
  const [mockLoading, setMockLoading] = useState<boolean>(false);

  // Cluster State
  const [clusterCapacityRps, setClusterCapacityRps] = useState<number>(100000);

  // Modals
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [mockModalOpen, setMockModalOpen] = useState<boolean>(false);
  const [clusterModalOpen, setClusterModalOpen] = useState<boolean>(false);
  const [confirmHighIntensityOpen, setConfirmHighIntensityOpen] = useState<boolean>(false);
  const [activeReport, setActiveReport] = useState<TestReport | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  // Callback when a test run completes
  const handleTestFinished = useCallback((report: TestReport) => {
    setActiveReport(report);
    setNotification({
      type: 'success',
      message: `Test run finished with verdict: ${report.sla_verdict} (Peak Generated: ${report.peak_generated_rps.toLocaleString()} RPS)`
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

  // Auto-sync port if localhost is selected
  const handleSelectProtocol = (p: Protocol) => {
    setProtocol(p);
    if (p === 'HTTP_WEBSITE') {
      if (!targetUrl || targetUrl.trim() === '') {
        setTargetUrl('http://127.0.0.1:9003/');
      }
      try {
        const u = new URL(targetUrl || 'http://127.0.0.1:9003/');
        setHost(u.hostname);
        setPort(u.port ? parseInt(u.port) : (u.protocol === 'https:' ? 443 : 80));
      } catch {
        setHost('127.0.0.1');
        setPort(9003);
      }
    } else if (host === '127.0.0.1' || host === 'localhost') {
      if (p === 'UDP') setPort(9001);
      else if (p === 'TCP') setPort(9002);
      else if (p === 'HTTP' || p === 'HTTPS') setPort(9003);
      else if (p === 'WEBSOCKET') setPort(9004);
      else if (p === 'GAME_UDP') setPort(9005);
    }
  };

  // Pre-flight check before test dispatch
  const handleInitiateStartTest = () => {
    const preset = presetsInfo[intensity];
    const targetRps = preset?.target_rps || 80000;

    // If target >= 500,000 RPS and not local sandbox, prompt high-intensity confirmation modal
    const isLocal = host === '127.0.0.1' || host === 'localhost' || host === '0.0.0.0';
    if (targetRps >= 500000 && !isLocal) {
      setConfirmHighIntensityOpen(true);
      return;
    }

    // Otherwise launch immediately
    executeStartTest(true);
  };

  // Execute Start Test Action
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

    const isWebsite = protocol === 'HTTP_WEBSITE';
    const payload = {
      host,
      port,
      protocol,
      intensity,
      target_url: isWebsite ? targetUrl : undefined,
      duration_sec: rampUpSec + sustainedSec + rampDownSec,
      ramp_up_sec: rampUpSec,
      sustained_sec: sustainedSec,
      ramp_down_sec: rampDownSec,
      packet_size_bytes: packetSize,
      game_tick_hz: gameTickHz,
      http_method: httpMethod,
      http_path: isWebsite ? undefined : httpPath,
      http_payload: httpPayload,
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
        throw new Error(data.detail || 'Failed to start test');
      }
      setNotification({
        type: 'success',
        message: `Dispatched test against ${host}:${port} (${protocol} - Target: ${data.target_rps?.toLocaleString()} RPS)`
      });
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Error starting test'
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Stop Test Action
  const handleStopTest = async () => {
    try {
      const res = await fetch('/api/tests/stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) {
        setActiveReport(data.report);
      }
    } catch (err: any) {
      console.error('Stop error:', err);
    }
  };

  // Pause Action
  const handlePauseTest = async () => {
    try {
      await fetch('/api/tests/pause', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  // Resume Action
  const handleResumeTest = async () => {
    try {
      await fetch('/api/tests/resume', { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  // Emergency Stop Action
  const handleEmergencyStop = async () => {
    try {
      const res = await fetch('/api/tests/emergency-stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) {
        setActiveReport(data.report);
      }
      setNotification({
        type: 'error',
        message: 'EMERGENCY SHUTDOWN EXECUTED: All worker sockets dropped immediately.'
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

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Top Header */}
      <Header
        isConnected={isConnected}
        snapshot={currentSnapshot}
        onOpenHistory={() => setHistoryOpen(true)}
        onToggleMockModal={() => setMockModalOpen(true)}
        onToggleClusterModal={() => setClusterModalOpen(true)}
        mockRunning={mockRunning}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        
        {/* Alerts / Notifications Banner */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
              notification.type === 'error'
                ? 'bg-rose-950/50 border-rose-800 text-rose-300'
                : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white text-xs underline font-sans ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Target Server Configuration */}
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
        />

        {/* Step 2: Protocol Selection */}
        <ProtocolSelect
          selectedProtocol={protocol}
          onSelect={handleSelectProtocol}
          disabled={isTesting}
        />

        {/* Step 3: Explicit Numerical RPS Intensity Tiers (Low 80K to Super Ultra Massive 5M) */}
        <IntensitySelect
          selectedIntensity={intensity}
          onSelect={setIntensity}
          disabled={isTesting}
          presetsInfo={presetsInfo}
        />

        {/* Step 4: Advanced Workload Curves & Protocol Tuning */}
        <AdvancedSettings
          protocol={protocol}
          packetSize={packetSize}
          setPacketSize={setPacketSize}
          gameTickHz={gameTickHz}
          setGameTickHz={setGameTickHz}
          httpMethod={httpMethod}
          setHttpMethod={setHttpMethod}
          httpPath={httpPath}
          setHttpPath={setHttpPath}
          httpPayload={httpPayload}
          setHttpPayload={setHttpPayload}
          httpHeaders={httpHeaders}
          setHttpHeaders={setHttpHeaders}
          httpFollowRedirects={httpFollowRedirects}
          setHttpFollowRedirects={setHttpFollowRedirects}
          httpKeepAlive={httpKeepAlive}
          setHttpKeepAlive={setHttpKeepAlive}
          httpTimeoutSec={httpTimeoutSec}
          setHttpTimeoutSec={setHttpTimeoutSec}
          httpVirtualUsers={httpVirtualUsers}
          setHttpVirtualUsers={setHttpVirtualUsers}
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

        {/* Control Bar (Start, Pause, Resume, Stop, Emergency Stop) */}
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

        {/* 4-Pillar Enterprise RPS Breakdown & Telemetry Grid */}
        <MetricsGrid snapshot={currentSnapshot} />

        {/* Live Streaming Canvas Charts */}
        <LiveCharts history={chartHistory} />

        {/* Live Network Topology & Packet Stream */}
        <PacketStream
          snapshot={currentSnapshot}
          host={host}
          port={port}
          protocol={protocol}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border py-4 px-6 text-center text-xs text-slate-500 font-mono">
        Antigravity Enterprise Load Testing Platform &bull; Scalable up to 5,000,000 Requested RPS &bull; 2026
      </footer>

      {/* Modals & Drawers */}
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

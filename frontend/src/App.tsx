import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, NavView } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { NewTestView } from './views/NewTestView';
import { AuthorizedTargetsView } from './views/AuthorizedTargetsView';
import { TestHistoryView } from './views/TestHistoryView';
import { ReportsView } from './views/ReportsView';
import { SettingsView } from './views/SettingsView';
import { useLiveTelemetry } from './hooks/useLiveTelemetry';
import { 
  ApprovedScope, 
  TestReport, 
  PresetDetails, 
  TestStatus,
  MetricSnapshot
} from './types';
import { 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Menu, 
  Activity, 
  Radio, 
  Server,
  Bell
} from 'lucide-react';

export function App() {
  // Navigation View State
  const [activeView, setActiveView] = useState<NavView>('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Global Platform Data
  const [scopes, setScopes] = useState<ApprovedScope[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);
  const [presetsInfo, setPresetsInfo] = useState<Record<string, PresetDetails>>({});
  const [mockRunning, setMockRunning] = useState<boolean>(true);
  const [mockPorts, setMockPorts] = useState<Record<string, number>>({});
  const [mockLoading, setMockLoading] = useState<boolean>(false);

  // View Selections
  const [selectedReport, setSelectedReport] = useState<TestReport | null>(null);
  const [initialTargetForTest, setInitialTargetForTest] = useState<ApprovedScope | null>(null);

  // Notification Banner
  const [notification, setNotification] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Refresh Scopes
  const fetchScopes = useCallback(async () => {
    try {
      const res = await fetch('/api/targets/scopes');
      if (res.ok) {
        const data = await res.json();
        setScopes(data);
      }
    } catch (err) {
      console.error('Error fetching scopes:', err);
    }
  }, []);

  // Refresh Reports
  const fetchReports = useCallback(async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    }
  }, []);

  // Completion Callback from Telemetry
  const handleTestFinished = useCallback((report: TestReport) => {
    setSelectedReport(report);
    fetchReports();
    setNotification({
      type: 'success',
      message: `Test run finished with SLA verdict: ${report.sla_verdict} (Peak: ${report.peak_generated_rps.toLocaleString()} RPS)`
    });
  }, [fetchReports]);

  // Telemetry Hook
  const { currentSnapshot, isConnected, clearHistory } = useLiveTelemetry(handleTestFinished);
  const currentStatus: TestStatus = currentSnapshot ? currentSnapshot.status : 'IDLE';
  const isTesting = currentStatus === 'RUNNING' || currentStatus === 'PAUSED' || currentStatus === 'INITIALIZING';

  // Initial Data Load
  useEffect(() => {
    fetchScopes();
    fetchReports();

    fetch('/api/targets/presets')
      .then(res => res.json())
      .then(data => setPresetsInfo(data))
      .catch(err => console.error('Failed to load presets:', err));

    fetch('/api/targets/mock-status')
      .then(res => res.json())
      .then(data => {
        setMockRunning(data.is_running);
        setMockPorts(data.ports || {});
      })
      .catch(err => console.error('Failed to load mock status:', err));
  }, [fetchScopes, fetchReports]);

  // Operational Handlers
  const handleStartTest = async (payload: any) => {
    clearHistory();
    setNotification(null);
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
      message: `Test workload dispatched against ${payload.host}:${payload.port} (${payload.protocol})`
    });
    fetchReports();
  };

  const handleStopTest = async () => {
    try {
      const res = await fetch('/api/tests/stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) {
        setSelectedReport(data.report);
        fetchReports();
      }
    } catch (err) {
      console.error('Stop error:', err);
    }
  };

  const handlePauseTest = async () => {
    try {
      await fetch('/api/tests/pause', { method: 'POST' });
    } catch (err) {
      console.error('Pause error:', err);
    }
  };

  const handleResumeTest = async () => {
    try {
      await fetch('/api/tests/resume', { method: 'POST' });
    } catch (err) {
      console.error('Resume error:', err);
    }
  };

  const handleEmergencyStop = async () => {
    try {
      const res = await fetch('/api/tests/emergency-stop', { method: 'POST' });
      const data = await res.json();
      if (data.report) {
        setSelectedReport(data.report);
        fetchReports();
      }
      setNotification({
        type: 'error',
        message: 'EMERGENCY SHUTDOWN: All worker sockets terminated immediately.'
      });
    } catch (err) {
      console.error('Emergency stop error:', err);
    }
  };

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

  // Nav actions
  const navigateToNewTestWithTarget = (target?: ApprovedScope) => {
    setInitialTargetForTest(target || null);
    setActiveView('new-test');
  };

  const navigateToReportView = (report: TestReport) => {
    setSelectedReport(report);
    setActiveView('reports');
  };

  const viewTitles: Record<NavView, string> = {
    'overview': 'Overview',
    'new-test': 'New Test',
    'targets': 'Authorized Targets',
    'history': 'Test History',
    'reports': 'Reports & SLA Analysis',
    'settings': 'Settings & Infrastructure'
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans antialiased">
      
      {/* Desktop Enterprise Sidebar */}
      <div className="hidden md:block shrink-0">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          isConnected={isConnected}
          isTesting={isTesting}
          currentStatus={currentStatus}
          mockRunning={mockRunning}
          activeTestCount={isTesting ? 1 : 0}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/50 backdrop-blur-xs">
          <div className="w-64 bg-white h-full shadow-xl">
            <Sidebar
              activeView={activeView}
              setActiveView={(view) => {
                setActiveView(view);
                setMobileMenuOpen(false);
              }}
              isConnected={isConnected}
              isTesting={isTesting}
              currentStatus={currentStatus}
              mockRunning={mockRunning}
              activeTestCount={isTesting ? 1 : 0}
            />
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header / App Bar */}
        <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md hover:bg-slate-100 text-slate-600 md:hidden cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-900">{viewTitles[activeView]}</span>
            </div>
          </div>

          {/* Quick Engine & Telemetry Status Badges */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px]">
              <span className={`w-2 h-2 rounded-full ${isTesting ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'}`} />
              <span className="font-semibold">{currentStatus}</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 text-[11px] text-slate-500">
              <Radio className="w-3 h-3 text-slate-400" />
              <span className={isConnected ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}>
                {isConnected ? 'Telemetry Active' : 'Offline'}
              </span>
            </div>
          </div>
        </header>

        {/* Global Notification Banner */}
        {notification && (
          <div className={`px-4 sm:px-6 py-2.5 border-b text-xs flex items-center justify-between transition-colors ${
            notification.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer ml-4 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body View */}
        <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto">
          {activeView === 'overview' && (
            <OverviewView
              reports={reports}
              scopes={scopes}
              currentSnapshot={currentSnapshot}
              onNavigateToNewTest={navigateToNewTestWithTarget}
              onSelectReport={navigateToReportView}
              onNavigateToTargets={() => setActiveView('targets')}
            />
          )}

          {activeView === 'new-test' && (
            <NewTestView
              scopes={scopes}
              presetsInfo={presetsInfo}
              currentSnapshot={currentSnapshot}
              onStartTest={handleStartTest}
              onStopTest={handleStopTest}
              onPauseTest={handlePauseTest}
              onResumeTest={handleResumeTest}
              onEmergencyStop={handleEmergencyStop}
              onNavigateToTargets={() => setActiveView('targets')}
              onViewReport={navigateToReportView}
              initialTarget={initialTargetForTest}
            />
          )}

          {activeView === 'targets' && (
            <AuthorizedTargetsView
              scopes={scopes}
              onRefreshScopes={fetchScopes}
              onSelectTargetForTest={navigateToNewTestWithTarget}
            />
          )}

          {activeView === 'history' && (
            <TestHistoryView
              reports={reports}
              onSelectReport={navigateToReportView}
              onRerunTest={(rep) => {
                const matchedScope = scopes.find(s => s.target_pattern.includes(rep.target_host));
                navigateToNewTestWithTarget(matchedScope);
              }}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              reports={reports}
              selectedReport={selectedReport}
              onSelectReport={setSelectedReport}
              onNavigateToHistory={() => setActiveView('history')}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              mockRunning={mockRunning}
              mockPorts={mockPorts}
              onStartMocks={handleStartMocks}
              onStopMocks={handleStopMocks}
              mockLoading={mockLoading}
            />
          )}
        </main>

        {/* Minimal Enterprise Footer */}
        <footer className="border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-500 bg-white">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setActiveView('settings')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Acceptable Use Policy
              </button>
              <span>&bull;</span>
              <button 
                onClick={() => setActiveView('settings')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Privacy & Data Retention
              </button>
              <span>&bull;</span>
              <button 
                onClick={() => setActiveView('targets')}
                className="hover:text-blue-600 transition-colors cursor-pointer"
              >
                Authorized Scope Registry
              </button>
            </div>
            <div>
              ResilienceOps Platform &bull; Private Infrastructure Load Testing &bull; 2026
            </div>
          </div>
        </footer>

      </div>

    </div>
  );
}

export default App;

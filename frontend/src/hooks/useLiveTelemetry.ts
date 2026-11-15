import { useState, useEffect, useRef, useCallback } from 'react';
import { MetricSnapshot, TestReport } from '../types';

export function useLiveTelemetry(onTestFinished?: (report: TestReport) => void) {
  const [currentSnapshot, setCurrentSnapshot] = useState<MetricSnapshot | null>(null);
  const [chartHistory, setChartHistory] = useState<MetricSnapshot[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const connect = useCallback(() => {
    if (socketRef.current && (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/telemetry`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        console.log('[Telemetry WS] Connected to live metric stream.');
      };

      ws.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data);
          
          // Check if event wrapper
          if (raw.event === 'TEST_FINISHED' && raw.data?.report) {
            if (onTestFinished) {
              onTestFinished(raw.data.report);
            }
            return;
          }

          // Otherwise it is a MetricSnapshot
          if (raw.test_id) {
            const snap = raw as MetricSnapshot;
            setCurrentSnapshot(snap);
            setChartHistory((prev) => {
              const updated = [...prev, snap];
              // Keep last 40 data points (approx 10-15 seconds of rolling timeline)
              return updated.slice(-40);
            });
          }
        } catch (e) {
          // ignore keepalive pings
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (e) {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 2000);
    }
  }, [onTestFinished]);

  useEffect(() => {
    connect();
    // Heartbeat ping every 10 seconds
    const pingInterval = setInterval(() => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.send('ping');
      }
    }, 10000);

    return () => {
      clearInterval(pingInterval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const clearHistory = useCallback(() => {
    setChartHistory([]);
    setCurrentSnapshot(null);
  }, []);

  return {
    currentSnapshot,
    chartHistory,
    isConnected,
    clearHistory
  };
}

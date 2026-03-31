import { useEffect, useRef, useState } from 'react';
import { fetchHomeDashboard } from '../api/dashboardApi';
import { applyRealtimeTrade, FINNHUB_REALTIME_SYMBOLS, inferPreviousClose } from '../api/realtime/finnhubRealtime';
import { mockDashboardData } from '../data/mockDashboard';
import { DashboardData } from '../types/market';

const REFRESH_MS = 30_000;

export const useDashboardData = () => {
  const [data, setData] = useState<DashboardData>(mockDashboardData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const inFlightRef = useRef(false);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const previousCloseRef = useRef<Record<string, number>>({});
  const [wsConnected, setWsConnected] = useState(false);
  const [wsMessage, setWsMessage] = useState('대기 중');
  const hasFinnhubToken = Boolean(import.meta.env.VITE_FINNHUB_API_KEY);

  useEffect(() => {
    let mounted = true;
    const token = import.meta.env.VITE_FINNHUB_API_KEY;

    const ensurePreviousClose = (next: DashboardData) => {
      for (const symbol of FINNHUB_REALTIME_SYMBOLS) {
        if (typeof previousCloseRef.current[symbol] === 'number') continue;
        const inferred = inferPreviousClose(next, symbol);
        if (typeof inferred === 'number') {
          previousCloseRef.current[symbol] = inferred;
        }
      }
    };

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const connectSocket = () => {
      if (!token || socketRef.current || !mounted) return;
      const ws = new WebSocket(`wss://ws.finnhub.io?token=${encodeURIComponent(token)}`);
      socketRef.current = ws;
      setWsMessage('연결 시도 중');

      ws.onopen = () => {
        setWsConnected(true);
        setWsMessage('연결 성공');
        for (const symbol of FINNHUB_REALTIME_SYMBOLS) {
          ws.send(JSON.stringify({ type: 'subscribe', symbol }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as {
            type?: string;
            msg?: string;
            data?: Array<{ s?: string; p?: number }>;
          };
          if (parsed.type === 'error') {
            setWsMessage(parsed.msg ?? '웹소켓 에러 메시지');
            return;
          }
          if (parsed.type !== 'trade' || !Array.isArray(parsed.data)) return;
          setWsMessage('실시간 틱 수신 중');

          setData((prev) => {
            const next = typeof structuredClone === 'function' ? structuredClone(prev) : (JSON.parse(JSON.stringify(prev)) as DashboardData);
            for (const trade of parsed.data ?? []) {
              if (!trade.s || typeof trade.p !== 'number') continue;
              const previousClose = previousCloseRef.current[trade.s] ?? inferPreviousClose(next, trade.s);
              if (typeof previousClose !== 'number') continue;
              previousCloseRef.current[trade.s] = previousClose;
              applyRealtimeTrade(next, trade.s, trade.p, previousClose);
            }
            const now = new Date();
            next.globalMarketBar.updatedAt = `${now.toLocaleDateString('ko-KR')} ${now.toLocaleTimeString('ko-KR', { hour12: false })}`;
            if (!next.globalMarketBar.status.includes('웹소켓')) {
              next.globalMarketBar.status = `${next.globalMarketBar.status} + 웹소켓`;
            }
            return next;
          });
        } catch {
          // Ignore malformed ws payloads.
        }
      };

      ws.onclose = () => {
        socketRef.current = null;
        setWsConnected(false);
        setWsMessage('연결 종료됨 (3초 후 재시도)');
        if (!mounted) return;
        clearReconnectTimer();
        reconnectTimerRef.current = window.setTimeout(connectSocket, 3000);
      };

      ws.onerror = () => {
        setWsMessage('소켓 에러 발생');
        ws.close();
      };
    };

    const run = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        const result = await fetchHomeDashboard();
        if (!mounted) return;
        setData(result.data);
        setSources(result.sources);
        ensurePreviousClose(result.data);
        if (token) connectSocket();
        setError(null);
      } catch {
        if (!mounted) return;
        setError('실시간 데이터 로드 중 오류가 발생해 mock 데이터로 표시 중입니다.');
      } finally {
        if (mounted) setLoading(false);
        inFlightRef.current = false;
      }
    };

    run();
    const timer = window.setInterval(run, REFRESH_MS);

    return () => {
      mounted = false;
      window.clearInterval(timer);
      clearReconnectTimer();
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      setWsConnected(false);
      setWsMessage('중지됨');
    };
  }, []);

  return { data, loading, error, sources, wsConnected, hasFinnhubToken, wsMessage };
};

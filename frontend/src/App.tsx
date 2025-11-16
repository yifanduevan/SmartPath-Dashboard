import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { BackendGrid } from './components/BackendGrid';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { MetricsCharts } from './components/MetricsCharts';
import { Toolbar } from './components/Toolbar';
import { useMetrics } from './hooks/useMetrics';
import { useStatus } from './hooks/useStatus';
import type { BackendInfo } from './types';

type HistoryPoint = { time: string; p95: number; p99: number; slo: number };

const HISTORY_LIMIT = 30;

function App() {
  const statusQuery = useStatus();
  const metricsQuery = useMetrics();
  const [latencyHistory, setLatencyHistory] = useState<HistoryPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (metricsQuery.data) {
      const now = new Date();
      setLatencyHistory((prev) => {
        const next: HistoryPoint[] = [
          ...prev,
          {
            time: now.toLocaleTimeString(),
            p95: metricsQuery.data.p95LatencyMs,
            p99: metricsQuery.data.p99LatencyMs,
            slo: metricsQuery.data.sloLatencyMs,
          },
        ];
        return next.slice(-HISTORY_LIMIT);
      });
      setLastUpdated(now);
    }
  }, [metricsQuery.data]);

  useEffect(() => {
    if (statusQuery.data) {
      setLastUpdated(new Date());
    }
  }, [statusQuery.data]);

  const activeBackend: BackendInfo | undefined = useMemo(() => {
    const backends = statusQuery.data?.backends ?? [];
    return backends.find((backend) => backend.id === statusQuery.data?.activeBackend);
  }, [statusQuery.data]);

  const isInitialLoading = statusQuery.isLoading && metricsQuery.isLoading && !statusQuery.data && !metricsQuery.data;
  const hasError = statusQuery.isError || metricsQuery.isError;

  if (isInitialLoading) {
    return (
      <div className="app">
        <Header />
        <Toolbar lastUpdated={lastUpdated} hasError={hasError} />
        <div className="loading">Loading metrics…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <Header />
      <Toolbar lastUpdated={lastUpdated} hasError={hasError} />
      <MetricsCards activeBackend={activeBackend} metrics={metricsQuery.data} />
      <BackendGrid
        activeBackend={statusQuery.data?.activeBackend ?? '—'}
        backends={statusQuery.data?.backends ?? []}
      />
      <MetricsCharts
        latencyHistory={latencyHistory}
        routeDistribution={metricsQuery.data?.routeDistribution}
      />
    </div>
  );
}

export default App;

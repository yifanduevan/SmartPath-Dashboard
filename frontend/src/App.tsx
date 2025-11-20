import { useEffect, useMemo, useState } from 'react';
import './App.css';
import { BackendGrid } from './components/BackendGrid';
import { Header } from './components/Header';
import { MetricsCards } from './components/MetricsCards';
import { MetricsCharts } from './components/MetricsCharts';
import { Toolbar } from './components/Toolbar';
import { useMetrics } from './hooks/useMetrics';
import { useStatus } from './hooks/useStatus';
import { useWeight } from './hooks/useWeight';
import { useUcb } from './hooks/useUcb';
import { Ucb } from './components/Ucb';
import { WeightCharts } from './components/WeightChart';


function App() {
  const statusQuery = useStatus();
  const metricsQuery = useMetrics();
  const ucbQuery = useUcb();
  const weightQuery = useWeight();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedBackendId, setSelectedBackendId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (metricsQuery.data) {
      setLastUpdated(new Date(metricsQuery.data.timestamp * 1000));
    } else if (statusQuery.data) {
      setLastUpdated(new Date());
    }
  }, [metricsQuery.data, statusQuery.data]);

  useEffect(() => {
    const active = statusQuery.data?.backends.filter((b) => b.status === 'Healthy') ?? [];
    if (active.length === 0) {
      setSelectedBackendId(undefined);
      return;
    }
    if (!selectedBackendId || !active.some((b) => b.id === selectedBackendId)) {
      setSelectedBackendId(active[0].id);
    }
  }, [statusQuery.data, selectedBackendId]);

  const isInitialLoading = statusQuery.isLoading && metricsQuery.isLoading && !statusQuery.data && !metricsQuery.data;
  const hasError = statusQuery.isError || metricsQuery.isError;
  const activeBackends = useMemo(
    () => (statusQuery.data?.backends ?? []).filter((b) => b.status === 'Healthy'),
    [statusQuery.data?.backends]
  );

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
      <MetricsCards
        activeBackends={activeBackends}
        selectedBackendId={selectedBackendId}
        onSelectBackend={setSelectedBackendId}
        metrics={metricsQuery.data}
      />
      <BackendGrid backends={statusQuery.data?.backends ?? []} />
      <WeightCharts
        routing_weights={weightQuery.data?.routing_weights ?? {}}
      />
      <MetricsCharts
        sysdigMetrics={metricsQuery.data?.sysdig_metrics}
      />
    </div>
  );
}

export default App;

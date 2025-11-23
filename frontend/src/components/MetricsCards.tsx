import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getWorkloadJob, getWorkloadStatsHistory, triggerWorkload } from '../api/client';
import { useUcb } from '../hooks/useUcb';
import type { BackendInfo, SysdigMetricsResponse, WorkloadJob, WorkloadStatsPoint } from '../types';
import { Ucb } from './Ucb';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface MetricsCardsProps {
  activeBackends: BackendInfo[];
  selectedBackendId?: string;
  onSelectBackend: (id: string) => void;
  metrics?: SysdigMetricsResponse;
}

const defaultWorkloadHost = (import.meta.env.VITE_DEFAULT_WORKLOAD_HOST as string | undefined) ?? '';
const workloadPollIntervalMs = 4000;

function badgeClass(status: BackendInfo['status'] | undefined) {
  switch (status) {
    case 'Healthy':
      return 'badge healthy';
    default:
      return 'badge degraded';
  }
}

function normalizeBackendId(id?: string) {
  if (!id) return '';
  const parts = id.split(' ');
  return parts[parts.length - 1];
}

function formatPercent(value: number | null | undefined) {
  return typeof value === 'number' ? `${value.toFixed(2)}%` : '—';
}

function formatLatency(value: number | null | undefined) {
  return typeof value === 'number' ? `${value.toFixed(2)}ms` : '—';
}

const colorPalette = ['#10b981', '#f59e0b', '#ef4444'];

export function MetricsCards({ activeBackends, selectedBackendId, onSelectBackend, metrics }: MetricsCardsProps) {
  const activeBackend = activeBackends.find((b) => b.id === selectedBackendId) ?? activeBackends[0];
  const activeKey = normalizeBackendId(activeBackend?.id);
  const activeSysdig = activeKey ? metrics?.sysdig_metrics[activeKey] : undefined;
  const cpu = activeSysdig?.cpu;
  const memory = activeSysdig?.memory;
  const latency = activeSysdig?.latency;
  const timestamp = metrics ? new Date(metrics.timestamp * 1000).toLocaleTimeString() : null;

  const hasAnyBackend = activeBackends.length > 0;
  const [workloadHost, setWorkloadHost] = useState(defaultWorkloadHost);
  const [numUsers, setNumUsers] = useState('');
  const [spawnRate, setSpawnRate] = useState('');
  const [runTimeMinutes, setRunTimeMinutes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [lastJob, setLastJob] = useState<WorkloadJob | null>(null);
  // const [failureSeries, setFailureSeries] = useState<WorkloadStatsPoint[]>([]);
  // const [failureSeriesError, setFailureSeriesError] = useState<string | null>(null);
  // const [isLoadingFailures, setIsLoadingFailures] = useState(false);
  const ucbQuery = useUcb();
  const formatedStatus = lastJob?.status == 'running' ? 'Running' : lastJob?.status == 'succeeded' ? 'Finished Without Errors' : lastJob?.status == 'failed' ? 'Finished With Request Errors' : null;
  const [weightedLatencySeries, setWeightedLatencySeries] = useState<Array<{ timestampMs: number } & Record<string, number>>>(
    []
  );

  useEffect(() => {
    if (!activeJobId) {
      return undefined;
    }

    let aborted = false;
    let timeoutId: number | undefined;

    const pollJob = async () => {
      try {
        const job = await getWorkloadJob(activeJobId);
        if (aborted) {
          return;
        }
        setLastJob(job);
        setStatusMessage(`Workload ${job.id} is ${job.status}.`);
        if (job.status === 'running') {
          timeoutId = window.setTimeout(pollJob, workloadPollIntervalMs);
        } else {
          setActiveJobId(null);
        }
      } catch (error) {
        if (aborted) {
          return;
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch workload status.';
        setErrorMessage(message);
        setActiveJobId(null);
      }
    };

    pollJob();

    return () => {
      aborted = true;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [activeJobId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage(null);
    setErrorMessage(null);

    const parsedUsers = Number(numUsers);
    const parsedSpawnRate = Number(spawnRate);
    const parsedRunTime = Number(runTimeMinutes);

    if (!workloadHost || !Number.isFinite(parsedUsers) || !Number.isFinite(parsedSpawnRate) || !Number.isFinite(parsedRunTime)) {
      setErrorMessage('All workload fields are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await triggerWorkload({
        host: workloadHost,
        users: parsedUsers,
        spawnRate: parsedSpawnRate,
        runTimeMinutes: parsedRunTime,
      });
      setActiveJobId(response.jobId);
      setStatusMessage(`Workload accepted (job ${response.jobId}).`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger workload.';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   if (!lastJob) {
  //     setFailureSeries([]);
  //     setFailureSeriesError(null);
  //     setIsLoadingFailures(false);
  //     return;
  //   }

  //   let cancelled = false;
  //   let timeoutId: number | undefined;

  //   const fetchSeries = async () => {
  //     if (cancelled) return;
  //     setIsLoadingFailures(true);
  //     setFailureSeriesError(null);
  //     try {
  //       const data = await getWorkloadStatsHistory(lastJob.id);
  //       if (cancelled) return;
  //       const sorted = [...data].sort((a, b) => a.timestampMs - b.timestampMs);
  //       setFailureSeries(sorted);
  //     } catch (err) {
  //       if (cancelled) return;
  //       const message = err instanceof Error ? err.message : 'Failed to load failure trend.';
  //       setFailureSeriesError(message);
  //       setFailureSeries([]);
  //     } finally {
  //       if (cancelled) return;
  //       setIsLoadingFailures(false);
  //       if (lastJob.status === 'running') {
  //         timeoutId = window.setTimeout(fetchSeries, workloadPollIntervalMs);
  //       }
  //     }
  //   };

    // reset series when switching jobs
  //   setFailureSeries([]);
  //   fetchSeries();

  //   return () => {
  //     cancelled = true;
  //     if (timeoutId) {
  //       window.clearTimeout(timeoutId);
  //     }
  //   };
  // }, [lastJob?.id, lastJob?.status]);

  // const renderFailuresTooltip = ({ active, payload }: any) => {
  //   if (!active || !payload?.length) return null;
  //   const point = payload[0].payload as WorkloadStatsPoint;
  //   return (
  //     <div className="tooltip-card">
  //       <div className="tooltip-row">Time: {new Date(point.timestampMs).toLocaleTimeString()}</div>
  //       <div className="tooltip-row">Total failures: {point.totalFailureCount}</div>
  //     </div>
  //   );
  // };

  useEffect(() => {
    if (!metrics?.sysdig_metrics) return;

    const timestampMs = Date.now();
    const point: { timestampMs: number } & Record<string, number> = { timestampMs };
    const backendIds = new Set([
      ...Object.keys(metrics.sysdig_metrics ?? {}),
    ]);

    backendIds.forEach((id) => {
      const latency = metrics.sysdig_metrics[id]?.latency;
      if (typeof latency === 'number') {
        point[id] = latency
      }
    });

    // Only append when at least one backend has data
    if (Object.keys(point).length > 1) {
      const cutoff = Date.now() - 3 * 60 * 1000;
      setWeightedLatencySeries((prev) => {
        const filtered = prev.filter((p) => p.timestampMs >= cutoff);
        return [...filtered, point];
      });
    }
  }, [metrics?.timestamp, metrics?.sysdig_metrics]);

  const renderWeightedLatencyTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const point = payload[0].payload as { timestampMs: number } & Record<string, number>;
    return (
      <div className="tooltip-card">
        <div className="tooltip-row">Time: {new Date(point.timestampMs).toLocaleTimeString()}</div>
        {Object.entries(point)
          .filter(([key]) => key !== 'timestampMs')
          .map(([backend, value]) => (
            <div key={backend} className="tooltip-row">
              {backend}: {value.toFixed(2)} ms
            </div>
          ))}
      </div>
    );
  };

  return (
    <div>
    <section className="metrics-row">
      <div className="card highlight">
        <div className="card-header">
          <h2>Active Backend</h2>
          <span className={badgeClass(activeBackend?.status)}>{activeBackend?.status ?? 'Unknown'}</span>
        </div>
        <p className="big">{activeBackend?.id ?? '—'}</p>
        {hasAnyBackend && activeBackends.length > 1 && (
          <div className="select-wrapper">
            <label className="label" htmlFor="active-backend-select">
              Select backend
            </label>
            <select
              id="active-backend-select"
              value={activeBackend?.id ?? ''}
              onChange={(e) => onSelectBackend(e.target.value)}
            >
              {activeBackends.map((backend) => (
                <option key={backend.id} value={backend.id}>
                  {backend.id}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="active-backend-details">
          <p>CPU: {hasAnyBackend ? formatPercent(cpu) : '—'}</p>
          <p>Memory: {hasAnyBackend ? formatPercent(memory) : '—'}</p>
          <p>Latency: {hasAnyBackend ? formatLatency(latency) : '—'}</p>
        </div>
      </div>
      <div className="card">
        <div className="card mini">
        <p className="label">Backends Reporting</p>
        <p className="value">{metrics?.sysdig_metrics ? Object.keys(metrics.sysdig_metrics).length : '—'}</p>
      </div>
        <div className="card mini">
          <p className="label">Last Metrics Update</p>
          <p className="value">{timestamp ?? '—'}</p>
        </div>
        <Ucb best_backend={ucbQuery.data?.best_backend ?? null} exploration_constant={ucbQuery.data?.exploration_constant ?? 0} total_pulls={ucbQuery.data?.total_pulls ?? 0} />
      </div>
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="card-header">
          <h3>Workload Injection</h3>
        </div>
        <form className="workload-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label" htmlFor="workload-host">
              Target Host
            </label>
            <input
              id="workload-host"
              type="text"
              value={workloadHost}
              onChange={(e) => setWorkloadHost(e.target.value)}
              placeholder="https://example-host"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="num-users">
              Number of Users
            </label>
            <input
              id="num-users"
              type="number"
              min="1"
              step="1"
              value={numUsers}
              onChange={(e) => setNumUsers(e.target.value)}
              placeholder="e.g. 50"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="spawn-rate">
              Spawn Rate (users/s)
            </label>
            <input
              id="spawn-rate"
              type="number"
              min="1"
              step="1"
              value={spawnRate}
              onChange={(e) => setSpawnRate(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="run-time-minutes">
              Run Time (minutes)
            </label>
            <input
              id="run-time-minutes"
              type="number"
              min="1"
              step="1"
              value={runTimeMinutes}
              onChange={(e) => setRunTimeMinutes(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Starting…' : 'Start Workload'}
            </button>
          </div>
        </form>
        {lastJob && (
          <div style={{ marginTop: 10 }}>
            <p className="value">
              {formatedStatus} · {lastJob.params.users} users @ {lastJob.params.spawnRate}/s for {lastJob.params.runTimeMinutes}m
            </p>
            <p className="muted">Job ID: {lastJob.id}</p>
            {lastJob.errorMessage && <p className="muted">Error: {lastJob.errorMessage}</p>}
          </div>
        )}
      </div>
    </section>
      <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3>Backend Latency</h3>
        </div>
        {!weightedLatencySeries.length && <p className="muted">No latency data yet.</p>}
        {weightedLatencySeries.length > 0 && (
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              <LineChart data={weightedLatencySeries} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestampMs" tickFormatter={(value) => new Date(value).toLocaleTimeString()} minTickGap={30} />
                <YAxis />
                <Tooltip content={renderWeightedLatencyTooltip} />
                <Legend
                  payload={Object.keys(weightedLatencySeries[weightedLatencySeries.length - 1] ?? {})
                    .filter((key) => key !== 'timestampMs')
                    .sort()
                    .map((backendKey, idx) => ({
                      value: backendKey,
                      type: 'line' as const,
                      color: colorPalette[idx % colorPalette.length],
                    }))}
                />
                {Object.keys(weightedLatencySeries[weightedLatencySeries.length - 1] ?? {})
                  .filter((key) => key !== 'timestampMs')
                  .sort()
                  .map((backendKey, idx) => (
                    <Line
                      key={backendKey}
                      type="monotone"
                      dataKey={backendKey}
                      strokeWidth={2}
                      dot={false}
                      stroke={colorPalette[idx % colorPalette.length]}
                    />
                  ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      {/* <div className="card" style={{ marginTop: 16 }}>
        <div className="card-header">
          <h3>Failures Over Time</h3>
          <span className="muted">Job {lastJob?.id}</span>
        </div>
        {isLoadingFailures && <p className="muted">Loading failure trend…</p>}
        {!isLoadingFailures && failureSeries.length === 0 && !failureSeriesError && (
          <p className="muted">No stats history found for this job yet.</p>
        )}
        {failureSeriesError && <p className="muted">Loading Chart...</p>}
        {!isLoadingFailures && failureSeries.length > 0 && (
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={failureSeries} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestampMs"
                  tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  minTickGap={30}
                />
                <YAxis allowDecimals={false} />
                <Tooltip content={renderFailuresTooltip} />
                <Line type="monotone" dataKey="totalFailureCount" stroke="#ef4444" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div> */}
    </div>
  );
}

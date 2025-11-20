import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { getWorkloadJob, triggerWorkload } from '../api/client';
import { useUcb } from '../hooks/useUcb';
import type { BackendInfo, SysdigMetricsResponse, WorkloadJob } from '../types';
import { Ucb } from './Ucb';

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
  const ucbQuery = useUcb();

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

  return (
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
            {statusMessage && <span className="muted">{statusMessage}</span>}
            {errorMessage && <span className="muted">Error: {errorMessage}</span>}
          </div>
        </form>
        {lastJob && (
          <div className="workload-status">
            <p className="label">Last Workload</p>
            <p className="value">
              {lastJob.status.toUpperCase()} · {lastJob.params.users} users @ {lastJob.params.spawnRate}/s for {lastJob.params.runTimeMinutes}m
            </p>
            <p className="muted">Job ID: {lastJob.id}</p>
            {lastJob.errorMessage && <p className="muted">Error: {lastJob.errorMessage}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

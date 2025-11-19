import { useState } from 'react';
import type { FormEvent } from 'react';
import type { BackendInfo, SysdigMetricsResponse } from '../types';

interface MetricsCardsProps {
  activeBackends: BackendInfo[];
  selectedBackendId?: string;
  onSelectBackend: (id: string) => void;
  metrics?: SysdigMetricsResponse;
}

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

export function MetricsCards({ activeBackends, selectedBackendId, onSelectBackend, metrics }: MetricsCardsProps) {
  const activeBackend = activeBackends.find((b) => b.id === selectedBackendId) ?? activeBackends[0];
  const activeKey = normalizeBackendId(activeBackend?.id);
  const activeSysdig = activeKey ? metrics?.sysdig_metrics[activeKey] : undefined;
  const cpu = activeSysdig?.cpu;
  const memory = activeSysdig?.memory;
  const timestamp = metrics ? new Date(metrics.timestamp * 1000).toLocaleTimeString() : null;

  const hasAnyBackend = activeBackends.length > 0;
  const [numUsers, setNumUsers] = useState('');
  const [rampSeconds, setRampSeconds] = useState('');
  const [durationSeconds, setDurationSeconds] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPendingMessage(
      `Ready to inject workload: ${numUsers || '—'} users, ramp-up ${rampSeconds || '—'}s, duration ${durationSeconds || '—'}s.`
    );
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
          <p>CPU: {hasAnyBackend && cpu !== undefined ? `${(cpu).toFixed(2)}%` : '—'}</p>
          <p>Memory: {hasAnyBackend && memory !== undefined ? `${(memory).toFixed(2)}%` : '—'}</p>
        </div>
      </div>
      <div className="card">
        <div className="card mini">
        <p className="label">Backends Reporting</p>
        <p className="value">{metrics ? Object.keys(metrics.sysdig_metrics).length : '—'}</p>
      </div>
        <div className="card mini">
          <p className="label">Last Metrics Update</p>
          <p className="value">{timestamp ?? '—'}</p>
        </div>
      </div>
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <div className="card-header">
          <h3>Workload Injection</h3>
        </div>
        <form className="workload-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="label" htmlFor="num-users">
              Number of Users
            </label>
            <input
              id="num-users"
              type="number"
              min="0"
              step="1"
              value={numUsers}
              onChange={(e) => setNumUsers(e.target.value)}
              placeholder="e.g. 200"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="ramp-seconds">
              Ramp Duration (s)
            </label>
            <input
              id="ramp-seconds"
              type="number"
              min="0"
              step="1"
              value={rampSeconds}
              onChange={(e) => setRampSeconds(e.target.value)}
              placeholder="e.g. 30"
            />
          </div>
          <div className="form-row">
            <label className="label" htmlFor="duration-seconds">
              Duration (s)
            </label>
            <input
              id="duration-seconds"
              type="number"
              min="0"
              step="1"
              value={durationSeconds}
              onChange={(e) => setDurationSeconds(e.target.value)}
              placeholder="e.g. 120"
            />
          </div>
          <div className="form-actions">
            <button type="submit">Prepare Injection</button>
            {pendingMessage && <span className="muted">{pendingMessage}</span>}
          </div>
        </form>
      </div>
    </section>
  );
}

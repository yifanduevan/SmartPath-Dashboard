import type { BackendInfo, MetricsResponse } from '../types';

interface MetricsCardsProps {
  activeBackend?: BackendInfo;
  metrics?: MetricsResponse;
}

function badgeClass(status: BackendInfo['status'] | undefined) {
  switch (status) {
    case 'Healthy':
      return 'badge healthy';
    case 'Degraded':
      return 'badge degraded';
    case 'Idle':
      return 'badge idle';
    default:
      return 'badge unknown';
  }
}

export function MetricsCards({ activeBackend, metrics }: MetricsCardsProps) {
  return (
    <section className="metrics-row">
      <div className="card highlight">
        <div className="card-header">
          <h2>Active Backend</h2>
          <span className={badgeClass(activeBackend?.status)}>{activeBackend?.status ?? 'Unknown'}</span>
        </div>
        <p className="big">{activeBackend?.id ?? '—'}</p>
        <div className="active-backend-details">
          <p>
            p95:{' '}
            {activeBackend && activeBackend.p95 !== null && activeBackend.p95 !== undefined
              ? `${activeBackend.p95} ms`
              : '—'}
          </p>
          <p>Error rate: {activeBackend?.errorRate !== null && activeBackend?.errorRate !== undefined ? `${(activeBackend.errorRate * 100).toFixed(2)}%` : '—'}</p>
          <p>RPS: {activeBackend?.rps ?? '—'}</p>
        </div>
      </div>

      <div className="card mini">
        <p className="label">Window</p>
        <p className="value">{metrics?.windowSeconds !== undefined ? `${metrics.windowSeconds}s` : '—'}</p>
      </div>
      <div className="card mini">
        <p className="label">Total RPS</p>
        <p className="value">{metrics?.totalRps ?? '—'}</p>
      </div>
      <div className="card mini">
        <p className="label">p95 Latency</p>
        <p className="value">
          {metrics?.p95LatencyMs !== undefined ? `${metrics.p95LatencyMs} ms` : '—'}
        </p>
      </div>
      <div className="card mini">
        <p className="label">SLO Latency</p>
        <p className="value">
          {metrics?.sloLatencyMs !== undefined ? `${metrics.sloLatencyMs} ms` : '—'}
        </p>
      </div>
      <div className="card mini">
        <p className="label">Error Rate</p>
        <p className="value">{metrics ? `${(metrics.errorRate * 100).toFixed(2)}%` : '—'}</p>
      </div>
    </section>
  );
}

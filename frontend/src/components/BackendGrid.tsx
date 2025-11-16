import type { BackendInfo } from '../types';

interface BackendGridProps {
  backends: BackendInfo[];
  activeBackend: string;
}

function statusClass(status: BackendInfo['status']) {
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

export function BackendGrid({ backends, activeBackend }: BackendGridProps) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Backend Pool</h2>
      </div>
      <div className="backend-grid">
        {backends.map((backend) => {
          const isActive = backend.id === activeBackend;
          return (
            <div key={backend.id} className={`backend-card ${isActive ? 'active-backend' : ''}`}>
              <div className="backend-card-header">
                <div className="backend-title">
                  <span className="backend-name">{backend.id}</span>
                  {isActive && <span className="pill">Active</span>}
                </div>
                <span className={statusClass(backend.status)}>{backend.status}</span>
              </div>
              <div className="backend-metrics">
                <div>
                  <p className="label">RPS</p>
                  <p className="value">{backend.rps ?? 0}</p>
                </div>
                <div>
                  <p className="label">p95 latency</p>
                  <p className="value">
                    {backend.p95 !== null && backend.p95 !== undefined ? `${backend.p95} ms` : '—'}
                  </p>
                </div>
                <div>
                  <p className="label">Error rate</p>
                  <p className="value">
                    {backend.errorRate !== null && backend.errorRate !== undefined
                      ? `${(backend.errorRate * 100).toFixed(2)}%`
                      : '—'}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

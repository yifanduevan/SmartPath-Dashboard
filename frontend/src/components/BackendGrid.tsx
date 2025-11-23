import type { BackendInfo } from '../types';
import { useUcb } from '../hooks/useUcb';

interface BackendGridProps {
  backends: BackendInfo[];
}

function statusClass(status: BackendInfo['status']) {
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

export function BackendGrid({ backends }: BackendGridProps) {
  const ucbQuery = useUcb();
  const best_backend = ucbQuery.data?.best_backend ?? null;
  const normalizedBest = normalizeBackendId(best_backend ?? undefined);

  return (
    <section className="card">
      <div className="card-header">
        <h2>Backend Pool</h2>
      </div>
      <div className="backend-grid">
        {backends.map((backend) => {
          const isActive = backend.status === 'Healthy';
          const isBest = normalizedBest && normalizeBackendId(backend.id) === normalizedBest;
          return (
            <div key={backend.id} className={`backend-card ${isActive ? 'active-backend' : ''}`}>
              <div className="backend-card-header">
                <div className="backend-title">
                  <span className="backend-name">{backend.id}</span>
                  {isActive && <span className="pill">Active</span>}
                  {isBest && <span className="pill pill-best">👑 Best</span>}
                </div>
                <span className={statusClass(backend.status)}>{backend.status}</span>
              </div>
                            <div className="backend-metrics">
                <div>
                  <p className="label">Total Requests</p>
                  <p className="value">{backend.totalRequests ?? 0}</p>
                </div>
                <div>
                  <p className="label">Success</p>
                  <p className="value">
                    {backend.success !== null && backend.success !== undefined ? `${backend.success}` : '—'}
                  </p>
                </div>
                <div>
                  <p className="label">Failure Rate</p>
                  <p className="value">
                    {backend.success !== null && backend.success !== undefined && backend.totalRequests != 0 &&
                      backend.totalRequests !== null && backend.totalRequests !== undefined
                      ? `${((backend.totalRequests - backend.success) / backend.totalRequests * 100).toFixed(2)}%`
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

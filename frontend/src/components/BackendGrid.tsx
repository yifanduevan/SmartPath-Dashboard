import type { BackendInfo } from '../types';

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

export function BackendGrid({ backends }: BackendGridProps) {
  return (
    <section className="card">
      <div className="card-header">
        <h2>Backend Pool</h2>
      </div>
      <div className="backend-grid">
        {backends.map((backend) => {
          const isActive = backend.status === 'Healthy';
          return (
            <div key={backend.id} className={`backend-card ${isActive ? 'active-backend' : ''}`}>
              <div className="backend-card-header">
                <div className="backend-title">
                  <span className="backend-name">{backend.id}</span>
                  {isActive && <span className="pill">Active</span>}
                </div>
                <span className={statusClass(backend.status)}>{backend.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

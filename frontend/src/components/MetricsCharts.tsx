import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface MetricsChartsProps {
  latencyHistory: Array<{ time: string; p95: number; p99: number; slo: number }>;
  routeDistribution?: Record<string, number>;
}

export function MetricsCharts({ latencyHistory, routeDistribution }: MetricsChartsProps) {
  const routeData = routeDistribution
    ? Object.entries(routeDistribution).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <section className="card charts">
      <div className="charts-grid">
        <div className="chart-block">
          <div className="card-header">
            <h3>Latency Trend</h3>
            <p className="muted">Tracking recent p95/p99 samples.</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={latencyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="p95" stroke="#2563eb" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="p99" stroke="#f97316" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="slo" stroke="#22c55e" dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-block">
          <div className="card-header">
            <h3>Route Distribution</h3>
            <p className="muted">Share of traffic across backends.</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie
                data={routeData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#2563eb"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

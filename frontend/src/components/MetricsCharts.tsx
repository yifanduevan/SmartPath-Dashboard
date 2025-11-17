import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface MetricsChartsProps {
  sysdigMetrics?: Record<string, { cpu: number; memory: number }>;
}

export function MetricsCharts({ sysdigMetrics }: MetricsChartsProps) {
  const entries = sysdigMetrics
    ? Object.entries(sysdigMetrics).map(([id, metrics]) => ({
        name: `Backend ${id}`,
        cpu: metrics.cpu,
        memory: metrics.memory,
      }))
    : [];

  return (
    <section className="card charts">
      <div className="charts-grid">
        <div className="chart-block">
          <div className="card-header">
            <h3>CPU Distribution</h3>
            <p className="muted">Share of CPU usage per backend.</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie
                data={entries}
                dataKey="cpu"
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

        <div className="chart-block">
          <div className="card-header">
            <h3>Memory Distribution</h3>
            <p className="muted">Share of memory usage per backend.</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie
                data={entries}
                dataKey="memory"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#22c55e"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

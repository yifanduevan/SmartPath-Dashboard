import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface WeightChartProps {
  routing_weights: Record<string, number>;
}

export function WeightCharts({ routing_weights }: WeightChartProps) {
  const entries = routing_weights
    ? Object.entries(routing_weights).map(([id, weight]) => ({
        name: `Backend ${id}`,
        weight,
      }))
    : [];

  return (
    <section className="card charts">
      <div className="charts-grid">
        <div className="chart-block">
          <div className="card-header">
            <h3>Workload Distribution</h3>
            <p className="muted">Share of workload per backend</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Tooltip />
              <Pie
                data={entries}
                dataKey="weight"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                fill="#25d1ebff"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}

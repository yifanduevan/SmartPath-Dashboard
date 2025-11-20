import type { MetricsResponse, StatusResponse, SysdigMetricsResponse } from './types';

export const mockStatus: StatusResponse = {
  timestamp: new Date().toISOString(),
  activeBackend: 'Backend B',
  backends: [
    { id: 'Backend A', status: 'Healthy', rps: 120, p95: 80, errorRate: 0.01 },
    { id: 'Backend B', status: 'Healthy', rps: 200, p95: 60, errorRate: 0.005 },
    { id: 'Backend C', status: 'Error', rps: 0, p95: null, errorRate: null },
  ],
};

export const mockMetrics: MetricsResponse = {
  windowSeconds: 60,
  totalRps: 320,
  sloLatencyMs: 150,
  p95LatencyMs: 90,
  p99LatencyMs: 140,
  errorRate: 0.008,
  routeDistribution: {
    'Backend A': 0.3,
    'Backend B': 0.7,
    'Backend C': 0.0,
  },
};

export const mockSysdigMetrics: SysdigMetricsResponse = {
  sysdig_metrics: {
    A: { cpu: 0.02, memory: 0.1 },
    B: { cpu: 0.02, memory: 0.1 },
    C: { cpu: 0.02, memory: 0.09 },
  },
  timestamp: Math.floor(Date.now() / 1000),
};

export interface BackendInfo {
  id: string;
  status: 'Healthy' | 'Idle' | 'Degraded' | 'Unknown';
  rps: number;
  p95: number | null;
  errorRate: number | null;
}

export interface StatusResponse {
  timestamp: string;
  activeBackend: string;
  backends: BackendInfo[];
}

export interface MetricsResponse {
  windowSeconds: number;
  totalRps: number;
  sloLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  routeDistribution: Record<string, number>;
}

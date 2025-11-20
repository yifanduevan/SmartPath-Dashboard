export type BackendStatus = 'Healthy' | 'Error';

export interface BackendInfo {
  id: string;
  status: BackendStatus;
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

export interface ManagingStatusResponse {
  backend_status: Record<string, boolean>;
  health: Record<
    string,
    {
      healthy?: {
        healthy?: boolean;
      };
    }
  >;
  timestamp: number;
}

export interface SysdigMetricsResponse {
  sysdig_metrics: Record<
    string,
    {
      cpu: number;
      memory: number;
    }
  >;
  timestamp: number;
}

export type WorkloadStatus = 'running' | 'succeeded' | 'failed';

export interface WorkloadRequestBody {
  host: string;
  users: number;
  spawnRate: number;
  runTimeMinutes: number;
}

export interface WorkloadJob {
  id: string;
  status: WorkloadStatus;
  startedAt: string;
  finishedAt?: string;
  exitCode?: number | null;
  errorMessage?: string;
  params: WorkloadRequestBody;
  htmlReportPath: string;
  csvPrefixPath: string;
  log: string[];
}

export interface UcbStatsEntry {
  avg_reward: number;
  count: number;
  last_reward: number;
  total_reward: number;
}

export interface UcbResponse {
  best_backend: string;
  exploration_constant: number;
  total_pulls: number;
  ucb_stats: Record<string, UcbStatsEntry>;
  ucb_values: Record<string, number>;
}

export interface WeightResponse {
  routing_weights: Record<string, number>;
  timestamp: number;
}

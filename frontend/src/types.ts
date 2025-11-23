export interface BackendInfo {
  id: string;
  status: 'Healthy' | 'Error';
  totalRequests: number;
  success: number | null;
  failureRate: number | null;
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
      latency: number;
    }
  >;
  timestamp: number;
}

export interface WorkloadRequestBody {
  host: string;
  users: number;
  spawnRate: number;
  runTimeMinutes: number;
}

export type WorkloadStatus = 'running' | 'succeeded' | 'failed';

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

export interface WorkloadStatsPoint {
  timestampMs: number;
  totalFailureCount: number;
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

export interface GraphMetricsBackendErrors {
  '4xx_errors': number;
  '5xx_errors': number;
  connection_errors: number;
  failure_rate: number;
  failures: number;
  recent_window_size: number;
  success: number;
  timeouts: number;
  total_requests: number;
}

export interface GraphMetricsResponse {
  backend_errors: Record<string, GraphMetricsBackendErrors>;
  backend_status: Record<string, boolean>;
  error_tracking_age: number;
  health: Record<
    string,
    {
      healthy?: {
        healthy?: boolean;
      };
    }
  >;
  routing_weights: Record<string, number>;
  ucb_cache_age: number;
}

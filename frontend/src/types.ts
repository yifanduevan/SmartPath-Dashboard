export interface BackendInfo {
  id: string;
  status: 'Healthy' | 'Error';
  rps: number;
  p95: number | null;
  errorRate: number | null;
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

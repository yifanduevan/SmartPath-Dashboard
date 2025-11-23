import { useQuery } from '@tanstack/react-query';
import { getGraphMetrics } from '../api/client';
import type { BackendInfo, GraphMetricsResponse, ManagingStatusResponse } from '../types';

interface StatusView {
  timestamp: string;
  backends: BackendInfo[];
}

function mapStatusResponse(data: ManagingStatusResponse | GraphMetricsResponse | StatusView): StatusView {
  // If data already contains backends, assume it is in view shape.
  if ((data as StatusView).backends) {
    return data as StatusView;
  }

  const graph = data as GraphMetricsResponse;
  const managing = data as ManagingStatusResponse;
  const backendStatus = graph.backend_status ?? managing.backend_status ?? {};
  const backendErrors = graph.backend_errors ?? {};
  const health = graph.health ?? managing.health ?? {};
  const backendIds = Array.from(new Set([...Object.keys(backendStatus), ...Object.keys(backendErrors)]));

  const backends = backendIds.map((id) => {
    const isUp = backendStatus[id];
    const healthFlag = health?.[id]?.healthy?.healthy;
    const isHealthy = healthFlag ?? false;
    const status: BackendInfo['status'] = isUp && isHealthy ? 'Healthy' : 'Error';
    const errors = backendErrors[id];

    return {
      id: `Backend ${id}`,
      status,
      totalRequests: errors?.total_requests ?? 0,
      success: errors?.success ?? null,
      failureRate: errors?.failure_rate ?? null,
    };
  });

  return {
    timestamp: managing.timestamp ? new Date(managing.timestamp * 1000).toISOString() : new Date().toISOString(),
    backends,
  };
}

export function useStatus() {
  return useQuery<StatusView>({
    queryKey: ['status'],
    queryFn: async () => {
      const data = await getGraphMetrics();
      return mapStatusResponse(data);
    },
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}

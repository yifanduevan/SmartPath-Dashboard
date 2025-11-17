import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../api/client';
import type { BackendInfo, ManagingStatusResponse } from '../types';

interface StatusView {
  timestamp: string;
  backends: BackendInfo[];
}

function mapStatusResponse(data: ManagingStatusResponse | StatusView): StatusView {
  // If data already contains backends, assume it is in view shape.
  if ((data as StatusView).backends) {
    return data as StatusView;
  }

  const managing = data as ManagingStatusResponse;
  const backends = Object.keys(managing.backend_status).map((id) => {
    const isUp = managing.backend_status[id];
    const healthFlag = managing.health?.[id]?.healthy?.healthy;
    const isHealthy = healthFlag ?? false;
    const status: BackendInfo['status'] = isUp && isHealthy ? 'Healthy' : 'Error';

    return {
      id: `Backend ${id}`,
      status,
      rps: 0,
      p95: null,
      errorRate: null,
    };
  });

  return {
    timestamp: new Date(managing.timestamp * 1000).toISOString(),
    backends,
  };
}

export function useStatus() {
  return useQuery<StatusView>({
    queryKey: ['status'],
    queryFn: async () => {
      const data = await getStatus();
      return mapStatusResponse(data);
    },
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}

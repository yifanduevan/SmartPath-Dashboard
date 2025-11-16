import { useQuery } from '@tanstack/react-query';
import { getMetrics } from '../api/client';
import type { MetricsResponse } from '../types';

export function useMetrics() {
  return useQuery<MetricsResponse>({
    queryKey: ['metrics'],
    queryFn: getMetrics,
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}

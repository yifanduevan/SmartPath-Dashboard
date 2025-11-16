import { useQuery } from '@tanstack/react-query';
import { getStatus } from '../api/client';
import type { StatusResponse } from '../types';

export function useStatus() {
  return useQuery<StatusResponse>({
    queryKey: ['status'],
    queryFn: getStatus,
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}

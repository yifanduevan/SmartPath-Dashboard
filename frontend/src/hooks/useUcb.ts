import { useQuery } from '@tanstack/react-query';
import { getUcb } from '../api/client';
import type { UcbResponse } from '../types';

export function useUcb() {
  return useQuery<UcbResponse>({
    queryKey: ['ucb'],
    queryFn: getUcb,
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}
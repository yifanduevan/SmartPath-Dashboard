import { useQuery } from '@tanstack/react-query';
import { getWeight } from '../api/client';
import type { WeightResponse } from '../types';

export function useWeight() {
  return useQuery<WeightResponse>({
    queryKey: ['weight'],
    queryFn: getWeight,
    refetchInterval: 2000,
    staleTime: 1000,
    retry: true,
  });
}
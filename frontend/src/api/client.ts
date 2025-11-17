import type { ManagingStatusResponse, SysdigMetricsResponse } from '../types';

const baseUrl = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ?? 'http://localhost:4000';
const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch data');
  }
  return response.json() as Promise<T>;
}

export async function getStatus(): Promise<ManagingStatusResponse> {
  const response = await fetch(`${normalizedBaseUrl}/status`);
  return handleResponse<ManagingStatusResponse>(response);
}

export async function getMetrics(): Promise<SysdigMetricsResponse> {
  const response = await fetch(`${normalizedBaseUrl}/sysdig`);
  return handleResponse<SysdigMetricsResponse>(response);
}

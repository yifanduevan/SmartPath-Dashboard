import type { MetricsResponse, StatusResponse } from '../types';

const baseUrl = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ?? 'http://localhost:4000';
const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch data');
  }
  return response.json() as Promise<T>;
}

export async function getStatus(): Promise<StatusResponse> {
  const response = await fetch(`${normalizedBaseUrl}/api/status`);
  return handleResponse<StatusResponse>(response);
}

export async function getMetrics(): Promise<MetricsResponse> {
  const response = await fetch(`${normalizedBaseUrl}/api/metrics`);
  return handleResponse<MetricsResponse>(response);
}

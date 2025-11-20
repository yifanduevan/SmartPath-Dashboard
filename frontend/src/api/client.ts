import type {
  ManagingStatusResponse,
  SysdigMetricsResponse,
  WorkloadJob,
  WorkloadRequestBody,
  WorkloadStatus,
  UcbResponse,
  WeightResponse,
} from '../types';

const baseUrl = (import.meta.env.VITE_BACKEND_BASE_URL as string | undefined) ?? 'http://localhost:4000';
const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
const workloadApiKey = import.meta.env.VITE_WORKLOAD_API_KEY as string | undefined;

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Failed to fetch data');
  }
  return response.json() as Promise<T>;
}

function buildHeaders(additionalHeaders?: Record<string, string>) {
  const headers: Record<string, string> = {
    ...(additionalHeaders ?? {}),
  };
  if (workloadApiKey) {
    headers['x-api-key'] = workloadApiKey;
  }
  return headers;
}

export async function getStatus(): Promise<ManagingStatusResponse> {
  const response = await fetch(`${normalizedBaseUrl}/status`);
  return handleResponse<ManagingStatusResponse>(response);
}

export async function getMetrics(): Promise<SysdigMetricsResponse> {
  const response = await fetch(`${normalizedBaseUrl}/sysdig`);
  return handleResponse<SysdigMetricsResponse>(response);
}

export async function triggerWorkload(payload: WorkloadRequestBody): Promise<{ jobId: string; status: WorkloadStatus }> {
  const response = await fetch(`${normalizedBaseUrl}/workload`, {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse<{ jobId: string; status: WorkloadStatus }>(response);
}

export async function getWorkloadJob(jobId: string): Promise<WorkloadJob> {
  const response = await fetch(`${normalizedBaseUrl}/workload/${jobId}`, {
    headers: buildHeaders(),
  });
  return handleResponse<WorkloadJob>(response);
}

export async function getUcb(): Promise<UcbResponse> {
  const response = await fetch(`${normalizedBaseUrl}/ucb`);
  return handleResponse<UcbResponse>(response);
}

export async function getWeight(): Promise<WeightResponse> {
  const response = await fetch(`${normalizedBaseUrl}/weight`);
  return handleResponse<WeightResponse>(response);
}

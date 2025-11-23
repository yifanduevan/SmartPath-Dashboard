import type {
  ManagingStatusResponse,
  SysdigMetricsResponse,
  WorkloadJob,
  WorkloadRequestBody,
  WorkloadStatus,
  UcbResponse,
  WeightResponse,
  WorkloadStatsPoint,
  GraphMetricsResponse,
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

function parseStatsHistoryCsv(text: string): WorkloadStatsPoint[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const timestampIdx = headers.indexOf('timestamp');
  const failureIdx = headers.indexOf('total failure count');
  if (timestampIdx === -1 || failureIdx === -1) return [];

  return lines.slice(1).reduce<WorkloadStatsPoint[]>((acc, line) => {
    const cells = line.split(',');
    const timestampRaw = Number(cells[timestampIdx]);
    const failuresRaw = Number(cells[failureIdx]);
    if (!Number.isFinite(timestampRaw) || !Number.isFinite(failuresRaw)) {
      return acc;
    }
    acc.push({
      timestampMs: timestampRaw * 1000,
      totalFailureCount: failuresRaw,
    });
    return acc;
  }, []);
}

export async function getWorkloadStatsHistory(jobId: string): Promise<WorkloadStatsPoint[]> {
  const response = await fetch(`${normalizedBaseUrl}/workload/${jobId}/report/stats_history`, {
    headers: buildHeaders(),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || 'Failed to fetch stats history');
  }
  return parseStatsHistoryCsv(text);
}

export async function getUcb(): Promise<UcbResponse> {
  const response = await fetch(`${normalizedBaseUrl}/ucb`);
  return handleResponse<UcbResponse>(response);
}

export async function getWeight(): Promise<WeightResponse> {
  const response = await fetch(`${normalizedBaseUrl}/weight`);
  return handleResponse<WeightResponse>(response);
}

export async function getGraphMetrics(): Promise<GraphMetricsResponse> {
  const response = await fetch(`${normalizedBaseUrl}/graph-metrics`);
  return handleResponse<GraphMetricsResponse>(response);
}

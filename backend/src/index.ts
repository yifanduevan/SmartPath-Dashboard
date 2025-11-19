import axios from 'axios';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { Request, Response } from 'express';

dotenv.config();

type BackendStatus = 'Healthy' | 'Error';

interface BackendInfo {
  id: string;
  status: BackendStatus;
  rps: number;
  p95: number | null;
  errorRate: number | null;
}

interface StatusResponse {
  timestamp: string;
  activeBackend: string;
  backends: BackendInfo[];
}

interface MetricsResponse {
  windowSeconds: number;
  totalRps: number;
  sloLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  errorRate: number;
  routeDistribution: Record<string, number>;
}

interface ManagingStatusResponse {
  backend_status: Record<string, boolean>;
  health: Record<
    string,
    {
      healthy?: {
        healthy?: boolean;
      };
    }
  >;
  timestamp: number;
}

interface SysdigMetricsResponse {
  sysdig_metrics: Record<
    string,
    {
      cpu: number;
      memory: number;
    }
  >;
  timestamp: number;
}

const app = express();
const port = Number(process.env.PORT) || 4000;
const managingBaseUrl = process.env.MANAGING_BASE_URL;

const allowedOrigins = ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

const mockStatus: StatusResponse = {
  timestamp: new Date().toISOString(),
  activeBackend: 'Backend B',
  backends: [
    { id: 'Backend A', status: 'Healthy', rps: 120, p95: 80, errorRate: 0.01 },
    { id: 'Backend B', status: 'Healthy', rps: 200, p95: 60, errorRate: 0.005 },
    { id: 'Backend C', status: 'Error', rps: 0, p95: null, errorRate: null },
  ],
};

const mockMetrics: MetricsResponse = {
  windowSeconds: 60,
  totalRps: 320,
  sloLatencyMs: 150,
  p95LatencyMs: 90,
  p99LatencyMs: 140,
  errorRate: 0.008,
  routeDistribution: {
    'Backend A': 0.3,
    'Backend B': 0.7,
    'Backend C': 0.0,
  },
};

const mockSysdigMetrics: SysdigMetricsResponse = {
  sysdig_metrics: {
    A: { cpu: 0.02, memory: 0.1 },
    B: { cpu: 0.02, memory: 0.1 },
    C: { cpu: 0.02, memory: 0.09 },
  },
  timestamp: Math.floor(Date.now() / 1000),
};

const proxyClient = managingBaseUrl
  ? axios.create({
      baseURL: managingBaseUrl,
      timeout: 5_000,
    })
  : null;

function mapManagingStatusResponse(data: ManagingStatusResponse): StatusResponse {
  const backends = Object.keys(data.backend_status).map((id) => {
    const isUp = data.backend_status[id];
    const healthFlag = data.health?.[id]?.healthy?.healthy;
    const isHealthy = healthFlag ?? false;

    const status: BackendStatus = isUp && isHealthy ? 'Healthy' : 'Error';

    return {
      id: `Backend ${id}`,
      status,
      rps: 0,
      p95: null,
      errorRate: null,
    };
  });

  const activeBackend = backends.find((b) => b.status === 'Healthy')?.id ?? 'None';

  return {
    timestamp: new Date(data.timestamp * 1000).toISOString(),
    activeBackend,
    backends,
  };
}

app.get('/status', async (_req: Request, res: Response) => {
  if (!managingBaseUrl || !proxyClient) {
    res.json({ ...mockStatus, timestamp: new Date().toISOString() });
    return;
  }
  
  try {
    const response = await proxyClient.get<ManagingStatusResponse>('/status');
    const statusPayload = mapManagingStatusResponse(response.data);
    res.json(statusPayload);
  } catch (error) {
    console.error('Error fetching status', error);
    res.status(500).json({ error: 'Failed to fetch status from managing system' });
  }
});

app.get('/sysdig', async (_req: Request, res: Response) => {
  if (!managingBaseUrl || !proxyClient) {
    res.json({ ...mockSysdigMetrics, timestamp: Math.floor(Date.now() / 1000) });
    return;
  }

  try {
    const response = await proxyClient.get<SysdigMetricsResponse>('/sysdig');
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching Sysdig metrics', error);
    res.status(500).json({ error: 'Failed to fetch Sysdig metrics' });
  }
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Smart Path backend running on http://localhost:${port}`);
  if (managingBaseUrl) {
    console.log(`Proxying to managing system at ${managingBaseUrl}`);
  } else {
    console.log('Using mock data for Smart Path managing system');
  }
});

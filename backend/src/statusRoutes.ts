import axios from 'axios';
import type { Request, Response } from 'express';
import type { AppConfig } from './config';
import { mockStatus, mockSysdigMetrics } from './mockData';
import type { BackendStatus, ManagingStatusResponse, StatusResponse, SysdigMetricsResponse } from './types';

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

  return {
    timestamp: new Date(data.timestamp * 1000).toISOString(),
    activeBackend: backends.find((b) => b.status === 'Healthy')?.id ?? 'None',
    backends,
  };
}

export function registerStatusRoutes(app: any, config: AppConfig) {
  const proxyClient = config.managingBaseUrl
    ? axios.create({
        baseURL: config.managingBaseUrl,
        timeout: 5_000,
      })
    : null;

  app.get('/status', async (_req: Request, res: Response) => {
    if (!config.managingBaseUrl || !proxyClient) {
      res.json({ ...mockStatus, timestamp: new Date().toISOString() });
      return;
    }

    try {
      const response = await proxyClient.get<ManagingStatusResponse>('/status');
      res.json(mapManagingStatusResponse(response.data));
    } catch (error) {
      console.error('Error fetching status', error);
      res.status(500).json({ error: 'Failed to fetch status from managing system' });
    }
  });

  app.get('/sysdig', async (_req: Request, res: Response) => {
    if (!config.managingBaseUrl || !proxyClient) {
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

  app.get('/ucb', async (_req: Request, res: Response) => {
    if (!config.managingBaseUrl || !proxyClient) {
      res.json({ message: 'UCB endpoint is not configured in mock mode.' });
      return;
    }

    try {
      const response = await proxyClient.get('/ucb');
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching UCB data', error);
      res.status(500).json({ error: 'Failed to fetch UCB data' });
    }
  });

  app.get('/weight', async (_req: Request, res: Response) => {
    if (!config.managingBaseUrl || !proxyClient) {
      res.json({ message: 'Weight endpoint is not configured in mock mode.' });
      return;
    }

    try {
      const response = await proxyClient.get('/weight');
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching weight data', error);
      res.status(500).json({ error: 'Failed to fetch weight data' });
    }
  });
}

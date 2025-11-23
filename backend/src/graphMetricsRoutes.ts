import axios from 'axios';
import type { Request, Response } from 'express';
import type { AppConfig } from './config';

export function registerGraphMetricsRoutes(app: any, config: AppConfig) {
    const graphClient = config.graphMetricsBaseUrl
        ? axios.create({
            baseURL: config.graphMetricsBaseUrl,
            timeout: 5_000,
        })
        : null;

    app.get('/graph-metrics', async (_req: Request, res: Response) => {
        if (!config.graphMetricsBaseUrl || !graphClient) {
            res.status(500).json({ error: 'Graph Metrics endpoint is not configured in mock mode.' });
            return;
        }
        try {
            const response = await graphClient.get('/status');
            res.json(response.data);
        } catch (error) {
            console.error('Error fetching Graph Metrics data', error);
            res.status(500).json({ error: 'Failed to fetch Graph Metrics data' });
        }
    });
}

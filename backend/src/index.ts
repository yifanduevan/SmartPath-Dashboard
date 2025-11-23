import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import { loadConfig } from './config';
import { registerStatusRoutes } from './statusRoutes';
import { registerWorkloadRoutes } from './workload';
import { registerGraphMetricsRoutes } from './graphMetricsRoutes';

dotenv.config();

const app = express();
const config = loadConfig();
const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
  })
);

app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ ok: true, endpoints: ['/status', '/sysdig', '/health', '/ucb', '/weight', '/graph-metrics'] });
});

registerStatusRoutes(app, config);
registerWorkloadRoutes(app, config);
registerGraphMetricsRoutes(app, config);


app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(config.port, () => {
  console.log(`Smart Path backend running on http://localhost:${config.port}`);
  if (config.managingBaseUrl) {
    console.log(`Proxying to managing system at ${config.managingBaseUrl}`);
  } else {
    console.log('Using mock data for Smart Path managing system');
  }
});

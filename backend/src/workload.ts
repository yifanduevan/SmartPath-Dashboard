import crypto from 'crypto';
import fs from 'fs';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import path from 'path';
import type { Request, Response } from 'express';
import type { AppConfig } from './config';
import type { WorkloadJob, WorkloadRequestBody } from './types';

type ValidationResult = { ok: true; value: WorkloadRequestBody } | { ok: false; error: string };

const MAX_LOG_LINES = 200;
const workloadJobs = new Map<string, WorkloadJob>();
let activeWorkload: { id: string; process: ChildProcessWithoutNullStreams } | null = null;

function appendJobLog(job: WorkloadJob, source: 'stdout' | 'stderr', chunk: Buffer) {
  const lines = chunk.toString('utf-8').split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    job.log.push(`[${source}] ${line}`);
  }
  if (job.log.length > MAX_LOG_LINES) {
    job.log.splice(0, job.log.length - MAX_LOG_LINES);
  }
}

function validatePayload(body: Partial<WorkloadRequestBody>, allowedHosts: string[]): ValidationResult {
  if (!body) return { ok: false, error: 'Missing payload' };

  const host = typeof body.host === 'string' ? body.host.trim() : '';
  const users = Number(body.users);
  const spawnRate = Number(body.spawnRate);
  const runTimeMinutes = Number(body.runTimeMinutes);

  if (!host) return { ok: false, error: 'Host is required' };
  if (!Number.isFinite(users) || users <= 0) return { ok: false, error: 'Users must be a positive number' };
  if (!Number.isFinite(spawnRate) || spawnRate <= 0) return { ok: false, error: 'Spawn rate must be a positive number' };
  if (!Number.isFinite(runTimeMinutes) || runTimeMinutes <= 0) {
    return { ok: false, error: 'Run time must be a positive number of minutes' };
  }

  if (allowedHosts.length > 0 && !allowedHosts.includes(host)) {
    return { ok: false, error: 'Host not allowed' };
  }

  return {
    ok: true,
    value: { host, users, spawnRate, runTimeMinutes },
  };
}

function buildLocustArgs(params: WorkloadRequestBody, locustFilePath: string, htmlReportPath: string, csvPrefixPath: string) {
  return [
    '-f',
    locustFilePath,
    '--host',
    params.host,
    '--headless',
    '--users',
    String(params.users),
    '--spawn-rate',
    String(params.spawnRate),
    '--run-time',
    `${params.runTimeMinutes}m`,
    '--html',
    htmlReportPath,
    '--csv',
    csvPrefixPath,
  ];
}

function requireWorkloadAuth(req: Request, res: Response, apiKey?: string) {
  if (!apiKey) return true;
  const queryKey = typeof req.query.api_key === 'string' ? req.query.api_key : undefined;
  const providedKey = req.get('x-api-key') ?? queryKey;

  if (providedKey !== apiKey) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export function registerWorkloadRoutes(app: any, config: AppConfig) {
  app.post('/workload', (req: Request, res: Response) => {
    if (!requireWorkloadAuth(req, res, config.workloadApiKey)) return;

    const validation = validatePayload(req.body, config.allowedWorkloadHosts);
    if (!validation.ok) {
      res.status(400).json({ error: validation.error });
      return;
    }

    if (activeWorkload) {
      res.status(409).json({ error: 'A workload is already running', jobId: activeWorkload.id });
      return;
    }

    const jobId = crypto.randomUUID();
    const { value } = validation;
    const htmlReportPath = path.join(config.workloadOutputDir, `report-${jobId}.html`);
    const csvPrefixPath = path.join(config.workloadOutputDir, `results-${jobId}`);

    const child = spawn(config.locustBinary, buildLocustArgs(value, config.locustFilePath, htmlReportPath, csvPrefixPath), {
      cwd: config.projectRoot,
      env: process.env,
    });

    const job: WorkloadJob = {
      id: jobId,
      status: 'running',
      startedAt: new Date().toISOString(),
      params: value,
      htmlReportPath,
      csvPrefixPath,
      log: [],
    };

    workloadJobs.set(jobId, job);
    activeWorkload = { id: jobId, process: child };

    child.stdout.on('data', (chunk) => appendJobLog(job, 'stdout', chunk));
    child.stderr.on('data', (chunk) => appendJobLog(job, 'stderr', chunk));

    child.on('close', (code) => {
      job.status = code === 0 ? 'succeeded' : 'failed';
      job.exitCode = code;
      job.finishedAt = new Date().toISOString();
      if (code !== 0) {
        job.errorMessage = `Locust exited with code ${code}`;
      }
      activeWorkload = null;
    });

    child.on('error', (error) => {
      job.status = 'failed';
      job.errorMessage = error.message;
      job.finishedAt = new Date().toISOString();
      activeWorkload = null;
    });

    res.status(202).json({ jobId, status: job.status });
  });

  app.get('/workload/:jobId', (req: Request, res: Response) => {
    if (!requireWorkloadAuth(req, res, config.workloadApiKey)) return;

    const job = workloadJobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Workload not found' });
      return;
    }

    res.json(job);
  });

  app.get('/workload/:jobId/report/:kind', (req: Request, res: Response) => {
    if (!requireWorkloadAuth(req, res, config.workloadApiKey)) return;

    const job = workloadJobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ error: 'Workload not found' });
      return;
    }

    const csvFiles: Record<string, string> = {
      stats: `${job.csvPrefixPath}_stats.csv`,
      stats_history: `${job.csvPrefixPath}_stats_history.csv`,
      failures: `${job.csvPrefixPath}_failures.csv`,
    };

    let filePath: string | undefined;
    if (req.params.kind === 'html') {
      filePath = job.htmlReportPath;
    } else {
      filePath = csvFiles[req.params.kind];
    }

    if (!filePath) {
      res.status(400).json({ error: 'Unknown report type' });
      return;
    }

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: 'Report file not found' });
      return;
    }

    res.sendFile(filePath, (err) => {
      if (err) {
        res.status(500).json({ error: 'Failed to send report file' });
      }
    });
  });
}

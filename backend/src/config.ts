import fs from 'fs';
import path from 'path';

export interface AppConfig {
  port: number;
  managingBaseUrl?: string;
  workloadApiKey?: string;
  allowedWorkloadHosts: string[];
  locustBinary: string;
  projectRoot: string;
  locustFilePath: string;
  workloadOutputDir: string;
  graphMetricsBaseUrl?: string;
}

function parseCsvEnv(value?: string) {
  return (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function loadConfig(): AppConfig {
  const projectRoot = path.resolve(__dirname, "..", "..");

  const workloadOutputDir = process.env.WORKLOAD_OUTPUT_DIR
    ? path.resolve(projectRoot, process.env.WORKLOAD_OUTPUT_DIR)
    : projectRoot;

  if (!fs.existsSync(workloadOutputDir)) {
    fs.mkdirSync(workloadOutputDir, { recursive: true });
  }
  const envLocustPath = process.env.LOCUST_FILE_PATH;

  let locustFilePath: string;
  if (!envLocustPath) {
    // default: <projectRoot>/locustfile.py
    locustFilePath = path.join(projectRoot, "locustfile.py");
  } else if (path.isAbsolute(envLocustPath)) {
    // e.g. "/app/locustfile.py" → use as-is
    locustFilePath = envLocustPath;
  } else {
    // e.g. "locustfile.py" or "./locustfile.py" → resolve under projectRoot
    locustFilePath = path.join(projectRoot, envLocustPath);
  }

  return {
    port: Number(process.env.PORT) || 4000,
    managingBaseUrl: process.env.MANAGING_BASE_URL,
    workloadApiKey: process.env.WORKLOAD_API_KEY,
    allowedWorkloadHosts: parseCsvEnv(process.env.WORKLOAD_ALLOWED_HOSTS),
    locustBinary: process.env.LOCUST_BIN ?? "locust",
    projectRoot,
    locustFilePath,
    workloadOutputDir,
    graphMetricsBaseUrl: process.env.GRAPH_METRICS_BASE_URL,
  };
}

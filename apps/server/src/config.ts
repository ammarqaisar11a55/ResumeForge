import { existsSync } from 'node:fs';
import path from 'node:path';

export interface Config {
  port: number;
  databaseUrl: string | null;
  dataDir: string;
  corsOrigins: string[];
  chromePath: string | null;
  chromeNoSandbox: boolean;
  webDist: string | null;
  /** Single built-in user until authentication is added. */
  defaultUserId: string;
}

export const DEFAULT_USER_ID = '00000000-0000-4000-8000-000000000001';

const CHROME_CANDIDATES = [
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/snap/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

export function findChrome(explicit?: string): string | null {
  if (explicit) return existsSync(explicit) ? explicit : null;
  return CHROME_CANDIDATES.find((candidate) => existsSync(candidate)) ?? null;
}

/** Load `.env` from the working directory when present. Real environment variables win. */
export function loadDotEnv(file = '.env'): void {
  if (existsSync(file)) process.loadEnvFile(file);
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 4000);
  return {
    port: Number.isInteger(port) && port > 0 ? port : 4000,
    databaseUrl: env.DATABASE_URL?.trim() || null,
    dataDir: env.DATA_DIR?.trim() || '.data',
    corsOrigins: (env.CORS_ORIGIN ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    chromePath: findChrome(env.CHROME_PATH?.trim() || undefined),
    chromeNoSandbox: env.CHROME_NO_SANDBOX === 'true',
    webDist: env.WEB_DIST ? path.resolve(env.WEB_DIST) : null,
    defaultUserId: DEFAULT_USER_ID,
  };
}

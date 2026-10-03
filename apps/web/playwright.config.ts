import { defineConfig } from '@playwright/test';

const WEB_PORT = Number(process.env.E2E_WEB_PORT ?? 4174);
const API_PORT = Number(process.env.E2E_API_PORT ?? 4100);

/**
 * End-to-end tests run the real web app against the real API (embedded
 * in-memory database, headless Chrome for PDFs) in the locally installed
 * Google Chrome.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    channel: process.env.E2E_BROWSER_CHANNEL ?? 'chrome',
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w @resumeforge/server',
      cwd: '../..',
      port: API_PORT,
      reuseExistingServer: false,
      env: { PORT: String(API_PORT), DATA_DIR: 'memory', CORS_ORIGIN: `http://localhost:${WEB_PORT}` },
      timeout: 60_000,
    },
    {
      command: 'npm run dev -w @resumeforge/web',
      cwd: '../..',
      port: WEB_PORT,
      reuseExistingServer: false,
      env: { PORT: String(WEB_PORT), RESUMEFORGE_API_URL: `http://localhost:${API_PORT}` },
      timeout: 60_000,
    },
  ],
});

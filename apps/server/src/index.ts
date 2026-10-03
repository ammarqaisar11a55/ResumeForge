import { createApp } from './app';
import { loadConfig, loadDotEnv } from './config';
import { PdfRenderer } from './pdf/pdfRenderer';

loadDotEnv();
const config = loadConfig();

const pdf = config.chromePath
  ? new PdfRenderer({ executablePath: config.chromePath, noSandbox: config.chromeNoSandbox })
  : null;
console.log(
  pdf
    ? `PDF export: ${config.chromePath}`
    : 'PDF export disabled: Chrome not found (set CHROME_PATH).',
);

const app = createApp({ config, pdf });
const server = app.listen(config.port, () => {
  console.log(`ResumeForge PDF service listening on http://localhost:${config.port}/api`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down.`);
  server.close();
  await pdf?.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

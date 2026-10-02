import { createApp } from './app';
import { loadConfig } from './config';
import { openDatabase, type Db } from './db';
import { PdfRenderer } from './pdf/pdfRenderer';

const config = loadConfig();

let db: Db | null = null;
try {
  db = await openDatabase(config);
  console.log(`Database: ${db.kind}${config.databaseUrl ? '' : ` (embedded, ${config.dataDir})`}`);
} catch (error) {
  console.error('Database unavailable; resumes will only be stored in browsers.', error);
}

const pdf = config.chromePath
  ? new PdfRenderer({ executablePath: config.chromePath, noSandbox: config.chromeNoSandbox })
  : null;
console.log(pdf ? `PDF export: ${config.chromePath}` : 'PDF export disabled: Chrome not found (set CHROME_PATH).');

const app = createApp({ config, db, pdf });
const server = app.listen(config.port, () => {
  console.log(`ResumeForge API listening on http://localhost:${config.port}/api`);
});

const shutdown = async (signal: string) => {
  console.log(`${signal} received, shutting down.`);
  server.close();
  await pdf?.close();
  await db?.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

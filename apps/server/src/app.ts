import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Config } from './config';
import { errorHandler, notFound } from './http/errors';
import type { PdfRenderer } from './pdf/pdfRenderer';
import { exportsRouter } from './routes/exports';

export interface AppDependencies {
  config: Pick<Config, 'corsOrigins' | 'webDist'>;
  pdf: PdfRenderer | null;
}

export const API_VERSION = '2.0.0';

/**
 * A stateless service: resumes live in each user's browser, so the server
 * only turns rendered pages into PDFs. It stores nothing.
 */
export function createApp({ config, pdf }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  const api = express.Router();
  api.use(helmet({ contentSecurityPolicy: false }));
  api.use(cors({ origin: config.corsOrigins, credentials: false }));
  api.use(express.json({ limit: '5mb' }));

  api.get('/health', (_req, res) => {
    res.json({ ok: true, version: API_VERSION, capabilities: { pdf: pdf !== null } });
  });
  api.use('/export', exportsRouter(pdf));
  api.use(notFound);
  api.use(errorHandler);
  app.use('/api', api);

  // Optionally serve the built web app for single-process deployments.
  if (config.webDist && existsSync(path.join(config.webDist, 'index.html'))) {
    const dist = config.webDist;
    app.use(express.static(dist, { index: false, maxAge: '1h' }));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  return app;
}

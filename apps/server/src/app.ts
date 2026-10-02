import { existsSync } from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Config } from './config';
import type { Db } from './db';
import { withUser } from './http/context';
import { errorHandler, HttpError, notFound } from './http/errors';
import type { PdfRenderer } from './pdf/pdfRenderer';
import { ExportRepository } from './repositories/exportRepository';
import { ResumeRepository } from './repositories/resumeRepository';
import { exportsRouter } from './routes/exports';
import { resumesRouter } from './routes/resumes';

export interface AppDependencies {
  config: Pick<Config, 'corsOrigins' | 'defaultUserId' | 'webDist'>;
  db: Db | null;
  pdf: PdfRenderer | null;
}

export const API_VERSION = '1.0.0';

export function createApp({ config, db, pdf }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  const api = express.Router();
  api.use(helmet({ contentSecurityPolicy: false }));
  api.use(cors({ origin: config.corsOrigins, credentials: false }));
  api.use(express.json({ limit: '5mb' }));
  api.use(withUser(config.defaultUserId));

  api.get('/health', async (_req, res) => {
    let database: 'ok' | 'error' | 'none' = 'none';
    if (db) {
      database = await db
        .query('SELECT 1')
        .then(() => 'ok' as const)
        .catch(() => 'error' as const);
    }
    res.json({
      ok: true,
      version: API_VERSION,
      database: db ? { kind: db.kind, status: database } : null,
      capabilities: { persistence: database === 'ok', pdf: pdf !== null },
    });
  });

  if (db) {
    api.use('/resumes', resumesRouter(new ResumeRepository(db)));
  } else {
    api.use('/resumes', () => {
      throw new HttpError(503, 'persistence_unavailable', 'This server has no database configured.');
    });
  }
  api.use('/export', exportsRouter(pdf, db ? new ExportRepository(db) : null));
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

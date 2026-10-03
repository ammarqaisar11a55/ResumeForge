import type { IncomingMessage, ServerResponse } from 'node:http';
import { API_VERSION } from '../app';

/** Vercel serverless function for GET /api/health: PDF export is always deployed alongside. */
export default function health(_req: IncomingMessage, res: ServerResponse): void {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ ok: true, version: API_VERSION, capabilities: { pdf: true } }));
}

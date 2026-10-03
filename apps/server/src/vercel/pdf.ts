import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromium from '@sparticuz/chromium';
import { createApp } from '../app';
import { PdfRenderer } from '../pdf/pdfRenderer';

/**
 * Vercel serverless function for POST /api/export/pdf. The build script
 * (scripts/build-vercel.mjs) bundles this file and places the fonts, the
 * document stylesheet and the compressed Chromium next to it.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
process.env.RESUMEFORGE_ASSETS_DIR ??= path.join(here, 'assets');

chromium.setGraphicsMode = false;

const pdf = new PdfRenderer({
  executablePath: () => chromium.executablePath(path.join(here, 'chromium')),
  args: chromium.args,
  headless: 'shell',
  isolateContexts: false,
  concurrency: 1,
  timeoutMs: 45_000,
});

export default createApp({ config: { corsOrigins: [], webDist: null }, pdf });

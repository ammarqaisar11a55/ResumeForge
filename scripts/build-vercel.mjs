#!/usr/bin/env node
/**
 * Builds ResumeForge for Vercel using the Build Output API (v3):
 *
 *   .vercel/output/static/                 the web app (Vite build)
 *   .vercel/output/functions/api/health.func
 *   .vercel/output/functions/api/export/pdf.func
 *                                          bundled functions with their fonts,
 *                                          stylesheet and serverless Chromium
 *   .vercel/output/config.json             caching and SPA routing
 *
 * Workspace packages ship TypeScript source, so each function is bundled
 * into a single ES module with esbuild instead of relying on Vercel's
 * per-file Node.js builder.
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(root, 'apps/server/package.json'));
const out = path.join(root, '.vercel/output');

const FONT_PACKAGES = [
  'archivo',
  'inter',
  'ibm-plex-sans',
  'source-sans-3',
  'roboto',
  'source-serif-4',
  'eb-garamond',
  'lora',
].map((name) => `@fontsource-variable/${name}`);

/** Root directory of an installed package, even when it does not export package.json. */
function packageDir(name) {
  let dir = path.dirname(require.resolve(name));
  while (
    !existsSync(path.join(dir, 'package.json')) ||
    !dir.endsWith(name.split('/').join(path.sep))
  ) {
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error(`Cannot locate package ${name}`);
    dir = parent;
  }
  return dir;
}

function step(message) {
  console.log(`\n▸ ${message}`);
}

step('Building the web app');
execSync('npm run build -w @resumeforge/web', { cwd: root, stdio: 'inherit' });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

step('Copying static files');
cpSync(path.join(root, 'apps/web/dist'), path.join(out, 'static'), { recursive: true });
// Source maps stay out of the public deployment.
for (const file of readdirSync(path.join(out, 'static/assets'))) {
  if (file.endsWith('.map')) rmSync(path.join(out, 'static/assets', file));
}

async function bundleFunction({ route, entry, maxDuration, memory, withPdfAssets }) {
  step(`Bundling ${route}`);
  const dir = path.join(out, 'functions', `${route}.func`);
  mkdirSync(dir, { recursive: true });
  await build({
    entryPoints: [path.join(root, entry)],
    outfile: path.join(dir, 'index.mjs'),
    bundle: true,
    platform: 'node',
    target: 'node22',
    format: 'esm',
    minify: true,
    legalComments: 'none',
    // Optional native speed-ups of the ws package; not needed.
    external: ['bufferutil', 'utf-8-validate'],
    // CommonJS dependencies (express...) call require() for Node built-ins.
    banner: {
      js: "import { createRequire as __createRequire } from 'node:module'; const require = __createRequire(import.meta.url);",
    },
    logLevel: 'warning',
  });

  if (withPdfAssets) {
    const assets = path.join(dir, 'assets');
    cpSync(require.resolve('@resumeforge/renderer/styles.css'), path.join(assets, 'document.css'));
    for (const name of FONT_PACKAGES) {
      const from = packageDir(name);
      const to = path.join(assets, 'fonts', name);
      mkdirSync(path.join(to, 'files'), { recursive: true });
      for (const sheet of ['index.css', 'wght-italic.css'])
        cpSync(path.join(from, sheet), path.join(to, sheet));
      // Only the subsets the PDF renderer embeds.
      for (const file of readdirSync(path.join(from, 'files'))) {
        if (/-latin(-ext)?-/.test(file) && file.endsWith('.woff2')) {
          cpSync(path.join(from, 'files', file), path.join(to, 'files', file));
        }
      }
    }
    cpSync(path.join(packageDir('@sparticuz/chromium'), 'bin'), path.join(dir, 'chromium'), {
      recursive: true,
    });
  }

  writeFileSync(
    path.join(dir, '.vc-config.json'),
    JSON.stringify(
      {
        runtime: 'nodejs22.x',
        handler: 'index.mjs',
        launcherType: 'Nodejs',
        shouldAddHelpers: false,
        maxDuration,
        memory,
      },
      null,
      2,
    ),
  );
}

await bundleFunction({
  route: 'api/health',
  entry: 'apps/server/src/vercel/health.ts',
  maxDuration: 10,
  memory: 128,
});
await bundleFunction({
  route: 'api/export/pdf',
  entry: 'apps/server/src/vercel/pdf.ts',
  maxDuration: 60,
  memory: 2048,
  withPdfAssets: true,
});

step('Writing routing config');
writeFileSync(
  path.join(out, 'config.json'),
  JSON.stringify(
    {
      version: 3,
      routes: [
        {
          src: '^/assets/(.*)$',
          headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
          continue: true,
        },
        { handle: 'filesystem' },
        // Unknown API paths are real 404s, not the app shell.
        { src: '^/api/.*$', status: 404, dest: '/404.json' },
        // Client-side routes (/app, /templates, /app/resume/:id...) load the SPA.
        { src: '^/(.*)$', dest: '/index.html' },
      ],
    },
    null,
    2,
  ),
);
writeFileSync(
  path.join(out, 'static', '404.json'),
  JSON.stringify({ error: { code: 'not_found', message: 'Not found.' } }),
);

if (!existsSync(path.join(out, 'functions/api/export/pdf.func/chromium/chromium.br'))) {
  throw new Error('Serverless Chromium was not copied into the PDF function.');
}
console.log('\n✓ Vercel build output written to .vercel/output');

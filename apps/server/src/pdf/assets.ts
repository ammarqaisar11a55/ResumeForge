import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

/**
 * Where the PDF renderer finds its fonts and document stylesheet. Normally
 * they are resolved from node_modules; a bundled deployment (the Vercel
 * function) ships copies next to the code and points RESUMEFORGE_ASSETS_DIR
 * at them.
 */
function bundledAssetsDir(): string | null {
  return process.env.RESUMEFORGE_ASSETS_DIR?.trim() || null;
}

export function fontPackageDir(packageName: string): string {
  const dir = bundledAssetsDir();
  return dir
    ? path.join(dir, 'fonts', packageName)
    : path.dirname(require.resolve(`${packageName}/package.json`));
}

export function documentCssPath(): string {
  const dir = bundledAssetsDir();
  return dir ? path.join(dir, 'document.css') : require.resolve('@resumeforge/renderer/styles.css');
}

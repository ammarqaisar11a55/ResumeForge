import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { FONTS, type FontId } from '@resumeforge/core';

const require = createRequire(import.meta.url);

/**
 * Subsets embedded in PDFs: Latin plus Latin Extended covers most resumes.
 * Matches rule names such as "archivo-latin-wght-normal" or "inter-latin-ext-wght-italic".
 */
const SUBSET_RE = /-latin(?:-ext)?-[a-z]+-(?:normal|italic)$/;
const STYLESHEETS = ['index.css', 'wght-italic.css'];

const cache = new Map<FontId, Promise<string>>();

/**
 * @font-face rules for a font with the files inlined as data URIs, so the
 * headless browser renders with the same font files as the editor without
 * making any network request.
 */
export function fontFaceCss(id: FontId): Promise<string> {
  let pending = cache.get(id);
  if (!pending) {
    pending = buildFontFaceCss(id);
    cache.set(id, pending);
    pending.catch(() => cache.delete(id));
  }
  return pending;
}

async function buildFontFaceCss(id: FontId): Promise<string> {
  const font = FONTS[id];
  const dir = path.dirname(require.resolve(`${font.packageName}/package.json`));
  const blocks: string[] = [];
  for (const sheet of STYLESHEETS) {
    const css = await readFile(path.join(dir, sheet), 'utf8');
    // Each rule is preceded by a comment naming its subset, e.g. "archivo-latin-ext-wght-normal".
    const rules = css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]*})/g);
    for (const [, name, rule] of rules) {
      if (!SUBSET_RE.test(name!)) continue;
      blocks.push(await inlineUrls(rule!, dir));
    }
  }
  return blocks.join('\n');
}

async function inlineUrls(rule: string, dir: string): Promise<string> {
  const matches = [...rule.matchAll(/url\((['"]?)(\.\/files\/[^)'"]+)\1\)/g)];
  let out = rule;
  for (const [whole, , file] of matches) {
    const data = await readFile(path.join(dir, file!));
    out = out.replace(whole, `url(data:font/woff2;base64,${data.toString('base64')})`);
  }
  return out;
}

export async function fontFacesFor(ids: FontId[]): Promise<string> {
  const unique = [...new Set(ids)].filter((id) => id in FONTS);
  return (await Promise.all(unique.map(fontFaceCss))).join('\n');
}

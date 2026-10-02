import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import puppeteer, { type Browser } from 'puppeteer-core';
import type { FontId } from '@resumeforge/core';
import { buildPrintHtml } from '@resumeforge/renderer/print';
import { fontFacesFor } from './fonts';

const require = createRequire(import.meta.url);

export interface RenderPdfInput {
  /** Outer HTML of the paginated `.rf-document` produced by the shared renderer. */
  html: string;
  title: string;
  widthMm: number;
  heightMm: number;
  fonts: FontId[];
}

export interface PdfRendererOptions {
  executablePath: string;
  noSandbox?: boolean;
  /** Maximum concurrent renders. */
  concurrency?: number;
  timeoutMs?: number;
}

/**
 * The document arrives from the browser, so it is treated as untrusted:
 * scripts are stripped and also blocked by CSP, every network request is
 * refused (fonts are inlined), and each render gets a fresh incognito context.
 */
const CSP =
  "default-src 'none'; style-src 'unsafe-inline'; font-src data:; img-src data:; script-src 'none'; base-uri 'none'; form-action 'none'";

export function sanitizeDocumentHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<\/?(iframe|object|embed|link|meta|base|form)\b[^>]*>/gi, '')
    // Event handler attributes, only inside tags so resume text is never altered.
    .replace(/<[^>]+>/g, (tag) => tag.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, ''));
}

let documentCssPromise: Promise<string> | null = null;

/** The renderer package's document stylesheet: the same CSS the editor preview uses. */
export function documentCss(): Promise<string> {
  documentCssPromise ??= (async () => {
    return readFile(require.resolve('@resumeforge/renderer/styles.css'), 'utf8');
  })();
  return documentCssPromise;
}

export class PdfRenderer {
  private browser: Promise<Browser> | null = null;
  private active = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly options: PdfRendererOptions) {}

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = puppeteer
        .launch({
          executablePath: this.options.executablePath,
          headless: true,
          args: [
            '--disable-dev-shm-usage',
            '--disable-gpu',
            // Hinting off keeps glyph advances identical to the desktop preview.
            '--font-render-hinting=none',
            ...(this.options.noSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
          ],
        })
        .then((browser) => {
          browser.on('disconnected', () => {
            this.browser = null;
          });
          return browser;
        })
        .catch((error) => {
          this.browser = null;
          throw error;
        });
    }
    return this.browser;
  }

  private async acquire(): Promise<void> {
    const limit = this.options.concurrency ?? 2;
    if (this.active < limit) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
    this.active += 1;
  }

  private release(): void {
    this.active -= 1;
    this.queue.shift()?.();
  }

  async render(input: RenderPdfInput): Promise<Buffer> {
    await this.acquire();
    const browser = await this.getBrowser().catch((error: Error) => {
      this.release();
      throw new Error(`Chrome could not be started: ${error.message}`);
    });
    const context = await browser.createBrowserContext().catch((error: Error) => {
      this.release();
      throw error;
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(this.options.timeoutMs ?? 30_000);
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const url = request.url();
        if (url.startsWith('data:') || url === 'about:blank') void request.continue();
        else void request.abort('blockedbyclient');
      });

      const [fonts, css] = await Promise.all([fontFacesFor(input.fonts), documentCss()]);
      const html = buildPrintHtml({
        documentHtml: sanitizeDocumentHtml(input.html),
        css: `${fonts}\n${css}`,
        title: input.title,
        widthMm: input.widthMm,
        heightMm: input.heightMm,
        head: `<meta http-equiv="Content-Security-Policy" content="${CSP}">`,
      });
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready.then(() => undefined));

      const pdf = await page.pdf({
        width: `${input.widthMm}mm`,
        height: `${input.heightMm}mm`,
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        tagged: true,
        outline: false,
      });
      return Buffer.from(pdf);
    } finally {
      await context.close().catch(() => undefined);
      this.release();
    }
  }

  async close(): Promise<void> {
    const browser = await this.browser?.catch(() => null);
    this.browser = null;
    await browser?.close().catch(() => undefined);
  }
}

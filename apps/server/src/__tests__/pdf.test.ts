import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { findChrome } from '../config';
import { detectFonts, fontFaceCss } from '../pdf/fonts';
import { PdfRenderer, sanitizeDocumentHtml } from '../pdf/pdfRenderer';

const chrome = findChrome(process.env.CHROME_PATH);

const page = (content: string, size: [number, number]) =>
  `<div class="rf-page" style="width: ${size[0]}mm; height: ${size[1]}mm; padding: 14mm 15mm;"><div class="rf-page-content">${content}</div></div>`;

const documentHtml = (pages: string[], size: [number, number] = [210, 297]) =>
  `<div class="rf-document rf-tpl-classic rf-bullets-disc" style="--rf-font-body: 'Archivo Variable', Arial, sans-serif; --rf-font-heading: 'Archivo Variable', Arial, sans-serif; --rf-size-base: 10pt; --rf-text: #1a1a1a;">${pages.map((p) => page(p, size)).join('')}</div>`;

function pdfPageCount(pdf: Buffer): number {
  return (pdf.toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

describe('sanitizeDocumentHtml', () => {
  it('removes scripts, embeds and event handlers but leaves text alone', () => {
    const dirty = `<div class="rf-document"><script>alert(1)</script><img src=x onerror="alert(1)"><iframe src="https://evil"></iframe><p>Ran on=time onboarding</p></div>`;
    const clean = sanitizeDocumentHtml(dirty);
    expect(clean).not.toMatch(/script|onerror|iframe/);
    expect(clean).toContain('Ran on=time onboarding');
  });
});

describe('font embedding', () => {
  it('detects the fonts a document uses from its markup', () => {
    const html = `<div class="rf-document" style="--rf-font-body: 'Inter Variable', Arial; --rf-font-heading: 'Lora Variable', serif">`;
    expect(detectFonts(html)).toEqual(['inter', 'lora']);
  });

  it('inlines Latin subsets of the font files as data URIs', async () => {
    const css = await fontFaceCss('archivo');
    expect(css).toContain("font-family: 'Archivo Variable'");
    expect(css).toContain('url(data:font/woff2;base64,');
    expect(css).not.toContain('./files/');
    expect(css).not.toContain('vietnamese');
  });
});

describe.skipIf(!chrome)('pdf export with Chrome', () => {
  let renderer: PdfRenderer;
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    renderer = new PdfRenderer({
      executablePath: chrome!,
      noSandbox: process.env.CHROME_NO_SANDBOX === 'true',
    });
    app = createApp({
      config: { corsOrigins: [], webDist: null },
      pdf: renderer,
    });
  });

  afterAll(async () => {
    await renderer.close();
  });

  it('renders one PDF page per document page with working links', async () => {
    const html = documentHtml([
      '<h1 class="rf-name">Alex Morgan</h1><a class="rf-link" href="https://github.com/alexmorgan-dev">github.com/alexmorgan-dev</a>',
      '<p>Second page</p>',
      '<p>Third page</p>',
    ]);
    const res = await request(app)
      .post('/api/export/pdf')
      .send({
        title: 'Alex Morgan Resume',
        html,
        page: { widthMm: 210, heightMm: 297 },
        fonts: ['archivo'],
      })
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (c: Buffer) => chunks.push(c));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('Alex-Morgan-Resume.pdf');
    const pdf = res.body as Buffer;
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(pdfPageCount(pdf)).toBe(3);
    expect(pdf.toString('latin1')).toContain('https://github.com/alexmorgan-dev');
    // A4 is 595.3 x 841.9 points; Chrome snaps to device pixels.
    const [, width, height] =
      pdf.toString('latin1').match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/) ?? [];
    expect(Number(width)).toBeCloseTo(595.3, 0);
    expect(Number(height)).toBeCloseTo(841.9, 0);
  });

  it('rejects documents that are not ResumeForge output', async () => {
    await request(app)
      .post('/api/export/pdf')
      .send({ title: 'x', html: '<p>hello</p>', page: { widthMm: 210, heightMm: 297 } })
      .expect(400);
  });

  it('blocks network access from the document', async () => {
    const html = documentHtml(
      ['<img src="http://127.0.0.1:9/tracker.png"><p>Offline</p>'],
      [215.9, 279.4],
    );
    const pdf = await renderer.render({
      html,
      title: 'x',
      widthMm: 215.9,
      heightMm: 279.4,
      fonts: [],
    });
    expect(pdfPageCount(pdf)).toBe(1);
    // US Letter: 612 x 792 points.
    const [, width, height] =
      pdf.toString('latin1').match(/\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/) ?? [];
    expect(Number(width)).toBeCloseTo(612, 0);
    expect(Number(height)).toBeCloseTo(792, 0);
  });
});

describe('service without Chrome', () => {
  const app = createApp({ config: { corsOrigins: [], webDist: null }, pdf: null });

  it('reports its capabilities', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ ok: true, capabilities: { pdf: false } });
  });

  it('explains that PDF export is unavailable', async () => {
    const res = await request(app).post('/api/export/pdf').send({}).expect(503);
    expect(res.body.error.code).toBe('pdf_unavailable');
  });

  it('returns JSON 404s and keeps no resume endpoints', async () => {
    const res = await request(app).get('/api/resumes').expect(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

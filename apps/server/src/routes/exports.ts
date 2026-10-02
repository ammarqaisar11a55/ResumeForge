import { Router } from 'express';
import { z } from 'zod';
import { FONT_IDS, isUuid } from '@resumeforge/core';
import { HttpError } from '../http/errors';
import { userId } from '../http/context';
import type { ExportRepository } from '../repositories/exportRepository';
import type { PdfRenderer } from '../pdf/pdfRenderer';

const MAX_HTML_BYTES = 4 * 1024 * 1024;

const ExportBody = z.object({
  resumeId: z.string().optional(),
  title: z.string().trim().min(1).max(160).default('Resume'),
  html: z
    .string()
    .min(1)
    .max(MAX_HTML_BYTES)
    .refine((html) => /^\s*<div[^>]*class="rf-document[\s"]/.test(html), 'Expected a rendered ResumeForge document.'),
  page: z.object({
    widthMm: z.number().min(100).max(500),
    heightMm: z.number().min(100).max(500),
  }),
  fonts: z.array(z.enum(FONT_IDS)).max(4).default([]),
  pageCount: z.number().int().min(0).max(100).optional(),
});

function asciiFileName(title: string): string {
  return title.replace(/[^\w.-]+/g, '-').replace(/-+/g, '-').slice(0, 100) || 'Resume';
}

export function exportsRouter(renderer: PdfRenderer | null, exports: ExportRepository | null): Router {
  const router = Router();

  router.post('/pdf', async (req, res) => {
    if (!renderer) {
      throw new HttpError(503, 'pdf_unavailable', 'PDF export needs Chrome or Chromium on the server. Set CHROME_PATH.');
    }
    const body = ExportBody.safeParse(req.body);
    if (!body.success) {
      throw new HttpError(400, 'invalid_body', body.error.issues[0]?.message ?? 'Invalid export request.');
    }
    const { html, title, page, fonts, pageCount } = body.data;
    const resumeId = body.data.resumeId && isUuid(body.data.resumeId) ? body.data.resumeId : null;
    try {
      const pdf = await renderer.render({ html, title, widthMm: page.widthMm, heightMm: page.heightMm, fonts });
      await exports
        ?.record(userId(req), { resumeId, format: 'pdf', pageCount: pageCount ?? null, byteSize: pdf.length, status: 'succeeded', error: null })
        .catch((error) => console.warn('Could not record export', error));
      res
        .status(200)
        .type('application/pdf')
        .setHeader('Content-Disposition', `attachment; filename="${asciiFileName(title)}.pdf"`)
        .setHeader('Cache-Control', 'no-store')
        .send(pdf);
    } catch (error) {
      await exports
        ?.record(userId(req), {
          resumeId,
          format: 'pdf',
          pageCount: pageCount ?? null,
          byteSize: null,
          status: 'failed',
          error: (error as Error).message.slice(0, 500),
        })
        .catch(() => undefined);
      console.error('PDF export failed', error);
      throw new HttpError(500, 'pdf_failed', 'The PDF could not be generated. Try again in a moment.');
    }
  });

  router.get('/', async (req, res) => {
    if (!exports) throw new HttpError(503, 'persistence_unavailable', 'Export history needs a database.');
    const resumeId = typeof req.query.resumeId === 'string' && isUuid(req.query.resumeId) ? req.query.resumeId : undefined;
    res.json({ exports: await exports.list(userId(req), resumeId) });
  });

  return router;
}

import { Router } from 'express';
import { z } from 'zod';
import { isUuid, ResumeSchema } from '@resumeforge/core';
import { HttpError } from '../http/errors';
import { userId } from '../http/context';
import type { ResumeRepository } from '../repositories/resumeRepository';

const SaveBody = z.object({ resume: z.unknown() });
const VersionBody = z.object({ label: z.string().trim().max(120).optional() });

function resumeId(raw: unknown): string {
  if (!isUuid(raw)) throw new HttpError(400, 'invalid_id', 'Resume ids are UUIDs.');
  return raw;
}

export function resumesRouter(resumes: ResumeRepository): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    res.json({ resumes: await resumes.list(userId(req)) });
  });

  router.get('/:id', async (req, res) => {
    const resume = await resumes.get(userId(req), resumeId(req.params.id));
    if (!resume) throw new HttpError(404, 'not_found', 'Resume not found.');
    res.json({ resume });
  });

  router.put('/:id', async (req, res) => {
    const id = resumeId(req.params.id);
    const body = SaveBody.safeParse(req.body);
    if (!body.success) throw new HttpError(400, 'invalid_body', 'Expected { resume }.');
    const parsed = ResumeSchema.safeParse(body.data.resume);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new HttpError(
        422,
        'invalid_resume',
        `Invalid resume at ${issue?.path.join('.') || 'root'}: ${issue?.message}`,
      );
    }
    if (parsed.data.id !== id)
      throw new HttpError(400, 'id_mismatch', 'The resume id does not match the URL.');
    const result = await resumes.upsert(userId(req), parsed.data);
    if (!result) throw new HttpError(404, 'not_found', 'Resume not found.');
    res
      .status(result.created ? 201 : 200)
      .json({ id, created: result.created, version: result.version });
  });

  router.delete('/:id', async (req, res) => {
    const deleted = await resumes.softDelete(userId(req), resumeId(req.params.id));
    if (!deleted) throw new HttpError(404, 'not_found', 'Resume not found.');
    res.status(204).end();
  });

  router.get('/:id/versions', async (req, res) => {
    const versions = await resumes.listVersions(userId(req), resumeId(req.params.id));
    if (!versions) throw new HttpError(404, 'not_found', 'Resume not found.');
    res.json({ versions });
  });

  router.post('/:id/versions', async (req, res) => {
    const body = VersionBody.safeParse(req.body ?? {});
    if (!body.success)
      throw new HttpError(400, 'invalid_body', 'Labels are at most 120 characters.');
    const version = await resumes.createVersion(
      userId(req),
      resumeId(req.params.id),
      body.data.label || null,
    );
    if (!version) throw new HttpError(404, 'not_found', 'Resume not found.');
    res.status(201).json({ version });
  });

  router.get('/:id/versions/:version', async (req, res) => {
    const number = Number(req.params.version);
    if (!Number.isInteger(number) || number < 1)
      throw new HttpError(400, 'invalid_version', 'Versions are positive integers.');
    const resume = await resumes.getVersion(userId(req), resumeId(req.params.id), number);
    if (!resume) throw new HttpError(404, 'not_found', 'Version not found.');
    res.json({ resume });
  });

  return router;
}

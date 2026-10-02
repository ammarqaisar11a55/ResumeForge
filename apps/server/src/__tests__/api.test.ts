import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDemoResume, createResume } from '@resumeforge/core';
import { createApp } from '../app';
import { DEFAULT_USER_ID } from '../config';
import { openDatabase, type Db } from '../db';
import { ResumeRepository } from '../repositories/resumeRepository';

let db: Db;
let app: ReturnType<typeof createApp>;

beforeAll(async () => {
  db = await openDatabase({ databaseUrl: null, dataDir: 'memory', defaultUserId: DEFAULT_USER_ID });
  app = createApp({ config: { corsOrigins: ['http://localhost:5173'], defaultUserId: DEFAULT_USER_ID, webDist: null }, db, pdf: null });
});

afterAll(async () => {
  await db.close();
});

describe('health', () => {
  it('reports capabilities', async () => {
    const res = await request(app).get('/api/health').expect(200);
    expect(res.body).toMatchObject({ ok: true, capabilities: { persistence: true, pdf: false } });
    expect(res.body.database).toEqual({ kind: 'pglite', status: 'ok' });
  });

  it('returns JSON 404s for unknown routes', async () => {
    const res = await request(app).get('/api/nope').expect(404);
    expect(res.body.error.code).toBe('not_found');
  });
});

describe('resumes', () => {
  it('creates, reads, lists, updates and deletes a resume', async () => {
    const resume = createDemoResume();
    const created = await request(app).put(`/api/resumes/${resume.id}`).send({ resume }).expect(201);
    expect(created.body).toMatchObject({ id: resume.id, created: true, version: 1 });

    const fetched = await request(app).get(`/api/resumes/${resume.id}`).expect(200);
    expect(fetched.body.resume).toEqual(resume);

    const list = await request(app).get('/api/resumes').expect(200);
    expect(list.body.resumes).toContainEqual(
      expect.objectContaining({ id: resume.id, title: resume.metadata.title, fullName: 'Alex Morgan', template: 'classic' }),
    );

    const updated = { ...resume, metadata: { ...resume.metadata, title: 'Renamed' }, updatedAt: new Date().toISOString() };
    const put = await request(app).put(`/api/resumes/${resume.id}`).send({ resume: updated }).expect(200);
    // Autosaves within the snapshot interval do not create a version per save.
    expect(put.body).toMatchObject({ created: false, version: null });
    expect((await request(app).get(`/api/resumes/${resume.id}`)).body.resume.metadata.title).toBe('Renamed');

    await request(app).delete(`/api/resumes/${resume.id}`).expect(204);
    await request(app).get(`/api/resumes/${resume.id}`).expect(404);
    await request(app).delete(`/api/resumes/${resume.id}`).expect(404);

    // Saving again (e.g. "undo delete" from another device) restores it.
    await request(app).put(`/api/resumes/${resume.id}`).send({ resume: updated }).expect(200);
    await request(app).get(`/api/resumes/${resume.id}`).expect(200);
  });

  it('rejects malformed requests', async () => {
    const resume = createResume();
    await request(app).get('/api/resumes/not-a-uuid').expect(400);
    await request(app).put(`/api/resumes/${resume.id}`).send({ nope: true }).expect(400);
    const bad = await request(app)
      .put(`/api/resumes/${resume.id}`)
      .send({ resume: { ...resume, sections: [{ id: 'x', type: 'unknown' }] } })
      .expect(422);
    expect(bad.body.error.code).toBe('invalid_resume');
    const other = createResume();
    await request(app).put(`/api/resumes/${resume.id}`).send({ resume: other }).expect(400);
    await request(app).put(`/api/resumes/${resume.id}`).set('Content-Type', 'application/json').send('{oops').expect(400);
  });

  it('keeps labelled versions', async () => {
    const resume = createResume({ title: 'Versioned' });
    await request(app).put(`/api/resumes/${resume.id}`).send({ resume }).expect(201);
    const labelled = await request(app).post(`/api/resumes/${resume.id}/versions`).send({ label: 'Sent to Acme' }).expect(201);
    expect(labelled.body.version).toMatchObject({ version: 2, label: 'Sent to Acme' });
    const versions = await request(app).get(`/api/resumes/${resume.id}/versions`).expect(200);
    expect(versions.body.versions.map((v: { version: number }) => v.version)).toEqual([2, 1]);
    const v1 = await request(app).get(`/api/resumes/${resume.id}/versions/1`).expect(200);
    expect(v1.body.resume.metadata.title).toBe('Versioned');
    await request(app).get(`/api/resumes/${resume.id}/versions/9`).expect(404);
  });

  it('scopes every resume to its owner', async () => {
    const repo = new ResumeRepository(db);
    const otherUser = '00000000-0000-4000-8000-000000000002';
    await db.query(`INSERT INTO users (id) VALUES ($1)`, [otherUser]);
    const resume = createResume({ title: 'Private' });
    await repo.upsert(DEFAULT_USER_ID, resume);
    expect(await repo.get(otherUser, resume.id)).toBeNull();
    expect(await repo.upsert(otherUser, resume)).toBeNull();
    expect(await repo.softDelete(otherUser, resume.id)).toBe(false);
    expect((await repo.list(otherUser)).length).toBe(0);
  });
});

describe('pdf export without Chrome', () => {
  it('reports that PDF export is unavailable', async () => {
    const res = await request(app).post('/api/export/pdf').send({}).expect(503);
    expect(res.body.error.code).toBe('pdf_unavailable');
  });
});

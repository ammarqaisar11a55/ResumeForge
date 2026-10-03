import { describe, expect, it, vi } from 'vitest';
import { createDemoResume, createResume, type Resume } from '@resumeforge/core';
import { ApiError, NetworkError, type ApiClient } from '../services/api/apiClient';
import { ResumeService } from '../services/resumeService';
import {
  CorruptResumeError,
  LocalResumeStore,
  StorageFullError,
} from '../services/storage/localResumeStore';

describe('LocalResumeStore', () => {
  it('saves, lists, loads and removes resumes', () => {
    const store = new LocalResumeStore(localStorage);
    const a = createDemoResume();
    const b = createResume({ title: 'Second' });
    store.save(a);
    store.save(b);
    expect(
      store
        .list()
        .map((s) => s.title)
        .sort(),
    ).toEqual(['Second', 'Software Engineering Internship']);
    expect(store.get(a.id)?.resume).toEqual(a);
    store.remove(a.id);
    expect(store.get(a.id)).toBeNull();
    expect(store.list()).toHaveLength(1);
  });

  it('rebuilds a missing or corrupted index from stored resumes', () => {
    const store = new LocalResumeStore(localStorage);
    const resume = createResume({ title: 'Indexed' });
    store.save(resume);
    localStorage.setItem('resumeforge:v1:index', '{not json');
    expect(store.list().map((s) => s.id)).toEqual([resume.id]);
  });

  it('keeps a backup and reports unreadable resumes instead of losing them', () => {
    const store = new LocalResumeStore(localStorage);
    localStorage.setItem('resumeforge:v1:resume:broken', '{"id": "broken", "sections": [');
    expect(() => store.get('broken')).toThrow(CorruptResumeError);
    const backups = Object.keys(localStorage).filter((k) =>
      k.startsWith('resumeforge:v1:backup:broken:'),
    );
    expect(backups).toHaveLength(1);
  });

  it('repairs damaged resumes, keeping what can be read', () => {
    const store = new LocalResumeStore(localStorage);
    const resume = createDemoResume();
    const damaged = JSON.parse(JSON.stringify(resume));
    damaged.sections.push({ type: 'mystery' });
    localStorage.setItem(`resumeforge:v1:resume:${resume.id}`, JSON.stringify(damaged));
    const loaded = store.get(resume.id)!;
    expect(loaded.repairNotice).toMatch(/could not be recovered/);
    expect(loaded.resume.sections).toHaveLength(resume.sections.length);
    // The repaired copy is written back, the original is kept as a backup.
    expect(store.get(resume.id)!.repairNotice).toBeUndefined();
  });

  it('turns quota errors into a clear message', () => {
    const storage = {
      ...localStorage,
      getItem: (k: string) => localStorage.getItem(k),
      setItem: () => {
        throw new DOMException('full', 'QuotaExceededError');
      },
      key: (i: number) => localStorage.key(i),
      length: 0,
    } as unknown as Storage;
    expect(() => new LocalResumeStore(storage).save(createResume())).toThrow(StorageFullError);
  });
});

function fakeApi(overrides: Partial<ApiClient> = {}) {
  const remote = new Map<string, Resume>();
  const api = {
    saveResume: vi.fn(async (r: Resume) => void remote.set(r.id, r)),
    deleteResume: vi.fn(async (id: string) => void remote.delete(id)),
    listResumes: vi.fn(async () =>
      [...remote.values()].map((r) => ({
        id: r.id,
        title: r.metadata.title,
        template: r.template,
        pageCount: r.metadata.pageCount,
        fullName: r.personalInfo.fullName,
        headline: r.personalInfo.headline,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    ),
    getResume: vi.fn(async (id: string) => remote.get(id) ?? null),
    ...overrides,
  } as unknown as ApiClient;
  return { api, remote };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('ResumeService sync', () => {
  it('saves locally first and mirrors to the server', async () => {
    const { api, remote } = fakeApi();
    const service = new ResumeService(new LocalResumeStore(localStorage), api, localStorage);
    service.setBackend({ persistence: true, pdf: false });
    const resume = createResume();
    service.save(resume);
    expect(service.local.get(resume.id)).not.toBeNull();
    await flush();
    expect(remote.get(resume.id)).toEqual(resume);
    expect(service.pending()).toEqual({});
    expect(service.syncState).toBe('idle');
  });

  it('queues changes while offline and retries them on the next sync', async () => {
    let online = false;
    const remoteStore = new Map<string, Resume>();
    const { api } = fakeApi({
      saveResume: vi.fn(async (r: Resume) => {
        if (!online) throw new NetworkError();
        remoteStore.set(r.id, r);
      }),
    });
    const service = new ResumeService(new LocalResumeStore(localStorage), api, localStorage);
    service.setBackend({ persistence: true, pdf: false });
    const resume = createResume();
    service.save(resume);
    await flush();
    expect(service.syncState).toBe('offline');
    expect(service.pending()).toEqual({ [resume.id]: 'save' });

    online = true;
    await service.sync();
    await flush();
    expect(remoteStore.get(resume.id)).toEqual(resume);
    expect(service.pending()).toEqual({});
  });

  it('treats gateway errors as the server being unreachable', async () => {
    const { api } = fakeApi({
      saveResume: vi.fn(async () => Promise.reject(new ApiError('Bad gateway', 502))),
    });
    const service = new ResumeService(new LocalResumeStore(localStorage), api, localStorage);
    service.setBackend({ persistence: true, pdf: false });
    service.save(createResume());
    await flush();
    expect(service.syncState).toBe('offline');
  });

  it('pulls newer resumes from the server and uploads local-only ones', async () => {
    const { api, remote } = fakeApi();
    const local = new LocalResumeStore(localStorage);
    const mine = createResume({ title: 'Only here' });
    local.save(mine);
    const theirs = createDemoResume();
    remote.set(theirs.id, theirs);

    const service = new ResumeService(local, api, localStorage);
    service.setBackend({ persistence: true, pdf: false });
    await service.sync();
    await flush();
    expect(local.get(theirs.id)?.resume).toEqual(theirs);
    expect(remote.has(mine.id)).toBe(true);
  });

  it('works fully offline without an API', () => {
    const service = new ResumeService(new LocalResumeStore(localStorage), null, localStorage);
    service.setBackend(null);
    const resume = createResume();
    service.save(resume);
    expect(service.syncState).toBe('local-only');
    expect(service.list()).toHaveLength(1);
    expect(service.pending()).toEqual({});
  });
});

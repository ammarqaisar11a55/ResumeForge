import { describe, expect, it } from 'vitest';
import { createDemoResume, createResume } from '@resumeforge/core';
import { ResumeService } from '../services/resumeService';
import { useLibraryStore } from '../state/libraryStore';
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

describe('ResumeService', () => {
  it('keeps resumes only in local storage', async () => {
    const service = new ResumeService(new LocalResumeStore(localStorage));
    const resume = createResume({ title: 'Local only' });
    service.save(resume);
    expect(service.list().map((s) => s.title)).toEqual(['Local only']);
    expect((await service.get(resume.id))?.resume).toEqual(resume);
    service.remove(resume.id);
    expect(await service.get(resume.id)).toBeNull();
    expect(Object.keys(localStorage).some((k) => k.includes('pending'))).toBe(false);
  });
});

describe('library backups', () => {
  it('round-trips every resume through a backup file', async () => {
    const library = useLibraryStore.getState();
    library.create({ title: 'First', startFrom: 'blank' });
    library.create({ startFrom: 'demo' });
    const backup = await useLibraryStore.getState().exportAll();
    expect(backup).toMatchObject({ app: 'ResumeForge', kind: 'backup', version: 1 });
    expect(backup.resumes).toHaveLength(2);

    localStorage.clear();
    useLibraryStore.getState().refresh();
    expect(useLibraryStore.getState().summaries).toHaveLength(0);

    const imported = useLibraryStore.getState().importJson(JSON.stringify(backup));
    expect(imported.map((r) => r.metadata.title).sort()).toEqual(
      ['First', 'Software Engineering Internship'].sort(),
    );
    expect(useLibraryStore.getState().summaries).toHaveLength(2);
    // Imported copies get new ids so they never overwrite existing resumes.
    expect(imported.some((r) => backup.resumes.some((b) => b.id === r.id))).toBe(false);
  });

  it('imports a single resume file and rejects other JSON', () => {
    const resume = createDemoResume();
    expect(useLibraryStore.getState().importJson(JSON.stringify(resume))).toHaveLength(1);
    expect(() => useLibraryStore.getState().importJson('{"hello":1}')).toThrow(/not a ResumeForge/);
    expect(() => useLibraryStore.getState().importJson('nope')).toThrow(/not valid JSON/);
  });
});

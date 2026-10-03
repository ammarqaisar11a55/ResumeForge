import { loadResume, toResumeSummary, type Resume, type ResumeSummary } from '@resumeforge/core';

/**
 * Resumes stored in localStorage. Writes are synchronous, which is what lets
 * the editor flush the latest changes during `beforeunload` — an async store
 * such as IndexedDB cannot guarantee that.
 *
 * Damaged entries are never discarded: the raw text is copied to a backup key
 * before a repaired version replaces it.
 */

const PREFIX = 'resumeforge:v1';
const INDEX_KEY = `${PREFIX}:index`;
const resumeKey = (id: string) => `${PREFIX}:resume:${id}`;
const backupKey = (id: string) => `${PREFIX}:backup:${id}:${Date.now()}`;

export class StorageFullError extends Error {
  constructor() {
    super('Browser storage is full. Download a backup, then delete resumes you no longer need.');
    this.name = 'StorageFullError';
  }
}

export class CorruptResumeError extends Error {
  constructor(id: string) {
    super(`Resume ${id} could not be read. A backup copy of the damaged data was kept.`);
    this.name = 'CorruptResumeError';
  }
}

export interface LoadedResume {
  resume: Resume;
  /** Set when the stored copy was damaged and had to be repaired. */
  repairNotice?: string;
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22)
  );
}

export class LocalResumeStore {
  constructor(private readonly storage: Storage = window.localStorage) {}

  list(): ResumeSummary[] {
    const raw = this.storage.getItem(INDEX_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((s) => s && typeof s.id === 'string')) {
          return parsed as ResumeSummary[];
        }
      } catch {
        // Fall through and rebuild the index from the stored resumes.
      }
    }
    return this.rebuildIndex();
  }

  get(id: string): LoadedResume | null {
    const raw = this.storage.getItem(resumeKey(id));
    if (raw === null) return null;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      this.backup(id, raw);
      throw new CorruptResumeError(id);
    }
    const result = loadResume(parsed);
    if (!result.ok) {
      this.backup(id, raw);
      throw new CorruptResumeError(id);
    }
    if (result.repaired) {
      this.backup(id, raw);
      this.save(result.resume);
      return {
        resume: result.resume,
        repairNotice: `Some damaged content could not be recovered (${result.droppedItems} item${
          result.droppedItems === 1 ? '' : 's'
        }). A backup of the original data was kept in this browser.`,
      };
    }
    return { resume: result.resume };
  }

  has(id: string): boolean {
    return this.storage.getItem(resumeKey(id)) !== null;
  }

  save(resume: Resume): void {
    try {
      this.storage.setItem(resumeKey(resume.id), JSON.stringify(resume));
      this.writeIndex(upsert(this.list(), toResumeSummary(resume)));
    } catch (error) {
      if (isQuotaError(error)) throw new StorageFullError();
      throw error;
    }
  }

  remove(id: string): void {
    this.storage.removeItem(resumeKey(id));
    this.writeIndex(this.list().filter((s) => s.id !== id));
  }

  private writeIndex(summaries: ResumeSummary[]): void {
    this.storage.setItem(INDEX_KEY, JSON.stringify(summaries));
  }

  private backup(id: string, raw: string): void {
    try {
      this.storage.setItem(backupKey(id), raw);
    } catch {
      // A failed backup must not hide the original problem.
    }
  }

  private rebuildIndex(): ResumeSummary[] {
    const summaries: ResumeSummary[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (!key?.startsWith(`${PREFIX}:resume:`)) continue;
      try {
        const result = loadResume(JSON.parse(this.storage.getItem(key) ?? 'null'));
        if (result.ok) summaries.push(toResumeSummary(result.resume));
      } catch {
        // Unreadable entries stay in storage untouched; `get` reports them.
      }
    }
    try {
      this.writeIndex(summaries);
    } catch {
      // Index is a cache; failing to write it is not fatal.
    }
    return summaries;
  }
}

function upsert(list: ResumeSummary[], summary: ResumeSummary): ResumeSummary[] {
  const index = list.findIndex((s) => s.id === summary.id);
  if (index === -1) return [...list, summary];
  const next = list.slice();
  next[index] = summary;
  return next;
}

import type { Resume, ResumeSummary } from '@resumeforge/core';
import type { LoadedResume, LocalResumeStore } from './storage/localResumeStore';

/**
 * Resume persistence. Resumes live only in this browser's local storage;
 * nothing is sent to a server. Reads are async so a different store (for
 * example cloud sync) could be swapped in later without touching callers.
 */
export class ResumeService {
  constructor(readonly local: LocalResumeStore) {}

  list(): ResumeSummary[] {
    return this.local.list();
  }

  async get(id: string): Promise<LoadedResume | null> {
    return this.local.get(id);
  }

  /** Persist synchronously, so it is safe to call during `beforeunload`. */
  save(resume: Resume): void {
    this.local.save(resume);
  }

  remove(id: string): void {
    this.local.remove(id);
  }
}

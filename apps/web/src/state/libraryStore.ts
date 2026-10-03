import { create } from 'zustand';
import {
  createDemoResume,
  createResume,
  duplicateResume,
  loadResume,
  type Resume,
  type ResumeSummary,
  type TemplateId,
} from '@resumeforge/core';
import { resumeService } from '../services';

export interface LibraryBackup {
  app: 'ResumeForge';
  kind: 'backup';
  version: 1;
  exportedAt: string;
  resumes: Resume[];
}

function isBackup(value: unknown): value is { resumes: unknown[] } {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'backup' &&
    Array.isArray((value as { resumes?: unknown }).resumes)
  );
}

/**
 * The resume library shown on the dashboard. Summaries come from the local
 * index; full documents are loaded only when needed.
 */
interface LibraryState {
  summaries: ResumeSummary[];
  loaded: boolean;
  refresh: () => void;
  create: (options: {
    title?: string;
    template?: TemplateId;
    startFrom: 'blank' | 'demo';
  }) => Resume;
  duplicate: (id: string) => Promise<Resume | null>;
  rename: (id: string, title: string) => Promise<void>;
  remove: (id: string) => Promise<Resume | null>;
  restore: (resume: Resume) => void;
  /** Import a single resume or a full backup; returns the new resumes. */
  importJson: (text: string) => Resume[];
  /** Every resume as one backup document. */
  exportAll: () => Promise<LibraryBackup>;
}

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  summaries: [],
  loaded: false,

  refresh: () => set({ summaries: resumeService.list(), loaded: true }),

  create: ({ title, template = 'classic', startFrom }) => {
    const resume =
      startFrom === 'demo' ? createDemoResume(template) : createResume({ title, template });
    if (title?.trim()) resume.metadata.title = title.trim();
    resumeService.save(resume);
    get().refresh();
    return resume;
  },

  duplicate: async (id) => {
    const loaded = await resumeService.get(id);
    if (!loaded) return null;
    const copy = duplicateResume(loaded.resume);
    resumeService.save(copy);
    get().refresh();
    return copy;
  },

  rename: async (id, title) => {
    const loaded = await resumeService.get(id);
    if (!loaded) return;
    resumeService.save({
      ...loaded.resume,
      metadata: { ...loaded.resume.metadata, title: title.trim() || 'Untitled resume' },
      updatedAt: new Date().toISOString(),
    });
    get().refresh();
  },

  remove: async (id) => {
    const loaded = await resumeService.get(id).catch(() => null);
    resumeService.remove(id);
    get().refresh();
    return loaded?.resume ?? null;
  },

  restore: (resume) => {
    resumeService.save(resume);
    get().refresh();
  },

  importJson: (text) => {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('This file is not valid JSON.');
    }
    const docs = isBackup(raw) ? raw.resumes : [raw];
    const parsed = docs.map((doc) => loadResume(doc));
    const failed = parsed.find((r) => !r.ok);
    if (failed && !failed.ok) {
      throw new Error(`This file is not a ResumeForge resume or backup. ${failed.reason}`);
    }
    // Imports always become new resumes so they never overwrite existing work.
    const imported = parsed.flatMap((r) =>
      r.ok ? [duplicateResume(r.resume, r.resume.metadata.title)] : [],
    );
    imported.forEach((resume) => resumeService.save(resume));
    get().refresh();
    return imported;
  },

  exportAll: async () => {
    const loaded = await Promise.all(
      get().summaries.map((s) => resumeService.get(s.id).catch(() => null)),
    );
    return {
      app: 'ResumeForge',
      kind: 'backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      resumes: loaded.flatMap((l) => (l ? [l.resume] : [])),
    };
  },
}));

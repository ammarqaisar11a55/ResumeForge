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
  importJson: (text: string) => Resume;
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
    const result = loadResume(raw);
    if (!result.ok) throw new Error(`This file is not a ResumeForge resume. ${result.reason}`);
    // Imports always become a new resume so they never overwrite existing work.
    const imported = duplicateResume(result.resume, result.resume.metadata.title);
    resumeService.save(imported);
    get().refresh();
    return imported;
  },
}));

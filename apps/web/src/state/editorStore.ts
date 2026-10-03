import { produce, type Draft } from 'immer';
import { create } from 'zustand';
import type { Resume } from '@resumeforge/core';

/**
 * Editor state: the open resume, an undo/redo history of labelled document
 * actions, the current selection and save status.
 *
 * Every document change goes through `commit`, which records the previous
 * document with a human readable label ("Delete project"). Rapid edits to the
 * same field share a coalesce key, so typing a sentence is one undo step,
 * not one per keystroke.
 */

export type Selection =
  | { kind: 'document' }
  | { kind: 'header' }
  | { kind: 'section'; sectionId: string; entryId?: string };

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface HistoryEntry {
  resume: Resume;
  label: string;
}

export interface CommitOptions {
  /** Consecutive commits with the same key within the window merge into one undo step. */
  coalesceKey?: string;
}

const HISTORY_LIMIT = 150;
const COALESCE_WINDOW_MS = 1200;

export interface EditorState {
  resume: Resume | null;
  past: HistoryEntry[];
  future: HistoryEntry[];
  lastCommit: { key: string | null; at: number };
  selection: Selection;
  /** Increments on every document change; autosave compares it with savedRevision. */
  revision: number;
  savedRevision: number;
  saveStatus: SaveStatus;
  saveError: string | null;
  pageCount: number;
  overflow: boolean;

  load: (resume: Resume) => void;
  unload: () => void;
  commit: (label: string, recipe: (draft: Draft<Resume>) => void, options?: CommitOptions) => void;
  undo: () => string | null;
  redo: () => string | null;
  select: (selection: Selection) => void;
  setLayout: (info: { pageCount: number; overflow: boolean }) => void;
  markSaving: () => void;
  markSaved: (revision: number) => void;
  markSaveError: (message: string) => void;
}

const initial = {
  resume: null,
  past: [],
  future: [],
  lastCommit: { key: null, at: 0 },
  selection: { kind: 'document' } as Selection,
  revision: 0,
  savedRevision: 0,
  saveStatus: 'saved' as SaveStatus,
  saveError: null,
  pageCount: 1,
  overflow: false,
};

export const useEditorStore = create<EditorState>()((set, get) => ({
  ...initial,

  load: (resume) =>
    set({
      ...initial,
      resume,
      pageCount: resume.metadata.pageCount || 1,
    }),

  unload: () => set({ ...initial }),

  commit: (label, recipe, options = {}) => {
    const state = get();
    const current = state.resume;
    if (!current) return;
    const next = produce(current, (draft) => {
      recipe(draft);
    });
    if (next === current) return;
    const stamped = produce(next, (draft) => {
      draft.updatedAt = new Date().toISOString();
    });

    const now = Date.now();
    const key = options.coalesceKey ?? null;
    const coalesce =
      key !== null &&
      state.lastCommit.key === key &&
      now - state.lastCommit.at < COALESCE_WINDOW_MS &&
      state.past.length > 0;
    const past = coalesce
      ? state.past
      : [...state.past, { resume: current, label }].slice(-HISTORY_LIMIT);

    set({
      resume: stamped,
      past,
      future: [],
      lastCommit: { key, at: now },
      revision: state.revision + 1,
      saveStatus: 'unsaved',
    });
  },

  undo: () => {
    const { past, future, resume, revision } = get();
    const entry = past[past.length - 1];
    if (!entry || !resume) return null;
    set({
      resume: entry.resume,
      past: past.slice(0, -1),
      future: [...future, { resume, label: entry.label }],
      lastCommit: { key: null, at: 0 },
      revision: revision + 1,
      saveStatus: 'unsaved',
    });
    return entry.label;
  },

  redo: () => {
    const { past, future, resume, revision } = get();
    const entry = future[future.length - 1];
    if (!entry || !resume) return null;
    set({
      resume: entry.resume,
      past: [...past, { resume, label: entry.label }],
      future: future.slice(0, -1),
      lastCommit: { key: null, at: 0 },
      revision: revision + 1,
      saveStatus: 'unsaved',
    });
    return entry.label;
  },

  select: (selection) => set({ selection }),

  setLayout: ({ pageCount, overflow }) => {
    const { resume, revision } = get();
    if (!resume) return;
    const changed = resume.metadata.pageCount !== pageCount;
    set({
      pageCount,
      overflow,
      // The page count is cached on the document for dashboards; it is not an undoable edit.
      ...(changed
        ? {
            resume: produce(resume, (d) => {
              d.metadata.pageCount = pageCount;
            }),
            revision: revision + 1,
            saveStatus: 'unsaved' as SaveStatus,
          }
        : {}),
    });
  },

  markSaving: () => set({ saveStatus: 'saving', saveError: null }),

  markSaved: (revision) =>
    set((state) => ({
      savedRevision: revision,
      saveStatus: state.revision === revision ? 'saved' : 'unsaved',
      saveError: null,
    })),

  markSaveError: (message) => set({ saveStatus: 'error', saveError: message }),
}));

export const selectCanUndo = (s: EditorState) => s.past.length > 0;
export const selectCanRedo = (s: EditorState) => s.future.length > 0;

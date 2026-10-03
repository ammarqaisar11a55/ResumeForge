import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDemoResume, createResume, resolveSettings, type SectionOf } from '@resumeforge/core';
import {
  addBullet,
  addEntry,
  addSection,
  duplicateEntry,
  duplicateSection,
  fillWithExample,
  moveBullet,
  moveEntry,
  moveSection,
  removeEntry,
  removeSection,
  resetSettings,
  setMargin,
  setSetting,
  setTemplate,
  updateEntry,
  updatePersonal,
  updateSection,
} from '../state/editorActions';
import { useEditorStore } from '../state/editorStore';
import { resumeIsEmpty } from '../features/editor/sidebar/content';

const state = () => useEditorStore.getState();
const resume = () => state().resume!;

beforeEach(() => {
  vi.useFakeTimers();
  state().load(createDemoResume());
});

afterEach(() => {
  vi.useRealTimers();
  state().unload();
});

describe('undo and redo', () => {
  it('undoes and redoes labelled document actions', () => {
    const before = resume().sections.length;
    addSection('awards');
    expect(resume().sections).toHaveLength(before + 1);
    expect(state().undo()).toBe('Add Awards section');
    expect(resume().sections).toHaveLength(before);
    expect(state().redo()).toBe('Add Awards section');
    expect(resume().sections).toHaveLength(before + 1);
  });

  it('merges rapid typing in one field into a single undo step', () => {
    updatePersonal('fullName', 'A');
    updatePersonal('fullName', 'Al');
    updatePersonal('fullName', 'Ali');
    expect(state().past).toHaveLength(1);
    state().undo();
    expect(resume().personalInfo.fullName).toBe('Alex Morgan');
  });

  it('starts a new undo step after a pause or on another field', () => {
    updatePersonal('fullName', 'Sam');
    vi.advanceTimersByTime(2000);
    updatePersonal('fullName', 'Sam Lee');
    updatePersonal('headline', 'Engineer');
    expect(state().past).toHaveLength(3);
    state().undo();
    expect(resume().personalInfo.headline).not.toBe('Engineer');
    state().undo();
    expect(resume().personalInfo.fullName).toBe('Sam');
  });

  it('clears the redo stack when a new change is made', () => {
    addSection('awards');
    state().undo();
    expect(state().future).toHaveLength(1);
    addSection('languages');
    expect(state().future).toHaveLength(0);
    expect(state().redo()).toBeNull();
  });

  it('reports nothing to undo on a fresh document', () => {
    expect(state().undo()).toBeNull();
  });

  it('bumps the revision and marks changes unsaved', () => {
    const revision = state().revision;
    updatePersonal('headline', 'New title');
    expect(state().revision).toBe(revision + 1);
    expect(state().saveStatus).toBe('unsaved');
  });
});

describe('section and entry operations', () => {
  it('reorders sections', () => {
    const ids = resume().sections.map((s) => s.id);
    moveSection(0, 2);
    expect(resume().sections.map((s) => s.id)).toEqual([ids[1], ids[2], ids[0], ...ids.slice(3)]);
  });

  it('adds, duplicates, reorders and removes entries', () => {
    const projects = resume().sections.find((s) => s.type === 'projects')!;
    const count = projects.entries.length;
    const firstId = projects.entries[0]!.id;
    const copyId = duplicateEntry(projects.id, firstId)!;
    const after = () =>
      resume().sections.find((s) => s.id === projects.id) as SectionOf<'projects'>;
    expect(after().entries).toHaveLength(count + 1);
    expect(after().entries[1]!.id).toBe(copyId);
    expect(after().entries[1]!.name).toBe(after().entries[0]!.name);

    moveEntry(projects.id, 0, count);
    expect(after().entries[count]!.id).toBe(firstId);

    removeEntry(projects.id, copyId);
    expect(after().entries).toHaveLength(count);

    const newId = addEntry(projects.id)!;
    updateEntry(projects.id, newId, 'name', 'New project');
    expect(after().entries.at(-1)!.name).toBe('New project');
  });

  it('adds and reorders bullet points with no limit', () => {
    const projects = resume().sections.find((s) => s.type === 'projects')!;
    const entryId = projects.entries[0]!.id;
    for (let i = 0; i < 25; i++)
      addBullet(projects.id, entryId, 'bullets', undefined, `Bullet ${i}`);
    const bullets = () =>
      (resume().sections.find((s) => s.id === projects.id) as SectionOf<'projects'>).entries[0]!
        .bullets;
    expect(bullets()).toHaveLength(27);
    const last = bullets().at(-1)!.id;
    moveBullet(projects.id, entryId, 'bullets', 26, 0);
    expect(bullets()[0]!.id).toBe(last);
  });

  it('duplicates, hides and deletes sections', () => {
    const section = resume().sections[1]!;
    const copy = duplicateSection(section.id)!;
    expect(resume().sections[2]!.id).toBe(copy);
    expect(resume().sections[2]!.title).toBe(`${section.title} (copy)`);
    updateSection(copy, { visible: false });
    expect(resume().sections[2]!.visible).toBe(false);
    removeSection(copy);
    expect(resume().sections.some((s) => s.id === copy)).toBe(false);
  });
});

describe('templates and formatting', () => {
  it('switches templates without changing content', () => {
    const content = JSON.stringify({ p: resume().personalInfo, s: resume().sections });
    setTemplate('modern');
    expect(resume().template).toBe('modern');
    setTemplate('minimal');
    expect(JSON.stringify({ p: resume().personalInfo, s: resume().sections })).toBe(content);
  });

  it('keeps formatting overrides across template switches and resets them', () => {
    setSetting('typography', 'baseSize', 11);
    setMargin('all', 20);
    setTemplate('modern');
    const settings = resolveSettings(resume().template, resume().settings);
    expect(settings.typography.baseSize).toBe(11);
    expect(settings.page.margins).toEqual({ top: 20, right: 20, bottom: 20, left: 20 });
    expect(settings.typography.bodyFont).toBe('inter');
    resetSettings();
    expect(resume().settings).toEqual({});
  });
});

describe('a blank resume', () => {
  it('can be built up from scratch', () => {
    state().load(createResume());
    updatePersonal('fullName', 'Sam Lee');
    const education = resume().sections.find((s) => s.type === 'education')!;
    const id = addEntry(education.id)!;
    updateEntry(education.id, id, 'degree', 'BSc Computer Science');
    updateEntry(education.id, id, 'dates', { start: '2022', end: '', current: true });
    const entry = (resume().sections.find((s) => s.id === education.id) as SectionOf<'education'>)
      .entries[0]!;
    expect(entry).toMatchObject({
      degree: 'BSc Computer Science',
      dates: { start: '2022', current: true },
    });
  });
});

describe('example content', () => {
  it('fills an empty resume with the example in its template, undoably', () => {
    const blank = createResume({ title: 'Mine', template: 'claude' });
    state().load(blank);
    expect(resumeIsEmpty(resume())).toBe(true);

    fillWithExample();
    expect(resumeIsEmpty(resume())).toBe(false);
    expect(resume().personalInfo.fullName).toBe('Alex Morgan');
    expect(resume().sections.some((s) => s.type === 'projects' && s.entries.length > 0)).toBe(true);
    // Title, template and formatting are kept.
    expect(resume().metadata.title).toBe('Mine');
    expect(resume().template).toBe('claude');

    expect(state().undo()).toBe('Fill with example content');
    expect(resumeIsEmpty(resume())).toBe(true);
  });
});

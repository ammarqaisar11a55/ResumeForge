import type { Draft } from 'immer';
import {
  createContact,
  createDemoResume,
  createEntry,
  createSection,
  duplicateEntry as cloneEntry,
  duplicateSection as cloneSection,
  getSectionDefinition,
  moveItem,
  type Bullet,
  type ContactItem,
  type ContactKind,
  type DocumentSettings,
  type PersonalInfo,
  type Resume,
  type Section,
  type SectionOptions,
  type SectionType,
  type SettingsOverrides,
  type TemplateId,
  TEMPLATES,
  createId,
} from '@resumeforge/core';
import { useEditorStore, type CommitOptions } from './editorStore';

/**
 * Named document actions. Components call these rather than mutating state,
 * so every change gets an undo label and consistent coalescing.
 */

type EntryRecord = Record<string, unknown> & { id: string };

const commit = (label: string, recipe: (draft: Draft<Resume>) => void, options?: CommitOptions) =>
  useEditorStore.getState().commit(label, recipe, options);

function findSection(draft: Draft<Resume>, sectionId: string): Draft<Section> | undefined {
  return draft.sections.find((s) => s.id === sectionId);
}

function findEntry(
  draft: Draft<Resume>,
  sectionId: string,
  entryId: string,
): EntryRecord | undefined {
  const section = findSection(draft, sectionId);
  return (section?.entries as unknown as EntryRecord[] | undefined)?.find((e) => e.id === entryId);
}

function sectionLabel(sectionId: string): string {
  const section = useEditorStore.getState().resume?.sections.find((s) => s.id === sectionId);
  return section ? getSectionDefinition(section.type).entryNoun : 'entry';
}

/* ------------------------------------------------------------------------ */
/* Document                                                                 */
/* ------------------------------------------------------------------------ */

export function renameResume(title: string) {
  commit('Rename resume', (d) => void (d.metadata.title = title), {
    coalesceKey: 'metadata.title',
  });
}

/** Replace the content with the example resume (undoable); title, template and formatting stay. */
export function fillWithExample() {
  commit('Fill with example content', (d) => {
    const demo = createDemoResume(d.template);
    d.personalInfo = demo.personalInfo;
    d.sections = demo.sections;
  });
}

export function setTemplate(template: TemplateId) {
  commit(`Switch to ${TEMPLATES[template].name}`, (d) => void (d.template = template));
}

/* ------------------------------------------------------------------------ */
/* Personal information                                                     */
/* ------------------------------------------------------------------------ */

export function updatePersonal<K extends 'fullName' | 'headline'>(
  field: K,
  value: PersonalInfo[K],
) {
  commit(
    field === 'fullName' ? 'Edit name' : 'Edit professional title',
    (d) => void (d.personalInfo[field] = value),
    {
      coalesceKey: `personal.${field}`,
    },
  );
}

export function addContact(kind: ContactKind): string {
  const contact = createContact(kind);
  commit('Add contact detail', (d) => void d.personalInfo.contacts.push(contact));
  return contact.id;
}

export function updateContact(id: string, patch: Partial<Omit<ContactItem, 'id'>>) {
  const label =
    'visible' in patch
      ? patch.visible
        ? 'Show contact detail'
        : 'Hide contact detail'
      : 'Edit contact detail';
  commit(
    label,
    (d) => {
      const contact = d.personalInfo.contacts.find((c) => c.id === id);
      if (contact) Object.assign(contact, patch);
    },
    'visible' in patch
      ? undefined
      : { coalesceKey: `contact.${id}.${Object.keys(patch).join(',')}` },
  );
}

export function removeContact(id: string) {
  commit('Remove contact detail', (d) => {
    d.personalInfo.contacts = d.personalInfo.contacts.filter((c) => c.id !== id);
  });
}

export function moveContact(from: number, to: number) {
  commit('Reorder contact details', (d) => {
    d.personalInfo.contacts = moveItem(d.personalInfo.contacts, from, to);
  });
}

/* ------------------------------------------------------------------------ */
/* Sections                                                                 */
/* ------------------------------------------------------------------------ */

export function addSection(type: SectionType): string {
  const section = createSection(type);
  // Most sections are useless empty: start with one entry to fill in.
  const definition = getSectionDefinition(type);
  if (!definition.singleEntry) (section.entries as unknown[]).push(createEntry(type));
  commit(`Add ${definition.label} section`, (d) => void d.sections.push(section as Section));
  useEditorStore.getState().select({ kind: 'section', sectionId: section.id });
  return section.id;
}

export function removeSection(sectionId: string) {
  const section = useEditorStore.getState().resume?.sections.find((s) => s.id === sectionId);
  commit(`Delete ${section?.title || 'section'}`, (d) => {
    d.sections = d.sections.filter((s) => s.id !== sectionId);
  });
  const selection = useEditorStore.getState().selection;
  if (selection.kind === 'section' && selection.sectionId === sectionId) {
    useEditorStore.getState().select({ kind: 'document' });
  }
}

export function duplicateSection(sectionId: string): string | null {
  const section = useEditorStore.getState().resume?.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const copy = cloneSection(section);
  copy.title = `${section.title} (copy)`;
  commit(`Duplicate ${section.title || 'section'}`, (d) => {
    const index = d.sections.findIndex((s) => s.id === sectionId);
    d.sections.splice(index + 1, 0, copy as Draft<Section>);
  });
  return copy.id;
}

export function moveSection(from: number, to: number) {
  commit('Reorder sections', (d) => {
    d.sections = moveItem(d.sections, from, to);
  });
}

export function updateSection(sectionId: string, patch: { title?: string; visible?: boolean }) {
  const label =
    patch.visible === undefined
      ? 'Rename section'
      : patch.visible
        ? 'Show section'
        : 'Hide section';
  commit(
    label,
    (d) => {
      const section = findSection(d, sectionId);
      if (section) Object.assign(section, patch);
    },
    patch.title !== undefined ? { coalesceKey: `section.${sectionId}.title` } : undefined,
  );
}

export function setSectionOption<K extends keyof SectionOptions>(
  sectionId: string,
  key: K,
  value: SectionOptions[K],
) {
  commit('Change section layout', (d) => {
    const section = findSection(d, sectionId);
    if (section) (section.options as SectionOptions)[key] = value;
  });
}

/* ------------------------------------------------------------------------ */
/* Entries                                                                  */
/* ------------------------------------------------------------------------ */

export function addEntry(sectionId: string, init?: Record<string, unknown>): string | null {
  const section = useEditorStore.getState().resume?.sections.find((s) => s.id === sectionId);
  if (!section) return null;
  const entry = { ...createEntry(section.type), ...init } as EntryRecord;
  commit(`Add ${getSectionDefinition(section.type).entryNoun}`, (d) => {
    const target = findSection(d, sectionId);
    (target?.entries as unknown as EntryRecord[] | undefined)?.push(entry);
  });
  useEditorStore.getState().select({ kind: 'section', sectionId, entryId: entry.id });
  return entry.id;
}

export function updateEntry(sectionId: string, entryId: string, field: string, value: unknown) {
  commit(
    `Edit ${sectionLabel(sectionId)}`,
    (d) => {
      const entry = findEntry(d, sectionId, entryId);
      if (entry) entry[field] = value;
    },
    { coalesceKey: `entry.${entryId}.${field}` },
  );
}

export function removeEntry(sectionId: string, entryId: string) {
  commit(`Delete ${sectionLabel(sectionId)}`, (d) => {
    const section = findSection(d, sectionId);
    if (section) {
      (section as { entries: EntryRecord[] }).entries = (
        section.entries as unknown as EntryRecord[]
      ).filter((e) => e.id !== entryId);
    }
  });
}

export function duplicateEntry(sectionId: string, entryId: string): string | null {
  const section = useEditorStore.getState().resume?.sections.find((s) => s.id === sectionId);
  const entry = (section?.entries as unknown as EntryRecord[] | undefined)?.find(
    (e) => e.id === entryId,
  );
  if (!section || !entry) return null;
  const copy = cloneEntry(entry as never) as EntryRecord;
  commit(`Duplicate ${sectionLabel(sectionId)}`, (d) => {
    const entries = findSection(d, sectionId)?.entries as unknown as EntryRecord[] | undefined;
    if (!entries) return;
    const index = entries.findIndex((e) => e.id === entryId);
    entries.splice(index + 1, 0, copy);
  });
  return copy.id;
}

export function moveEntry(sectionId: string, from: number, to: number) {
  commit(`Reorder ${sectionLabel(sectionId)}s`, (d) => {
    const section = findSection(d, sectionId);
    if (section) {
      (section as { entries: unknown[] }).entries = moveItem(
        section.entries as unknown[],
        from,
        to,
      );
    }
  });
}

/* ------------------------------------------------------------------------ */
/* Bullets inside entries                                                   */
/* ------------------------------------------------------------------------ */

function bulletList(
  d: Draft<Resume>,
  sectionId: string,
  entryId: string,
  field: string,
): Bullet[] | undefined {
  const entry = findEntry(d, sectionId, entryId);
  const list = entry?.[field];
  return Array.isArray(list) ? (list as Bullet[]) : undefined;
}

export function addBullet(
  sectionId: string,
  entryId: string,
  field: string,
  afterIndex?: number,
  text = '',
): string {
  const bullet: Bullet = { id: createId(), text };
  commit('Add bullet point', (d) => {
    const list = bulletList(d, sectionId, entryId, field);
    if (!list) return;
    const index = afterIndex === undefined ? list.length : afterIndex + 1;
    list.splice(index, 0, bullet);
  });
  return bullet.id;
}

export function updateBullet(
  sectionId: string,
  entryId: string,
  field: string,
  bulletId: string,
  text: string,
) {
  commit(
    'Edit bullet point',
    (d) => {
      const bullet = bulletList(d, sectionId, entryId, field)?.find((b) => b.id === bulletId);
      if (bullet) bullet.text = text;
    },
    { coalesceKey: `bullet.${bulletId}` },
  );
}

export function removeBullet(sectionId: string, entryId: string, field: string, bulletId: string) {
  commit('Delete bullet point', (d) => {
    const entry = findEntry(d, sectionId, entryId);
    const list = bulletList(d, sectionId, entryId, field);
    if (entry && list) entry[field] = list.filter((b) => b.id !== bulletId);
  });
}

export function moveBullet(
  sectionId: string,
  entryId: string,
  field: string,
  from: number,
  to: number,
) {
  commit('Reorder bullet points', (d) => {
    const entry = findEntry(d, sectionId, entryId);
    const list = bulletList(d, sectionId, entryId, field);
    if (entry && list) entry[field] = moveItem(list, from, to);
  });
}

/* ------------------------------------------------------------------------ */
/* Document settings                                                        */
/* ------------------------------------------------------------------------ */

type SettingsGroup = 'page' | 'typography' | 'spacing' | 'colors' | 'header';

export function setSetting<G extends SettingsGroup, K extends keyof DocumentSettings[G]>(
  group: G,
  key: K,
  value: DocumentSettings[G][K],
  label = 'Change formatting',
) {
  commit(
    label,
    (d) => {
      const overrides = d.settings as SettingsOverrides;
      const target = (overrides[group] ?? {}) as Record<string, unknown>;
      target[key as string] = value;
      (overrides as Record<string, unknown>)[group] = target;
    },
    { coalesceKey: `settings.${group}.${String(key)}` },
  );
}

export function setMargin(side: 'top' | 'right' | 'bottom' | 'left' | 'all', value: number) {
  commit(
    'Change margins',
    (d) => {
      const page = (d.settings.page ??= {});
      const margins = (page.margins ??= {});
      if (side === 'all')
        Object.assign(margins, { top: value, right: value, bottom: value, left: value });
      else margins[side] = value;
    },
    { coalesceKey: `settings.margins.${side}` },
  );
}

export function setDocumentOption<K extends 'dateFormat' | 'bulletStyle'>(
  key: K,
  value: DocumentSettings[K],
) {
  commit('Change formatting', (d) => void ((d.settings as SettingsOverrides)[key] = value));
}

export function resetSettings(group?: SettingsGroup) {
  commit(group ? 'Reset formatting' : 'Reset all formatting', (d) => {
    if (group) delete (d.settings as SettingsOverrides)[group];
    else d.settings = {};
  });
}

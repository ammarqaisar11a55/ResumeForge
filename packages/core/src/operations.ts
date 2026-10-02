import { createId } from './ids';
import { SCHEMA_VERSION } from './schema';
import type { AnyEntry, ContactItem, ContactKind, Resume, Section, TemplateId } from './schema';
import { createSection } from './sections';

/** Return a copy of `items` with the element at `from` moved to `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = items.slice();
  if (from < 0 || from >= result.length || to < 0 || to >= result.length || from === to) {
    return result;
  }
  const [item] = result.splice(from, 1);
  result.splice(to, 0, item as T);
  return result;
}

/** Deep clone that gives every nested `{ id }` object a fresh identifier. */
export function withFreshIds<T>(value: T): T {
  if (Array.isArray(value)) return value.map((v) => withFreshIds(v)) as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = key === 'id' && typeof v === 'string' ? createId() : withFreshIds(v);
    }
    return out as T;
  }
  return value;
}

export function duplicateSection(section: Section): Section {
  return withFreshIds(section);
}

export function duplicateEntry<E extends AnyEntry>(entry: E): E {
  return withFreshIds(entry);
}

export function duplicateResume(resume: Resume, title?: string): Resume {
  const now = new Date().toISOString();
  const copy = withFreshIds(resume);
  return {
    ...copy,
    metadata: { ...copy.metadata, title: title ?? `${resume.metadata.title} (copy)` },
    createdAt: now,
    updatedAt: now,
  };
}

export function createContact(kind: ContactKind, value = ''): ContactItem {
  return { id: createId(), kind, value, label: '', visible: true };
}

export interface CreateResumeOptions {
  title?: string;
  template?: TemplateId;
  fullName?: string;
}

/** A blank resume with the sections most people start from. */
export function createResume(options: CreateResumeOptions = {}): Resume {
  const now = new Date().toISOString();
  return {
    id: createId(),
    schemaVersion: SCHEMA_VERSION,
    metadata: { title: options.title?.trim() || 'Untitled resume', pageCount: 1, tags: [] },
    personalInfo: {
      fullName: options.fullName ?? '',
      headline: '',
      contacts: [
        createContact('email'),
        createContact('phone'),
        createContact('location'),
        createContact('linkedin'),
        createContact('github'),
      ],
    },
    sections: [
      createSection('summary'),
      createSection('education'),
      createSection('experience'),
      createSection('projects'),
      createSection('skills'),
    ],
    template: options.template ?? 'classic',
    settings: {},
    createdAt: now,
    updatedAt: now,
  };
}

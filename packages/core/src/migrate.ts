import type { z } from 'zod';
import {
  ContactItemSchema,
  PersonalInfoSchema,
  ResumeMetadataSchema,
  ResumeSchema,
  SCHEMA_VERSION,
  SectionSchema,
  SettingsOverridesSchema,
  type Resume,
} from './schema';

type Raw = Record<string, unknown>;

/**
 * Ordered migration steps. Step `n` upgrades a document from version `n` to
 * `n + 1`. Version 1 is the first published schema, so there are none yet.
 */
const MIGRATIONS: Record<number, (doc: Raw) => Raw> = {};

export function migrateResume(doc: Raw): Raw {
  let version = typeof doc.schemaVersion === 'number' ? doc.schemaVersion : 1;
  let current = doc;
  while (version < SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (step) current = step(current);
    version += 1;
  }
  return { ...current, schemaVersion: SCHEMA_VERSION };
}

export type LoadResult =
  | { ok: true; resume: Resume; repaired: boolean; droppedItems: number }
  | { ok: false; reason: string };

function isRecord(value: unknown): value is Raw {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Parse an untrusted document (local storage, an import file, an API body).
 * Valid documents parse unchanged. Damaged documents are repaired by dropping
 * only the pieces that cannot be understood, and the caller is told how many
 * items were lost so it can keep a backup and inform the user.
 */
export function loadResume(raw: unknown): LoadResult {
  if (!isRecord(raw)) return { ok: false, reason: 'Not a resume document.' };
  if (typeof raw.id !== 'string' || raw.id.length === 0) {
    return { ok: false, reason: 'The document has no identifier.' };
  }
  const doc = migrateResume(raw);
  const strict = ResumeSchema.safeParse(doc);
  if (strict.success) return { ok: true, resume: strict.data, repaired: false, droppedItems: 0 };

  let dropped = 0;
  const keep = <S extends z.ZodTypeAny>(schema: S, value: unknown, fallback: unknown) => {
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data as z.infer<S>;
    dropped += 1;
    return schema.parse(fallback) as z.infer<S>;
  };

  const rawPersonal = isRecord(doc.personalInfo) ? doc.personalInfo : {};
  const contacts = Array.isArray(rawPersonal.contacts)
    ? rawPersonal.contacts.flatMap((c) => {
        const parsed = ContactItemSchema.safeParse(c);
        if (parsed.success) return [parsed.data];
        dropped += 1;
        return [];
      })
    : [];
  const personalInfo = keep(PersonalInfoSchema, { ...rawPersonal, contacts }, { contacts });

  const sections = Array.isArray(doc.sections)
    ? doc.sections.flatMap((s) => {
        const parsed = SectionSchema.safeParse(s);
        if (parsed.success) return [parsed.data];
        if (!isRecord(s) || !Array.isArray(s.entries)) {
          dropped += 1;
          return [];
        }
        // Keep the section, dropping only the entries that fail to parse.
        const entries = s.entries.filter((entry) => {
          const ok = SectionSchema.safeParse({ ...s, entries: [entry] }).success;
          if (!ok) dropped += 1;
          return ok;
        });
        const retry = SectionSchema.safeParse({ ...s, entries });
        if (retry.success) return [retry.data];
        dropped += 1;
        return [];
      })
    : [];

  const resume = ResumeSchema.parse({
    id: doc.id,
    schemaVersion: SCHEMA_VERSION,
    metadata: keep(ResumeMetadataSchema, doc.metadata, {}),
    personalInfo,
    sections,
    template: doc.template,
    settings: keep(SettingsOverridesSchema, doc.settings, {}),
    createdAt: typeof doc.createdAt === 'string' ? doc.createdAt : undefined,
    updatedAt: typeof doc.updatedAt === 'string' ? doc.updatedAt : undefined,
  });
  return { ok: true, resume, repaired: true, droppedItems: Math.max(dropped, 1) };
}

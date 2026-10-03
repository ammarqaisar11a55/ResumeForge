import type { AnyEntry, Resume, Section } from '@resumeforge/core';

const IGNORED = new Set(['id', 'kind', 'gpaLabel']);

/** True when an entry holds anything the user typed (used to decide whether deleting needs confirmation). */
export function entryHasContent(entry: AnyEntry): boolean {
  return Object.entries(entry).some(([key, value]) => {
    if (IGNORED.has(key)) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (Array.isArray(value)) return value.length > 0;
    if (value && typeof value === 'object')
      return Object.values(value).some((v) => typeof v === 'string' && v.trim() !== '');
    return false;
  });
}

export function sectionHasContent(section: Section): boolean {
  return (section.entries as AnyEntry[]).some(entryHasContent);
}

/** True when a resume has no name and no section content: a blank canvas. */
export function resumeIsEmpty(resume: Resume): boolean {
  return !resume.personalInfo.fullName.trim() && !resume.sections.some(sectionHasContent);
}

import { isRangeInverted, isValidPartialDate } from './dates';
import type { DateRange, Resume, Section } from './schema';
import { entryFields, entryTitle } from './sections';
import { isValidEmail, isValidPhone, isValidUrl, LINK_CONTACT_KINDS } from './urls';

/**
 * Validation never blocks editing. `error` marks something that is almost
 * certainly wrong (an unreadable date, a missing name); `warning` marks
 * something worth a second look. Unusual-but-valid resumes stay possible.
 */
export type IssueSeverity = 'error' | 'warning';

export interface ValidationIssue {
  /** Id of the object the issue belongs to: an entry, a contact, or "personal". */
  targetId: string;
  field: string;
  severity: IssueSeverity;
  message: string;
  sectionId?: string;
  /** Human readable location, e.g. "Education › BSc Software Engineering". */
  location: string;
}

export const PERSONAL_TARGET = 'personal';

export function validateResume(resume: Resume): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { personalInfo } = resume;

  if (!personalInfo.fullName.trim()) {
    issues.push({
      targetId: PERSONAL_TARGET,
      field: 'fullName',
      severity: 'error',
      message: 'Add your name. It is the first thing a recruiter reads.',
      location: 'Personal information',
    });
  }

  for (const contact of personalInfo.contacts) {
    const value = contact.value.trim();
    if (!value) continue;
    const push = (message: string) =>
      issues.push({
        targetId: contact.id,
        field: 'value',
        severity: 'warning',
        message,
        location: 'Personal information',
      });
    if (contact.kind === 'email' && !isValidEmail(value)) push('This does not look like an email address.');
    else if (contact.kind === 'phone' && !isValidPhone(value)) push('Use digits, spaces and an optional leading +.');
    else if (LINK_CONTACT_KINDS.has(contact.kind) && !isValidUrl(value)) push('This link cannot be opened. Check the address.');
  }

  for (const section of resume.sections) {
    validateSection(section, issues);
  }
  return issues;
}

function validateSection(section: Section, issues: ValidationIssue[]): void {
  for (const entry of section.entries) {
    const location = `${section.title || 'Untitled section'} › ${entryTitle(section, entry)}`;
    const record = entry as unknown as Record<string, unknown>;
    const push = (field: string, severity: IssueSeverity, message: string) =>
      issues.push({ targetId: entry.id, field, severity, message, sectionId: section.id, location });

    for (const field of entryFields(section, entry)) {
      const value = record[field.key];
      if (field.kind === 'url' && typeof value === 'string' && !isValidUrl(value)) {
        push(field.key, 'warning', 'This link cannot be opened. Check the address.');
      }
      if (field.kind === 'date' && typeof value === 'string' && !isValidPartialDate(value)) {
        push(field.key, 'error', 'Use a year, or a month and year.');
      }
      if (field.kind === 'date-range' && value && typeof value === 'object') {
        const range = value as DateRange;
        if (!isValidPartialDate(range.start) || (!range.current && !isValidPartialDate(range.end))) {
          push(field.key, 'error', 'Use a year, or a month and year.');
        } else if (isRangeInverted(range)) {
          push(field.key, 'warning', 'The start date is after the end date.');
        }
      }
    }

    if (section.type === 'education') {
      const e = section.entries.find((x) => x.id === entry.id)!;
      const gpaIssue = checkGpa(e.gpa, e.gpaScale);
      if (gpaIssue) push('gpa', 'warning', gpaIssue);
    }
  }
}

/** Returns a message when a GPA looks implausible, otherwise null. */
export function checkGpa(gpa: string, scale: string): string | null {
  const g = gpa.trim();
  if (!g) return null;
  const value = Number(g);
  if (!Number.isFinite(value)) return 'Enter the GPA as a number, e.g. 3.89.';
  if (value < 0) return 'GPA cannot be negative.';
  const s = scale.trim();
  if (s) {
    const max = Number(s);
    if (!Number.isFinite(max) || max <= 0) return 'Enter the scale as a number, e.g. 4.00.';
    if (value > max) return `GPA is higher than the scale of ${s}.`;
    return null;
  }
  if (value > 10) return 'GPA is usually out of 4, 5 or 10. Set the scale if yours differs.';
  return null;
}

export function issuesFor(issues: ValidationIssue[], targetId: string, field?: string): ValidationIssue[] {
  return issues.filter((i) => i.targetId === targetId && (field === undefined || i.field === field));
}

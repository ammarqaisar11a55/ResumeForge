import type { DateRange, DocumentSettings } from './schema';

export type DateFormat = DocumentSettings['dateFormat'];

export interface PartialDate {
  year: number;
  month?: number;
}

const PARTIAL_DATE_RE = /^(\d{4})(?:-(\d{2}))?$/;

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MONTH_NAMES = MONTHS_LONG;

/** Parse `YYYY` or `YYYY-MM`. Returns null for empty or malformed input. */
export function parsePartialDate(value: string | undefined | null): PartialDate | null {
  if (!value) return null;
  const match = PARTIAL_DATE_RE.exec(value.trim());
  if (!match) return null;
  const year = Number(match[1]);
  if (year < 1900 || year > 2100) return null;
  if (match[2] === undefined) return { year };
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function isValidPartialDate(value: string): boolean {
  return value.trim() === '' || parsePartialDate(value) !== null;
}

export function toPartialDateString(date: PartialDate | null): string {
  if (!date) return '';
  return date.month ? `${date.year}-${String(date.month).padStart(2, '0')}` : String(date.year);
}

export function formatPartialDate(value: string, format: DateFormat): string {
  const date = parsePartialDate(value);
  if (!date) return value.trim();
  if (format === 'year' || date.month === undefined) return String(date.year);
  const m = date.month - 1;
  switch (format) {
    case 'short':
      return `${MONTHS_SHORT[m]} ${date.year}`;
    case 'long':
      return `${MONTHS_LONG[m]} ${date.year}`;
    case 'numeric':
      return `${String(date.month).padStart(2, '0')}/${date.year}`;
  }
}

/**
 * Format a range as it appears on the page, e.g. "2023 – Present".
 * Returns an empty string when there is nothing to show.
 */
export function formatDateRange(range: DateRange, format: DateFormat, presentLabel = 'Present'): string {
  const start = range.start ? formatPartialDate(range.start, format) : '';
  const end = range.current ? presentLabel : range.end ? formatPartialDate(range.end, format) : '';
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return start || end;
}

/** Compare two partial dates; a year-only date sorts as January of that year. */
export function comparePartialDates(a: PartialDate, b: PartialDate): number {
  if (a.year !== b.year) return a.year - b.year;
  return (a.month ?? 1) - (b.month ?? 1);
}

/** True when both ends are set and the start is after the end. */
export function isRangeInverted(range: DateRange): boolean {
  if (range.current) return false;
  const start = parsePartialDate(range.start);
  const end = parsePartialDate(range.end);
  if (!start || !end) return false;
  // Year-only dates compare by year so "2023-09 → 2023" is not flagged.
  if (start.month === undefined || end.month === undefined) return start.year > end.year;
  return comparePartialDates(start, end) > 0;
}

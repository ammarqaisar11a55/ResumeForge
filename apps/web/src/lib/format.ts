const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const dateFmt = new Intl.DateTimeFormat('en', { day: 'numeric', month: 'short', year: 'numeric' });

/** "just now", "5 minutes ago", "yesterday", then an absolute date after a week. */
export function formatRelativeTime(iso: string, now: number = Date.now()): string {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return 'Unknown';
  const seconds = Math.round((time - now) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 45) return 'just now';
  if (abs < 60 * 45) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 60 * 60 * 22) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 60 * 60 * 24 * 7) return rtf.format(Math.round(seconds / 86400), 'day');
  return dateFmt.format(time);
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** File-system friendly name: "Alex Morgan Resume.pdf" → "Alex-Morgan-Resume.pdf". */
export function toFileName(base: string, extension: string): string {
  const cleaned = base
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80);
  return `${cleaned || 'Resume'}.${extension}`;
}

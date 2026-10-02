import type { ContactItem, ContactKind } from './schema';

const SAFE_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const HAS_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s().-]{6,24}$/;

/**
 * Turn user input such as "github.com/me" into an absolute, safe URL.
 * Returns an empty string for empty input or unsafe schemes (javascript:, data:...).
 */
export function normalizeUrl(input: string | undefined | null): string {
  const value = (input ?? '').trim();
  if (!value) return '';
  // "localhost:3000" or "example.com:8080/x" look like schemes but are hosts.
  const looksLikeHostPort = /^[\w.-]+:\d+(\/|$)/.test(value);
  const withScheme =
    HAS_SCHEME_RE.test(value) && !looksLikeHostPort ? value : `https://${value.replace(/^\/+/, '')}`;
  try {
    const url = new URL(withScheme);
    if (!SAFE_SCHEMES.has(url.protocol)) return '';
    if ((url.protocol === 'http:' || url.protocol === 'https:') && !url.hostname.includes('.')) {
      return url.hostname === 'localhost' ? url.toString() : '';
    }
    return url.toString();
  } catch {
    return '';
  }
}

export function isValidUrl(input: string): boolean {
  return input.trim() === '' || normalizeUrl(input) !== '';
}

export function isValidEmail(input: string): boolean {
  return EMAIL_RE.test(input.trim());
}

export function isValidPhone(input: string): boolean {
  return PHONE_RE.test(input.trim());
}

/** "https://www.example.com/path/" → "example.com/path" */
export function displayUrl(input: string): string {
  const url = normalizeUrl(input);
  if (!url) return input.trim();
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:') return parsed.pathname;
    const host = parsed.hostname.replace(/^www\./, '');
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/+$/, '');
    return `${host}${path === '/' ? '' : path}`;
  } catch {
    return input.trim();
  }
}

export interface LinkDescription {
  /** Short source label, e.g. "GitHub". Empty for ordinary websites. */
  source: string;
  /** The distinguishing part, e.g. a repository name or a domain. */
  text: string;
}

/**
 * Compact link description used in project headers: GitHub repositories
 * become "GitHub · repo", everything else shows its bare domain and path.
 */
export function describeLink(input: string): LinkDescription {
  const url = normalizeUrl(input);
  if (!url) return { source: '', text: input.trim() };
  const parsed = new URL(url);
  const host = parsed.hostname.replace(/^www\./, '');
  const parts = parsed.pathname.split('/').filter(Boolean);
  if (host === 'github.com' && parts.length >= 2) return { source: 'GitHub', text: parts[1]! };
  if (host === 'gitlab.com' && parts.length >= 2) return { source: 'GitLab', text: parts.slice(1).join('/') };
  return { source: '', text: displayUrl(url) };
}

export const LINK_CONTACT_KINDS: ReadonlySet<ContactKind> = new Set([
  'website',
  'linkedin',
  'github',
  'portfolio',
  'leetcode',
  'other',
]);

/** href for a contact item, or empty when it should not be a link. */
export function contactHref(item: Pick<ContactItem, 'kind' | 'value'>): string {
  const value = item.value.trim();
  if (!value) return '';
  switch (item.kind) {
    case 'email':
      return isValidEmail(value) ? `mailto:${value}` : '';
    case 'phone': {
      const digits = value.replace(/[^\d+]/g, '');
      return digits.length >= 6 ? `tel:${digits}` : '';
    }
    case 'location':
      return '';
    default:
      return normalizeUrl(value);
  }
}

/** Text shown for a contact item: explicit label, else a cleaned-up value. */
export function contactText(item: Pick<ContactItem, 'kind' | 'value' | 'label'>): string {
  if (item.label.trim()) return item.label.trim();
  if (LINK_CONTACT_KINDS.has(item.kind)) return displayUrl(item.value);
  return item.value.trim();
}

import { Fragment, type ReactNode } from 'react';
import { describeLink, normalizeUrl, type Bullet, type SectionOptions } from '@resumeforge/core';
import { atomProps } from './types';

/* -------------------------------------------------------------------------- */
/* Inline text                                                                */
/* -------------------------------------------------------------------------- */

const INLINE_RE = /(\*\*[^*\n]+\*\*|\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

/**
 * Minimal inline formatting for free text: **bold** and *italic* (or _italic_).
 * Anything else renders verbatim, so a stray asterisk never breaks a resume.
 */
export function RichText({ text }: { text: string }): ReactNode {
  if (!text.includes('*') && !text.includes('_')) return text;
  const parts = text.split(INLINE_RE);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part ? <Fragment key={i}>{part}</Fragment> : null;
    if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
    return <em key={i}>{part.slice(1, -1)}</em>;
  });
}

/* -------------------------------------------------------------------------- */
/* Separators and links                                                       */
/* -------------------------------------------------------------------------- */

export const SEPARATORS: Record<NonNullable<SectionOptions['separator']>, string> = {
  comma: ', ',
  dot: ' · ',
  pipe: ' | ',
  slash: ' / ',
};

const isPresent = (item: ReactNode) =>
  item !== null && item !== undefined && item !== false && item !== '';

/** Join non-empty nodes with a separator span. */
export function Joined({
  items,
  separator = ' · ',
}: {
  items: ReactNode[];
  separator?: string;
}): ReactNode {
  const present = items.filter(isPresent);
  return present.map((item, i) => (
    <Fragment key={i}>
      {i > 0 && <span className="rf-sep">{separator}</span>}
      {item}
    </Fragment>
  ));
}

/** A joined line, or null when every item is empty (so no blank line renders). */
export function joinedLine(items: ReactNode[], separator?: string): ReactNode {
  const present = items.filter(isPresent);
  return present.length ? <Joined items={present} separator={separator} /> : null;
}

export function Link({
  href,
  children,
  className,
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const url = normalizeUrl(href);
  if (!url) return <span className={className}>{children}</span>;
  return (
    <a
      className={className ? `rf-link ${className}` : 'rf-link'}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}

/** "GitHub · repo" for repositories, the bare domain for other links. */
export function CompactLink({ url }: { url: string }) {
  const link = describeLink(url);
  return (
    <Link href={url} className="rf-compact-link">
      {link.source ? (
        <>
          {link.source}
          <span className="rf-sep"> · </span>
          {link.text}
        </>
      ) : (
        link.text
      )}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Entry building blocks                                                      */
/* -------------------------------------------------------------------------- */

export interface EntryHeadProps {
  title: ReactNode;
  /** Secondary text after the title, e.g. "Desktop App". */
  meta?: ReactNode[];
  /** Right-aligned content: dates, links. */
  aside?: ReactNode;
  /** Lines below the title row. */
  lines?: ReactNode[];
  /** Free text paragraph(s). */
  description?: string;
}

export function EntryHead({ title, meta = [], aside, lines = [], description }: EntryHeadProps) {
  const metaItems = meta.filter(Boolean);
  const lineItems = lines.filter(Boolean);
  return (
    <>
      <div className="rf-entry-row">
        <h3 className="rf-entry-title">
          <span className="rf-entry-name">{title}</span>
          {metaItems.length > 0 && (
            <span className="rf-entry-meta">
              <span className="rf-sep"> · </span>
              <Joined items={metaItems} />
            </span>
          )}
        </h3>
        {aside ? <div className="rf-entry-aside">{aside}</div> : null}
      </div>
      {lineItems.map((line, i) => (
        <div className="rf-entry-line" key={i}>
          {line}
        </div>
      ))}
      {description?.trim() ? (
        <p className="rf-entry-desc">
          <RichText text={description.trim()} />
        </p>
      ) : null}
    </>
  );
}

export interface EntryFragmentProps {
  entryId: string;
  head: ReactNode;
  bullets: Bullet[];
  from: number;
  to: number;
  continued: boolean;
  className?: string;
}

/**
 * An entry is atom 0 (its head) followed by one atom per bullet. A fragment
 * renders a contiguous slice of those atoms.
 */
export function EntryFragment({
  entryId,
  head,
  bullets,
  from,
  to,
  continued,
  className,
}: EntryFragmentProps) {
  const visibleBullets = bullets.filter((b) => b.text.trim());
  const bulletSlice = visibleBullets.slice(Math.max(from - 1, 0), Math.max(to - 1, 0));
  return (
    <article
      className={className ? `rf-entry ${className}` : 'rf-entry'}
      data-entry-id={entryId}
      data-continued={continued ? '' : undefined}
    >
      {from === 0 && (
        <div className="rf-entry-head" {...atomProps}>
          {head}
        </div>
      )}
      {bulletSlice.length > 0 && (
        <ul className="rf-bullets">
          {bulletSlice.map((bullet) => (
            <li key={bullet.id} {...atomProps}>
              <RichText text={bullet.text.trim()} />
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export function visibleBulletCount(bullets: Bullet[]): number {
  return bullets.filter((b) => b.text.trim()).length;
}

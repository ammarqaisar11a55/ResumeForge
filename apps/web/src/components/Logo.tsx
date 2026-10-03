import { Link } from 'react-router';
import { cn } from '../lib/cn';

/** A folded sheet with a molten line: the document being forged. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-7', className)} aria-hidden="true">
      <rect width="32" height="32" rx="7" className="fill-ink" />
      <path d="M10 7h10l4 4v14H10z" className="fill-surface" />
      <path d="M20 7v4h4" className="fill-line-strong" />
      <rect x="13" y="14" width="8" height="1.6" className="fill-ink" />
      <rect x="13" y="17.5" width="6" height="1.6" className="fill-ink" />
      <rect x="13" y="21" width="7" height="1.6" fill="#f0a51b" />
    </svg>
  );
}

export function Logo({ to = '/', className }: { to?: string; className?: string }) {
  return (
    <Link
      to={to}
      className={cn('inline-flex items-center gap-2 rounded-md', className)}
      aria-label="ResumeForge home"
    >
      <LogoMark />
      <span className="type-title text-[17px] text-ink">ResumeForge</span>
    </Link>
  );
}

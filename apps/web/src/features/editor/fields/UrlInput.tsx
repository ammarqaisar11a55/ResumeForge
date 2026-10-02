import { ExternalLink } from 'lucide-react';
import { displayUrl, normalizeUrl } from '@resumeforge/core';
import { TextInput } from '../../../components/ui/TextInput';

/** URL input that shows what the link will open, so users never type display text twice. */
export function UrlInput({
  id,
  value,
  onChange,
  placeholder,
  describedBy,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  describedBy?: string;
  invalid?: boolean;
}) {
  const href = normalizeUrl(value);
  return (
    <div className="relative">
      <TextInput
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={href ? 'pr-9' : undefined}
      />
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-1/2 right-1.5 flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted hover:bg-raised hover:text-ink"
          aria-label={`Open ${displayUrl(href)} in a new tab`}
          title={`Opens ${displayUrl(href)}`}
        >
          <ExternalLink className="size-3.5" />
        </a>
      )}
    </div>
  );
}

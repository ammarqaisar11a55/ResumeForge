import { X } from 'lucide-react';
import { useId, useRef, useState, type KeyboardEvent } from 'react';
import { cn } from '../../../lib/cn';

export interface TagsFieldProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

/**
 * Chip input. Enter or comma adds; pasting a comma separated list adds every
 * item; Backspace in the empty input removes the last chip.
 */
export function TagsField({ label, value, onChange, placeholder }: TagsFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const add = (text: string) => {
    const items = text
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (items.length === 0) return;
    const existing = new Set(value.map((v) => v.toLowerCase()));
    const fresh = items.filter((item) => {
      const key = item.toLowerCase();
      if (existing.has(key)) return false;
      existing.add(key);
      return true;
    });
    if (fresh.length) onChange([...value, ...fresh]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && draft === '' && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        {label}
      </label>
      <div
        className={cn(
          'flex min-h-9 flex-wrap items-center gap-1 rounded-md border border-line-strong bg-surface px-1.5 py-1',
          'focus-within:border-focus hover:border-faint',
        )}
        onClick={(e) => e.target === e.currentTarget && inputRef.current?.focus()}
      >
        <ul className="contents" aria-label={`${label} list`}>
          {value.map((tag, i) => (
            <li key={`${tag}-${i}`} className="flex h-6 items-center gap-0.5 rounded bg-raised pr-0.5 pl-2 text-[13px] text-ink">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                className="flex size-5 items-center justify-center rounded text-muted hover:bg-line hover:text-ink"
                aria-label={`Remove ${tag}`}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <input
          ref={inputRef}
          id={id}
          value={draft}
          onChange={(e) => {
            if (e.target.value.includes(',')) add(e.target.value);
            else setDraft(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => add(draft)}
          placeholder={value.length === 0 ? placeholder : 'Add more'}
          className="h-6 min-w-24 flex-1 bg-transparent px-1 text-sm placeholder:text-faint focus:outline-none"
        />
      </div>
    </div>
  );
}

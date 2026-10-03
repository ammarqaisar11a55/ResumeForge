import { useId, useState } from 'react';
import { contrastRatio } from '@resumeforge/core';

export interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** Warn when contrast against white paper falls below this ratio. */
  minContrast?: number;
}

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export function ColorField({ label, value, onChange, minContrast }: ColorFieldProps) {
  const id = useId();
  const [draft, setDraft] = useState(value);
  const [synced, setSynced] = useState(value);
  // Follow external changes (undo, reset) without an effect.
  if (value !== synced) {
    setSynced(value);
    setDraft(value);
  }
  const lowContrast =
    minContrast !== undefined &&
    HEX_RE.test(value) &&
    contrastRatio(value, '#ffffff') < minContrast;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX_RE.test(value) ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} colour picker`}
          className="size-7 shrink-0 cursor-pointer rounded border border-line-strong bg-transparent p-0.5 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <label htmlFor={id} className="flex-1 text-[13px] font-medium text-ink">
          {label}
        </label>
        <input
          id={id}
          value={draft}
          spellCheck={false}
          onChange={(e) => {
            setDraft(e.target.value);
            if (HEX_RE.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setDraft(value)}
          className="tabular h-7 w-20 rounded-md border border-line-strong bg-surface px-1.5 text-[13px] uppercase focus:border-focus focus:outline-none"
        />
      </div>
      {lowContrast && (
        <p className="text-xs text-warning">
          Low contrast on white paper. Text may be hard to read when printed.
        </p>
      )}
    </div>
  );
}

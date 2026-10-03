import * as RadixSlider from '@radix-ui/react-slider';
import { useId, useState } from 'react';
import { clamp } from '@resumeforge/core';
import { cn } from '../../lib/cn';

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  /** Digits shown in the numeric input. */
  precision?: number;
  className?: string;
}

/**
 * Slider with a linked numeric input. Values are clamped into [min, max] so
 * the document can never be pushed into an unreadable state.
 */
export function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  precision,
  className,
}: SliderFieldProps) {
  const id = useId();
  const digits = precision ?? (step < 0.01 ? 3 : step < 1 ? 2 : 0);
  const [draft, setDraft] = useState(value.toFixed(digits));
  const [editing, setEditing] = useState(false);

  const [synced, setSynced] = useState(value);
  // Follow external changes (dragging the slider, undo) unless the user is typing.
  if (!editing && value !== synced) {
    setSynced(value);
    setDraft(value.toFixed(digits));
  }

  const commitDraft = () => {
    setEditing(false);
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) onChange(clamp(Math.round(parsed / step) * step, min, max));
    else setDraft(value.toFixed(digits));
  };

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`${id}-input`} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        <div className="flex items-center gap-1">
          <input
            id={`${id}-input`}
            inputMode="decimal"
            className="tabular h-7 w-16 rounded-md border border-line-strong bg-surface px-1.5 text-right text-[13px] focus:border-focus focus:outline-none"
            value={draft}
            onFocus={() => setEditing(true)}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitDraft}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setDraft(value.toFixed(digits));
                setEditing(false);
              }
            }}
            aria-label={`${label}${unit ? ` in ${unit}` : ''}`}
          />
          {unit && <span className="w-6 text-xs text-muted">{unit}</span>}
        </div>
      </div>
      <RadixSlider.Root
        className="relative flex h-4 touch-none items-center select-none"
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => v !== undefined && onChange(v)}
        aria-label={label}
      >
        <RadixSlider.Track className="relative h-1 grow rounded-full bg-line">
          <RadixSlider.Range className="absolute h-full rounded-full bg-ink" />
        </RadixSlider.Track>
        <RadixSlider.Thumb className="block size-3.5 rounded-full border-2 border-ink bg-surface shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus" />
      </RadixSlider.Root>
    </div>
  );
}

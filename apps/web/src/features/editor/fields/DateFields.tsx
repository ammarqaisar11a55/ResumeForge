import { useId, useState } from 'react';
import { MONTH_NAMES, parsePartialDate, type DateRange, type ValidationIssue } from '@resumeforge/core';
import { cn } from '../../../lib/cn';
import { inputClass } from '../../../components/ui/Field';
import { Switch } from '../../../components/ui/Switch';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface PartialDateInputProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  disabled?: boolean;
  invalid?: boolean;
}

/** Month (optional) + year. Emits "YYYY", "YYYY-MM" or "". */
export function PartialDateInput({ value, onChange, label, disabled, invalid }: PartialDateInputProps) {
  const id = useId();
  const parsed = parsePartialDate(value);
  const [year, setYear] = useState(parsed ? String(parsed.year) : value.slice(0, 4));
  const month = parsed?.month ?? 0;

  const [synced, setSynced] = useState(value);
  // Follow external changes (undo, duplicate) without an effect.
  if (value !== synced) {
    setSynced(value);
    setYear(parsed ? String(parsed.year) : value.replace(/-.*$/, ''));
  }

  const emit = (nextYear: string, nextMonth: number) => {
    if (!nextYear) return onChange('');
    if (!/^\d{4}$/.test(nextYear)) return onChange(nextYear);
    onChange(nextMonth ? `${nextYear}-${String(nextMonth).padStart(2, '0')}` : nextYear);
  };

  return (
    <fieldset className="flex min-w-0 flex-col gap-1" disabled={disabled}>
      <legend className="mb-1 text-xs text-muted">{label}</legend>
      <div className="flex gap-1.5">
        <select
          aria-label={`${label} month`}
          className={cn(inputClass, 'h-9 w-[5.5rem] shrink-0 px-1.5')}
          value={month}
          onChange={(e) => emit(year, Number(e.target.value))}
        >
          <option value={0}>Month</option>
          {MONTH_NAMES.map((name, i) => (
            <option key={name} value={i + 1}>
              {name.slice(0, 3)}
            </option>
          ))}
        </select>
        <input
          id={id}
          aria-label={`${label} year`}
          aria-invalid={invalid || undefined}
          inputMode="numeric"
          placeholder="Year"
          maxLength={4}
          className={cn(inputClass, 'h-9 min-w-0 flex-1 tabular')}
          value={year}
          onChange={(e) => {
            const next = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
            setYear(next);
            if (next.length === 4 || next.length === 0) emit(next, month);
          }}
          onBlur={() => {
            if (year.length > 0 && year.length < 4) emit(year, month);
          }}
        />
      </div>
    </fieldset>
  );
}

function IssueMessage({ issues }: { issues: ValidationIssue[] }) {
  const issue = issues.find((i) => i.severity === 'error') ?? issues[0];
  if (!issue) return null;
  return (
    <p className={cn('flex items-start gap-1.5 text-xs', issue.severity === 'error' ? 'text-danger' : 'text-warning')}>
      {issue.severity === 'error' ? <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden /> : <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />}
      {issue.message}
    </p>
  );
}

export function DateField({
  label,
  value,
  onChange,
  issues = [],
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  issues?: ValidationIssue[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <PartialDateInput label="Date" value={value} onChange={onChange} invalid={issues.some((i) => i.severity === 'error')} />
      <IssueMessage issues={issues} />
    </div>
  );
}

export function DateRangeField({
  label,
  value,
  onChange,
  currentLabel = 'Ongoing',
  issues = [],
}: {
  label: string;
  value: DateRange;
  onChange: (value: DateRange) => void;
  currentLabel?: string;
  issues?: ValidationIssue[];
}) {
  const invalid = issues.some((i) => i.severity === 'error');
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-ink">{label}</span>
      <div className="grid grid-cols-2 gap-2.5">
        <PartialDateInput label="Start" value={value.start} invalid={invalid} onChange={(start) => onChange({ ...value, start })} />
        {value.current ? (
          <div className="flex flex-col gap-1">
            <span className="mb-1 text-xs text-muted">End</span>
            <div className="flex h-9 items-center rounded-md border border-dashed border-line-strong px-2.5 text-sm text-muted">Present</div>
          </div>
        ) : (
          <PartialDateInput label="End" value={value.end} invalid={invalid} onChange={(end) => onChange({ ...value, end })} />
        )}
      </div>
      <Switch label={currentLabel} checked={value.current} onCheckedChange={(current) => onChange({ ...value, current })} />
      <IssueMessage issues={issues} />
    </div>
  );
}

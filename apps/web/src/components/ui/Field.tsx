import { useId, type ReactNode } from 'react';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import type { ValidationIssue } from '@resumeforge/core';
import { cn } from '../../lib/cn';

export interface FieldProps {
  label: string;
  hint?: ReactNode;
  issues?: ValidationIssue[];
  className?: string;
  /** Render prop receiving the control id and describedby id. */
  children: (ids: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
  labelAside?: ReactNode;
  hideLabel?: boolean;
}

/** Label, control, hint and validation message wired together for assistive tech. */
export function Field({
  label,
  hint,
  issues = [],
  className,
  children,
  labelAside,
  hideLabel,
}: FieldProps) {
  const id = useId();
  const messageId = `${id}-message`;
  const issue = issues.find((i) => i.severity === 'error') ?? issues[0];
  const hasMessage = Boolean(issue || hint);
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <div className={cn('flex items-center justify-between gap-2', hideLabel && 'sr-only')}>
        <label htmlFor={id} className="text-[13px] font-medium text-ink">
          {label}
        </label>
        {labelAside}
      </div>
      {children({
        id,
        describedBy: hasMessage ? messageId : undefined,
        invalid: issue?.severity === 'error',
      })}
      {issue ? (
        <p
          id={messageId}
          className={cn(
            'flex items-start gap-1.5 text-xs leading-snug',
            issue.severity === 'error' ? 'text-danger' : 'text-warning',
          )}
        >
          {issue.severity === 'error' ? (
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden />
          ) : (
            <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          )}
          {issue.message}
        </p>
      ) : hint ? (
        <p id={messageId} className="text-xs leading-snug text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const inputClass =
  'w-full min-w-0 rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink placeholder:text-faint transition-colors duration-150 hover:border-faint focus:border-focus focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-focus aria-[invalid=true]:border-danger disabled:opacity-60';

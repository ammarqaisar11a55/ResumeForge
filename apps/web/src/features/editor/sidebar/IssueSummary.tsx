import * as Popover from '@radix-ui/react-popover';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PERSONAL_TARGET } from '@resumeforge/core';
import { cn } from '../../../lib/cn';
import { useEditorStore } from '../../../state/editorStore';
import { useIssues } from '../issuesContext';
import { useSidebarStore } from './sidebarStore';

/** Footer summarising validation. Informational only: nothing is blocked. */
export function IssueSummary() {
  const issues = useIssues();
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.length - errors;

  if (issues.length === 0) {
    return (
      <div className="flex h-10 shrink-0 items-center gap-2 border-t border-line px-3 text-xs text-muted">
        <CheckCircle2 className="size-4 text-success" aria-hidden />
        No problems found
      </div>
    );
  }

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="flex h-10 shrink-0 items-center gap-3 border-t border-line px-3 text-left text-xs hover:bg-raised"
        >
          {errors > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-danger">
              <AlertCircle className="size-4" aria-hidden />
              {errors} to fix
            </span>
          )}
          {warnings > 0 && (
            <span className="flex items-center gap-1.5 font-medium text-warning">
              <AlertTriangle className="size-4" aria-hidden />
              {warnings} to review
            </span>
          )}
          <span className="ml-auto text-muted">Show</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={12}
          className="z-50 max-h-80 w-80 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-pop"
        >
          <ul>
            {issues.map((issue, i) => (
              <li key={`${issue.targetId}-${issue.field}-${i}`}>
                <Popover.Close asChild>
                  <button
                    type="button"
                    className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left hover:bg-raised"
                    onClick={() => {
                      const sidebar = useSidebarStore.getState();
                      const editor = useEditorStore.getState();
                      if (issue.sectionId) {
                        editor.select({ kind: 'section', sectionId: issue.sectionId, entryId: issue.targetId });
                        sidebar.reveal(issue.sectionId, issue.targetId);
                      } else {
                        editor.select({ kind: 'header' });
                        sidebar.reveal('__header');
                      }
                    }}
                  >
                    {issue.severity === 'error' ? (
                      <AlertCircle className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    )}
                    <span className="flex min-w-0 flex-col">
                      <span className="text-[13px] text-ink">{issue.message}</span>
                      <span className={cn('truncate text-xs text-muted')}>
                        {issue.targetId === PERSONAL_TARGET ? 'Personal information' : issue.location}
                      </span>
                    </span>
                  </button>
                </Popover.Close>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

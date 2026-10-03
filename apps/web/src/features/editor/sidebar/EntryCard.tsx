import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import {
  entrySubtitle,
  entryTitle,
  type AnyEntry,
  type Section,
  type SectionType,
  type ValidationIssue,
} from '@resumeforge/core';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { IconButton } from '../../../components/ui/IconButton';
import { cn } from '../../../lib/cn';
import { MOD_LABEL } from '../../../lib/platform';
import { duplicateEntry, removeEntry } from '../../../state/editorActions';
import { useEditorStore } from '../../../state/editorStore';
import { EntryForm } from '../fields/EntryForm';
import { issuesKey } from '../fields/issuesKey';
import { DragHandle, type DragHandleProps } from '../fields/SortableList';
import { entryHasContent } from './content';
import { useSidebarStore } from './sidebarStore';

interface EntryCardProps {
  sectionId: string;
  sectionType: SectionType;
  entry: AnyEntry;
  index: number;
  handle: DragHandleProps;
  dragging: boolean;
  issues: ValidationIssue[];
  noun: string;
  /** Extra controls rendered above the form (e.g. the figure/text switch for achievements). */
  header?: React.ReactNode;
}

export const EntryCard = memo(
  function EntryCard({
    sectionId,
    sectionType,
    entry,
    index,
    handle,
    dragging,
    issues,
    noun,
    header,
  }: EntryCardProps) {
    const open = useSidebarStore((s) => Boolean(s.openEntries[entry.id]));
    const toggle = useSidebarStore((s) => s.toggleEntry);
    const selected = useEditorStore(
      (s) =>
        s.selection.kind === 'section' &&
        s.selection.sectionId === sectionId &&
        s.selection.entryId === entry.id,
    );
    const [confirming, setConfirming] = useState(false);
    const section = { type: sectionType } as Section;
    const title = entryTitle(section, entry);
    const subtitle = entrySubtitle(section, entry);
    const errorCount = issues.filter((i) => i.severity === 'error').length;
    const warningCount = issues.length - errorCount;

    const remove = () =>
      entryHasContent(entry) ? setConfirming(true) : removeEntry(sectionId, entry.id);

    return (
      <div
        data-editor-entry={entry.id}
        className={cn(
          'rounded-md border bg-surface transition-shadow duration-150',
          selected ? 'border-accent' : 'border-line',
          dragging && 'shadow-pop',
        )}
      >
        <div className="flex items-center gap-1 py-1 pr-1 pl-1">
          <DragHandle handle={handle} label={`Reorder ${noun} ${index + 1}: ${title}`} />
          <button
            type="button"
            aria-expanded={open}
            className="flex min-w-0 flex-1 flex-col items-start rounded px-1 py-0.5 text-left"
            onClick={() => {
              toggle(entry.id);
              useEditorStore.getState().select({ kind: 'section', sectionId, entryId: entry.id });
            }}
          >
            <span className="flex w-full items-center gap-1.5">
              <span className="truncate text-[13px] font-medium text-ink">{title}</span>
              {(errorCount > 0 || warningCount > 0) && (
                <span
                  className={cn(
                    'size-1.5 shrink-0 rounded-full',
                    errorCount ? 'bg-danger' : 'bg-accent',
                  )}
                  role="img"
                  aria-label={`${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to review`}
                />
              )}
            </span>
            {subtitle && <span className="w-full truncate text-xs text-muted">{subtitle}</span>}
          </button>
          <IconButton
            label={`Duplicate ${noun}`}
            size="xs"
            onClick={() => duplicateEntry(sectionId, entry.id)}
          >
            <Copy className="size-3.5" />
          </IconButton>
          <IconButton label={`Delete ${noun}`} size="xs" onClick={remove}>
            <Trash2 className="size-3.5" />
          </IconButton>
          <IconButton
            label={open ? `Collapse ${noun}` : `Expand ${noun}`}
            size="xs"
            onClick={() => toggle(entry.id)}
          >
            <ChevronDown
              className={cn('size-3.5 transition-transform duration-200', open && 'rotate-180')}
            />
          </IconButton>
        </div>
        {open && (
          <div className="flex flex-col gap-3 border-t border-line px-3 pt-3 pb-3.5">
            {header}
            <EntryForm
              sectionId={sectionId}
              sectionType={sectionType}
              entry={entry}
              issues={issues}
            />
          </div>
        )}
        <ConfirmDialog
          open={confirming}
          onOpenChange={setConfirming}
          title={`Delete this ${noun}?`}
          description={`“${title}” will be removed from your resume. You can undo this with ${MOD_LABEL}+Z.`}
          confirmLabel={`Delete ${noun}`}
          onConfirm={() => removeEntry(sectionId, entry.id)}
        />
      </div>
    );
  },
  (a, b) =>
    a.entry === b.entry &&
    a.index === b.index &&
    a.dragging === b.dragging &&
    a.sectionId === b.sectionId &&
    a.header === b.header &&
    a.handle.listeners === b.handle.listeners &&
    a.handle.attributes === b.handle.attributes &&
    issuesKey(a.issues) === issuesKey(b.issues),
);

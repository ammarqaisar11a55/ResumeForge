import { summaryGuidance, type SectionOf } from '@resumeforge/core';
import { cn } from '../../../lib/cn';
import { updateEntry } from '../../../state/editorActions';
import { RichTextArea } from '../fields/RichTextArea';

const STATUS_STYLES = {
  empty: 'text-muted',
  short: 'text-warning',
  good: 'text-success',
  long: 'text-warning',
  'too-long': 'text-danger',
} as const;

/** Plain-text summary with length guidance. */
export function SummaryEditor({ section }: { section: SectionOf<'summary'> }) {
  const entry = section.entries[0];
  if (!entry) return null;
  const guidance = summaryGuidance(entry.text);
  const id = `summary-${entry.id}`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-ink">
        Summary
      </label>
      <RichTextArea
        id={id}
        rows={5}
        value={entry.text}
        placeholder="Software engineering student focused on… I build… Looking for…"
        aria-describedby={`${id}-guidance`}
        onChange={(text) => updateEntry(section.id, entry.id, 'text', text)}
      />
      <div id={`${id}-guidance`} className="flex items-center justify-between gap-3 text-xs" aria-live="polite">
        <span className={cn('font-medium', STATUS_STYLES[guidance.status])}>{guidance.message}</span>
        <span className="tabular shrink-0 text-muted">
          {guidance.words} words · {guidance.characters} characters
        </span>
      </div>
    </div>
  );
}

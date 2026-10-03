import { AlertCircle, Check, Loader2 } from 'lucide-react';
import { flushSave } from '../../hooks/useAutosave';
import { cn } from '../../lib/cn';
import { useEditorStore } from '../../state/editorStore';
import { Tooltip } from '../../components/ui/Tooltip';

/** "Saving…", "Saved" or "Unsaved changes". Resumes are stored only in this browser. */
export function SaveIndicator() {
  const status = useEditorStore((s) => s.saveStatus);
  const error = useEditorStore((s) => s.saveError);

  let icon = <Check className="size-3.5" aria-hidden />;
  let text = 'Saved';
  let hint = 'Saved in this browser. Download a backup from My resumes to keep a copy.';
  let tone = 'text-muted';

  if (status === 'saving') {
    icon = <Loader2 className="size-3.5 animate-spin" aria-hidden />;
    text = 'Saving…';
  } else if (status === 'unsaved') {
    icon = <span className="size-1.5 rounded-full bg-accent" aria-hidden />;
    text = 'Unsaved changes';
    hint = 'Changes save automatically in a moment';
  } else if (status === 'error') {
    icon = <AlertCircle className="size-3.5" aria-hidden />;
    text = 'Not saved';
    hint = `${error ?? 'Saving failed.'} Click to retry.`;
    tone = 'text-danger';
  }

  return (
    <Tooltip content={hint}>
      <button
        type="button"
        onClick={() => flushSave()}
        className={cn(
          'flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium whitespace-nowrap hover:bg-raised',
          tone,
        )}
        aria-live="polite"
        data-testid="save-status"
      >
        {icon}
        {text}
      </button>
    </Tooltip>
  );
}

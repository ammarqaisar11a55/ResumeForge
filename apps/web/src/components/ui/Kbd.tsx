import { cn } from '../../lib/cn';

export function Kbd({ keys, inverted, className }: { keys: string[]; inverted?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-0.5', className)}>
      {keys.map((key) => (
        <kbd
          key={key}
          className={cn(
            'inline-flex h-5 min-w-5 items-center justify-center rounded px-1 font-sans text-[11px] font-semibold',
            inverted ? 'bg-surface/15 text-surface' : 'border border-line-strong bg-raised text-muted',
          )}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

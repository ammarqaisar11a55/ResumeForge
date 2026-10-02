import { Eye, ListTree, SlidersHorizontal } from 'lucide-react';
import { cn } from '../../../lib/cn';
import { useUiStore } from '../../../state/uiStore';

const TABS = [
  { id: 'edit', label: 'Edit', icon: ListTree },
  { id: 'preview', label: 'Preview', icon: Eye },
  { id: 'design', label: 'Design', icon: SlidersHorizontal },
] as const;

/** Bottom navigation for phones and tablets: one panel at a time. */
export function MobileTabs() {
  const tab = useUiStore((s) => s.mobileTab);
  const setTab = useUiStore((s) => s.setMobileTab);
  return (
    <nav
      className="flex shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      aria-label="Editor panels"
    >
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          aria-current={tab === id ? 'page' : undefined}
          className={cn(
            'relative flex h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium',
            tab === id ? 'text-ink' : 'text-muted',
          )}
        >
          {tab === id && <span className="absolute top-0 h-0.5 w-10 rounded-full bg-accent" aria-hidden />}
          <Icon className="size-5" aria-hidden />
          {label}
        </button>
      ))}
    </nav>
  );
}

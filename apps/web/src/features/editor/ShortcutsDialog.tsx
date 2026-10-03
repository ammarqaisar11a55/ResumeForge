import { Dialog } from '../../components/ui/Dialog';
import { Kbd } from '../../components/ui/Kbd';
import { MOD_LABEL } from '../../lib/platform';
import { useUiStore } from '../../state/uiStore';
import { SHORTCUTS } from './shortcuts';

const EDITING_TIPS: { label: string; keys: string[] }[] = [
  { label: 'New bullet below', keys: ['Enter'] },
  { label: 'Line break inside a bullet', keys: ['Shift', 'Enter'] },
  { label: 'Delete an empty bullet', keys: ['Backspace'] },
  { label: 'Bold / italic selected text', keys: [MOD_LABEL, 'B'] },
  { label: 'Pick up a dragged item', keys: ['Space'] },
  { label: 'Move a picked-up item', keys: ['↑', '↓'] },
];

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen} title="Keyboard shortcuts" className="max-w-lg">
      <div className="grid gap-6 sm:grid-cols-2">
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">Editor</h3>
          <ul className="flex flex-col gap-2">
            {Object.values(SHORTCUTS).map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{s.label}</span>
                <span className="flex flex-col items-end gap-1">
                  <Kbd keys={s.keys} />
                  {s.alternatives?.map((alt) => (
                    <Kbd key={alt.join('+')} keys={alt} />
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h3 className="mb-2 text-xs font-medium text-muted">While editing</h3>
          <ul className="flex flex-col gap-2">
            {EDITING_TIPS.map((tip) => (
              <li key={tip.label} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-ink">{tip.label}</span>
                <Kbd keys={tip.keys} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Dialog>
  );
}

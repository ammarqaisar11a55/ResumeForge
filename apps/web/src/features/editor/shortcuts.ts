import { MOD_LABEL } from '../../lib/platform';

export type ShortcutId =
  | 'undo'
  | 'redo'
  | 'save'
  | 'print'
  | 'export'
  | 'preview'
  | 'toggle-sections'
  | 'toggle-design'
  | 'help';

export interface ShortcutDef {
  id: ShortcutId;
  label: string;
  keys: string[];
  /** Alternative key combinations, shown in the help dialog. */
  alternatives?: string[][];
}

/** Single source of truth for editor shortcuts: used by the handler, tooltips and the help dialog. */
export const SHORTCUTS: Record<ShortcutId, ShortcutDef> = {
  undo: { id: 'undo', label: 'Undo', keys: [MOD_LABEL, 'Z'] },
  redo: { id: 'redo', label: 'Redo', keys: [MOD_LABEL, 'Shift', 'Z'], alternatives: [[MOD_LABEL, 'Y']] },
  save: { id: 'save', label: 'Save now', keys: [MOD_LABEL, 'S'] },
  print: { id: 'print', label: 'Print resume', keys: [MOD_LABEL, 'P'] },
  export: { id: 'export', label: 'Download PDF', keys: [MOD_LABEL, 'Shift', 'E'] },
  preview: { id: 'preview', label: 'Focus preview', keys: [MOD_LABEL, 'Shift', 'F'] },
  'toggle-sections': { id: 'toggle-sections', label: 'Show or hide sections panel', keys: [MOD_LABEL, '\\'] },
  'toggle-design': { id: 'toggle-design', label: 'Show or hide design panel', keys: [MOD_LABEL, 'Shift', '\\'] },
  help: { id: 'help', label: 'Keyboard shortcuts', keys: ['?'], alternatives: [[MOD_LABEL, '/']] },
};

/** Match a keyboard event to a shortcut. `typing` is true when focus is in a text field. */
export function matchShortcut(event: KeyboardEvent, mod: boolean, typing: boolean): ShortcutId | null {
  const key = event.key.toLowerCase();
  const code = event.code;
  if (mod) {
    if (code === 'KeyZ') return event.shiftKey ? 'redo' : 'undo';
    if (code === 'KeyY' && !event.shiftKey) return 'redo';
    if (code === 'KeyS' && !event.shiftKey) return 'save';
    if (code === 'KeyP' && !event.shiftKey) return 'print';
    if (code === 'KeyE' && event.shiftKey) return 'export';
    if (code === 'KeyF' && event.shiftKey) return 'preview';
    if (code === 'Backslash') return event.shiftKey ? 'toggle-design' : 'toggle-sections';
    if (code === 'Slash') return 'help';
    return null;
  }
  if (!typing && key === '?' && !event.altKey) return 'help';
  return null;
}

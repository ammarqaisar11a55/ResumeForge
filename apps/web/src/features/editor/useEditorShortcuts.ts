import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { flushSave } from '../../hooks/useAutosave';
import { isModKey } from '../../lib/platform';
import { useEditorStore } from '../../state/editorStore';
import { useUiStore } from '../../state/uiStore';
import { matchShortcut, type ShortcutId } from './shortcuts';

export interface ShortcutHandlers {
  print: () => void;
  exportPdf: () => void;
}

export function runHistory(direction: 'undo' | 'redo') {
  const label = direction === 'undo' ? useEditorStore.getState().undo() : useEditorStore.getState().redo();
  toast(label ? `${direction === 'undo' ? 'Undone' : 'Redone'}: ${label}` : `Nothing to ${direction}`, {
    id: 'history',
    duration: 1600,
  });
}

/** Global editor keyboard shortcuts. */
export function useEditorShortcuts(handlers: ShortcutHandlers): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const run = (id: ShortcutId) => {
      const ui = useUiStore.getState();
      switch (id) {
        case 'undo':
        case 'redo':
          runHistory(id);
          break;
        case 'save':
          if (flushSave()) toast.success('All changes saved', { id: 'saved', duration: 1600 });
          break;
        case 'print':
          ref.current.print();
          break;
        case 'export':
          ref.current.exportPdf();
          break;
        case 'preview':
          ui.togglePreviewMode();
          break;
        case 'toggle-sections':
          ui.toggleSections();
          break;
        case 'toggle-design':
          if (window.matchMedia('(min-width: 1280px)').matches) ui.toggleDesign();
          else ui.setDesignDrawerOpen(!ui.designDrawerOpen);
          break;
        case 'help':
          ui.setShortcutsOpen(true);
          break;
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      const target = event.target instanceof HTMLElement ? event.target : null;
      // Dialogs own their keyboard; shortcuts would act on the document behind them.
      if (target?.closest('[role="dialog"], [role="alertdialog"]')) return;
      const typing = Boolean(target?.closest('input, textarea, select, [contenteditable="true"]'));
      const id = matchShortcut(event, isModKey(event), typing);
      if (!id) {
        if (event.key === 'Escape' && !typing && useUiStore.getState().previewMode) {
          useUiStore.getState().togglePreviewMode();
        }
        return;
      }
      event.preventDefault();
      run(id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
}

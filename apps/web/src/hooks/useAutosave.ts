import { useEffect } from 'react';
import { toast } from 'sonner';
import { resumeService } from '../services';
import { useEditorStore } from '../state/editorStore';

const AUTOSAVE_DELAY_MS = 600;

/**
 * Persist the open resume immediately (synchronously, to this browser).
 * Returns false if the write failed, e.g. because storage is full.
 */
export function flushSave(): boolean {
  const { resume, revision, savedRevision, markSaving, markSaved, markSaveError } = useEditorStore.getState();
  if (!resume || revision === savedRevision) return true;
  markSaving();
  try {
    resumeService.save(resume);
    markSaved(revision);
    return true;
  } catch (error) {
    const message = (error as Error).message || 'Your changes could not be saved.';
    markSaveError(message);
    toast.error('Changes not saved', { id: 'save-error', description: message, duration: 10_000 });
    return false;
  }
}

/** Debounced autosave of every document change, plus a flush on unmount. */
export function useAutosave(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.revision === prev.revision || !state.resume) return;
      clearTimeout(timer);
      timer = setTimeout(flushSave, AUTOSAVE_DELAY_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
      flushSave();
    };
  }, []);
}

/**
 * Guard against refreshes and closed tabs: flush synchronously, and only ask
 * the browser to confirm leaving if the flush failed.
 */
export function useUnloadProtection(): void {
  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!flushSave()) {
        event.preventDefault();
        // Required by some browsers to show the confirmation.
        event.returnValue = '';
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushSave();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}

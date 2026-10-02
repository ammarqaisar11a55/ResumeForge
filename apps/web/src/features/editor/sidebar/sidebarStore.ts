import { create } from 'zustand';

interface SidebarState {
  personalOpen: boolean;
  openSections: Record<string, boolean>;
  openEntries: Record<string, boolean>;
  setPersonalOpen: (open: boolean) => void;
  toggleSection: (id: string, open?: boolean) => void;
  toggleEntry: (id: string, open?: boolean) => void;
  /** Expand a section (and entry) and scroll it into view, e.g. after a click in the preview. */
  reveal: (sectionId: string, entryId?: string) => void;
  reset: () => void;
}

export const useSidebarStore = create<SidebarState>()((set, get) => ({
  personalOpen: true,
  openSections: {},
  openEntries: {},
  setPersonalOpen: (personalOpen) => set({ personalOpen }),
  toggleSection: (id, open) =>
    set({ openSections: { ...get().openSections, [id]: open ?? !get().openSections[id] } }),
  toggleEntry: (id, open) => set({ openEntries: { ...get().openEntries, [id]: open ?? !get().openEntries[id] } }),
  reveal: (sectionId, entryId) => {
    if (sectionId === '__header') {
      set({ personalOpen: true });
    } else {
      set({
        openSections: { ...get().openSections, [sectionId]: true },
        openEntries: entryId ? { ...get().openEntries, [entryId]: true } : get().openEntries,
      });
    }
    requestAnimationFrame(() => {
      const selector = entryId ? `[data-editor-entry="${entryId}"]` : `[data-editor-section="${sectionId}"]`;
      document.querySelector(selector)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
  },
  reset: () => set({ personalOpen: true, openSections: {}, openEntries: {} }),
}));

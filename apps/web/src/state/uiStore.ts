import { create } from 'zustand';

export type ThemePreference = 'light' | 'dark' | 'system';
export type Zoom = 'fit' | number;

const THEME_KEY = 'resumeforge:theme';
const PREFS_KEY = 'resumeforge:ui';

interface Prefs {
  zoom: Zoom;
  showSections: boolean;
  showDesign: boolean;
  cropMarks: boolean;
}

const DEFAULT_PREFS: Prefs = { zoom: 'fit', showSections: true, showDesign: true, cropMarks: true };

function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(THEME_KEY);
    return value === 'light' || value === 'dark' ? value : 'system';
  } catch {
    return 'system';
  }
}

function readPrefs(): Prefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Partial<Prefs>;
    return { ...DEFAULT_PREFS, ...parsed };
  } catch {
    return DEFAULT_PREFS;
  }
}

function writePrefs(prefs: Prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // Preferences are a convenience; ignore storage failures.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches === true;
}

export function applyTheme(preference: ThemePreference) {
  const dark = preference === 'dark' || (preference === 'system' && systemPrefersDark());
  document.documentElement.classList.toggle('dark', dark);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f1217' : '#171a21');
}

interface UiState extends Prefs {
  theme: ThemePreference;
  /** Distraction-free preview: hides both editor panels. */
  previewMode: boolean;
  shortcutsOpen: boolean;
  /** Design panel drawer on laptop widths, where it overlays the preview. */
  designDrawerOpen: boolean;
  /** Active panel on phones and tablets. */
  mobileTab: 'edit' | 'preview' | 'design';
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
  setZoom: (zoom: Zoom) => void;
  toggleSections: () => void;
  toggleDesign: () => void;
  setCropMarks: (value: boolean) => void;
  togglePreviewMode: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setDesignDrawerOpen: (open: boolean) => void;
  setMobileTab: (tab: UiState['mobileTab']) => void;
}

export const useUiStore = create<UiState>()((set, get) => {
  const persist = (patch: Partial<Prefs>) => {
    set(patch);
    const { zoom, showSections, showDesign, cropMarks } = get();
    writePrefs({ zoom, showSections, showDesign, cropMarks });
  };
  return {
    ...readPrefs(),
    theme: readTheme(),
    previewMode: false,
    shortcutsOpen: false,
    designDrawerOpen: false,
    mobileTab: 'edit',
    setTheme: (theme) => {
      try {
        if (theme === 'system') localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, theme);
      } catch {
        // Ignore.
      }
      applyTheme(theme);
      set({ theme });
    },
    toggleTheme: () => {
      const { theme } = get();
      const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark());
      get().setTheme(dark ? 'light' : 'dark');
    },
    setZoom: (zoom) => persist({ zoom }),
    toggleSections: () => persist({ showSections: !get().showSections }),
    toggleDesign: () => persist({ showDesign: !get().showDesign }),
    setCropMarks: (cropMarks) => persist({ cropMarks }),
    togglePreviewMode: () => set({ previewMode: !get().previewMode }),
    setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
    setDesignDrawerOpen: (designDrawerOpen) => set({ designDrawerOpen }),
    setMobileTab: (mobileTab) => set({ mobileTab }),
  };
});

import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Breakpoints matching the editor layouts. */
export const useIsWide = () => useMediaQuery('(min-width: 1280px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');

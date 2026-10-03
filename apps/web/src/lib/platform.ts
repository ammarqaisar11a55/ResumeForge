export const isMac =
  typeof navigator !== 'undefined' &&
  /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent);

/** Label for the primary modifier key. */
export const MOD_LABEL = isMac ? '⌘' : 'Ctrl';

export function isModKey(event: KeyboardEvent | React.KeyboardEvent): boolean {
  return isMac ? event.metaKey : event.ctrlKey;
}

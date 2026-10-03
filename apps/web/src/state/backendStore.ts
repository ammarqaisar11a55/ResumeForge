import { create } from 'zustand';
import { api, type BackendCapabilities } from '../services';

export type BackendStatus = 'checking' | 'online' | 'offline' | 'disabled';

interface BackendState {
  status: BackendStatus;
  capabilities: BackendCapabilities;
}

/** Availability of the optional PDF service. */
export const useBackendStore = create<BackendState>()(() => ({
  status: api ? 'checking' : 'disabled',
  capabilities: { pdf: false },
}));

let retryTimer: ReturnType<typeof setTimeout> | undefined;

export async function checkBackend(): Promise<void> {
  if (!api) return;
  clearTimeout(retryTimer);
  try {
    useBackendStore.setState({ status: 'online', capabilities: await api.health() });
  } catch {
    useBackendStore.setState({ status: 'offline', capabilities: { pdf: false } });
    retryTimer = setTimeout(() => void checkBackend(), 60_000);
  }
}

export function initBackend(): void {
  if (!api) return;
  void checkBackend();
  window.addEventListener('online', () => void checkBackend());
}

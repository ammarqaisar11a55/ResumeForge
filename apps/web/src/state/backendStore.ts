import { create } from 'zustand';
import { api, resumeService, type BackendCapabilities, type SyncState } from '../services';

export type BackendStatus = 'checking' | 'online' | 'offline' | 'disabled';

interface BackendState {
  status: BackendStatus;
  capabilities: BackendCapabilities;
  syncState: SyncState;
}

export const useBackendStore = create<BackendState>()(() => ({
  status: api ? 'checking' : 'disabled',
  capabilities: { persistence: false, pdf: false },
  syncState: resumeService.syncState,
}));

resumeService.subscribe((syncState) => useBackendStore.setState({ syncState }));

let retryTimer: ReturnType<typeof setTimeout> | undefined;

/** Probe the API; enable sync and server PDF export when it is available. */
export async function checkBackend(): Promise<void> {
  if (!api) return;
  clearTimeout(retryTimer);
  try {
    const capabilities = await api.health();
    useBackendStore.setState({ status: 'online', capabilities });
    resumeService.setBackend(capabilities);
    await resumeService.sync();
  } catch {
    useBackendStore.setState({
      status: 'offline',
      capabilities: { persistence: false, pdf: false },
    });
    resumeService.setBackend(null);
    retryTimer = setTimeout(() => void checkBackend(), 60_000);
  }
}

export function initBackend(): void {
  if (!api) return;
  void checkBackend();
  window.addEventListener('online', () => void checkBackend());
}

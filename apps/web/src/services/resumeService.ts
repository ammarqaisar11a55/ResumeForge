import type { Resume, ResumeSummary } from '@resumeforge/core';
import { isServerUnavailable, type ApiClient, type BackendCapabilities } from './api/apiClient';
import type { LocalResumeStore, LoadedResume } from './storage/localResumeStore';

/**
 * Local-first persistence. Every change is written to this browser first,
 * synchronously, so nothing depends on the network. When a ResumeForge server
 * with persistence is reachable, changes are mirrored to it in the
 * background; failures are queued and retried, never dropped.
 *
 * Conflict policy is last-write-wins on `updatedAt`, which is sufficient for
 * one person editing their own resumes. Authentication and multi-device
 * merging can be layered on the API without touching the editor.
 */

type PendingOp = 'save' | 'delete';
const PENDING_KEY = 'resumeforge:v1:pending';

export type SyncState = 'local-only' | 'idle' | 'syncing' | 'offline';

export interface SyncListener {
  (state: SyncState): void;
}

export class ResumeService {
  private remote: ApiClient | null = null;
  private state: SyncState = 'local-only';
  private listeners = new Set<SyncListener>();
  private inflight = new Map<string, Promise<void>>();

  constructor(
    readonly local: LocalResumeStore,
    private readonly api: ApiClient | null,
    private readonly storage: Storage = window.localStorage,
  ) {}

  /* ---------------------------------------------------------------------- */
  /* Backend wiring                                                         */
  /* ---------------------------------------------------------------------- */

  get syncState(): SyncState {
    return this.state;
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setState(state: SyncState) {
    if (state === this.state) return;
    this.state = state;
    this.listeners.forEach((l) => l(state));
  }

  /** Called when the backend health check completes. */
  setBackend(capabilities: BackendCapabilities | null): void {
    if (capabilities?.persistence && this.api) {
      this.remote = this.api;
      this.setState('idle');
    } else {
      this.remote = null;
      this.setState(capabilities === null && this.api ? 'offline' : 'local-only');
    }
  }

  get hasRemote(): boolean {
    return this.remote !== null;
  }

  /* ---------------------------------------------------------------------- */
  /* Reads                                                                  */
  /* ---------------------------------------------------------------------- */

  list(): ResumeSummary[] {
    return this.local.list();
  }

  async get(id: string): Promise<LoadedResume | null> {
    const local = this.local.get(id);
    if (local) return local;
    if (!this.remote) return null;
    const resume = await this.remote.getResume(id);
    if (!resume) return null;
    this.local.save(resume);
    return { resume };
  }

  /* ---------------------------------------------------------------------- */
  /* Writes                                                                 */
  /* ---------------------------------------------------------------------- */

  /** Persist locally (synchronously) and mirror to the server in the background. */
  save(resume: Resume): void {
    this.local.save(resume);
    this.markPending(resume.id, 'save');
    void this.push(resume.id);
  }

  remove(id: string): void {
    this.local.remove(id);
    this.markPending(id, 'delete');
    void this.push(id);
  }

  /** Push one pending operation. Concurrent calls for the same id coalesce. */
  private push(id: string): Promise<void> {
    if (!this.remote) return Promise.resolve();
    const existing = this.inflight.get(id);
    if (existing) return existing.then(() => this.push(id));
    const task = this.pushNow(id).finally(() => this.inflight.delete(id));
    this.inflight.set(id, task);
    return task;
  }

  private async pushNow(id: string): Promise<void> {
    const remote = this.remote;
    const op = this.pending()[id];
    if (!remote || !op) return;
    this.setState('syncing');
    try {
      if (op === 'delete') {
        await remote.deleteResume(id);
      } else {
        const loaded = this.local.get(id);
        if (loaded) await remote.saveResume(loaded.resume);
      }
      // Only clear if nothing newer was queued while the request was in flight.
      if (this.pending()[id] === op) this.clearPending(id);
      this.setState(Object.keys(this.pending()).length ? 'syncing' : 'idle');
    } catch (error) {
      this.setState(isServerUnavailable(error) ? 'offline' : 'idle');
    }
  }

  /** Retry queued operations, then pull anything newer from the server. */
  async sync(): Promise<void> {
    const remote = this.remote;
    if (!remote) return;
    await Promise.all(Object.keys(this.pending()).map((id) => this.push(id)));
    let remoteList: ResumeSummary[];
    try {
      remoteList = await remote.listResumes();
    } catch (error) {
      if (isServerUnavailable(error)) this.setState('offline');
      return;
    }
    const localById = new Map(this.local.list().map((s) => [s.id, s]));
    const pending = this.pending();
    for (const summary of remoteList) {
      if (pending[summary.id]) continue;
      const local = localById.get(summary.id);
      if (!local || Date.parse(summary.updatedAt) > Date.parse(local.updatedAt)) {
        try {
          const resume = await remote.getResume(summary.id);
          if (resume) this.local.save(resume);
        } catch {
          // Keep the local copy; the next sync will try again.
        }
      }
    }
    // Resumes created before a server was available are uploaded once.
    const remoteIds = new Set(remoteList.map((s) => s.id));
    for (const local of localById.values()) {
      if (!remoteIds.has(local.id) && !pending[local.id]) {
        this.markPending(local.id, 'save');
        void this.push(local.id);
      }
    }
    this.setState(Object.keys(this.pending()).length ? 'syncing' : 'idle');
  }

  /* ---------------------------------------------------------------------- */
  /* Pending queue                                                          */
  /* ---------------------------------------------------------------------- */

  pending(): Record<string, PendingOp> {
    try {
      const raw = this.storage.getItem(PENDING_KEY);
      const parsed = raw ? (JSON.parse(raw) as unknown) : {};
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, PendingOp>) : {};
    } catch {
      return {};
    }
  }

  private markPending(id: string, op: PendingOp): void {
    if (!this.api) return;
    try {
      this.storage.setItem(PENDING_KEY, JSON.stringify({ ...this.pending(), [id]: op }));
    } catch {
      // The local copy is already safe; sync will catch up via a full sync.
    }
  }

  private clearPending(id: string): void {
    const next = this.pending();
    delete next[id];
    try {
      this.storage.setItem(PENDING_KEY, JSON.stringify(next));
    } catch {
      // Ignore: an extra retry is harmless.
    }
  }
}

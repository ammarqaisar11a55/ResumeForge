import { ApiClient, apiBaseUrl } from './api/apiClient';
import { ResumeService } from './resumeService';
import { LocalResumeStore } from './storage/localResumeStore';

const apiEnabled = import.meta.env.VITE_ENABLE_API !== 'false';

/** Application-wide service instances. */
export const api: ApiClient | null = apiEnabled ? new ApiClient(apiBaseUrl()) : null;
export const resumeService = new ResumeService(new LocalResumeStore(), api);

export { ApiClient, ApiError, NetworkError, type BackendCapabilities } from './api/apiClient';
export {
  CorruptResumeError,
  StorageFullError,
  type LoadedResume,
} from './storage/localResumeStore';
export type { SyncState } from './resumeService';

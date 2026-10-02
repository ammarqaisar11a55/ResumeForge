/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the ResumeForge API. Defaults to "/api" (proxied in development). */
  readonly VITE_API_URL?: string;
  /** Set to "false" to run fully offline without probing the API. */
  readonly VITE_ENABLE_API?: string;
}

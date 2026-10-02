import { loadResume, type Resume, type ResumeSummary } from '@resumeforge/core';

export interface BackendCapabilities {
  persistence: boolean;
  pdf: boolean;
}

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'The ResumeForge server could not be reached.') {
    super(message);
    this.name = 'NetworkError';
  }
}

/** True for failures that mean "the server is not reachable right now". */
export function isServerUnavailable(error: unknown): boolean {
  return error instanceof NetworkError || (error instanceof ApiError && error.status >= 502 && error.status <= 504);
}

export interface ExportPdfRequest {
  resumeId?: string;
  title: string;
  html: string;
  page: { widthMm: number; heightMm: number };
  fonts: string[];
  pageCount: number;
}

type Fetch = typeof fetch;

/** Thin typed wrapper over the ResumeForge REST API. */
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  private async request(path: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
    const { timeoutMs = 15_000, ...init } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: { Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...init.headers },
      });
    } catch {
      throw new NetworkError(controller.signal.aborted ? 'The server took too long to respond.' : undefined);
    } finally {
      clearTimeout(timer);
    }
    if (!response.ok) {
      let message = `Request failed (${response.status}).`;
      let code: string | undefined;
      try {
        const body = (await response.json()) as { error?: { message?: string; code?: string } };
        message = body.error?.message ?? message;
        code = body.error?.code;
      } catch {
        // Non-JSON error body.
      }
      throw new ApiError(message, response.status, code);
    }
    return response;
  }

  async health(): Promise<BackendCapabilities> {
    const response = await this.request('/health', { timeoutMs: 3000 });
    const body = (await response.json()) as { capabilities?: Partial<BackendCapabilities> };
    return { persistence: Boolean(body.capabilities?.persistence), pdf: Boolean(body.capabilities?.pdf) };
  }

  async listResumes(): Promise<ResumeSummary[]> {
    const response = await this.request('/resumes');
    const body = (await response.json()) as { resumes: ResumeSummary[] };
    return body.resumes;
  }

  async getResume(id: string): Promise<Resume | null> {
    try {
      const response = await this.request(`/resumes/${encodeURIComponent(id)}`);
      const body = (await response.json()) as { resume: unknown };
      const result = loadResume(body.resume);
      return result.ok ? result.resume : null;
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  }

  async saveResume(resume: Resume): Promise<void> {
    await this.request(`/resumes/${encodeURIComponent(resume.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ resume }),
    });
  }

  async deleteResume(id: string): Promise<void> {
    try {
      await this.request(`/resumes/${encodeURIComponent(id)}`, { method: 'DELETE' });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return;
      throw error;
    }
  }

  async exportPdf(request: ExportPdfRequest): Promise<Blob> {
    const response = await this.request('/export/pdf', {
      method: 'POST',
      body: JSON.stringify(request),
      headers: { Accept: 'application/pdf' },
      timeoutMs: 60_000,
    });
    return response.blob();
  }
}

export function apiBaseUrl(): string {
  return (import.meta.env.VITE_API_URL ?? '/api').replace(/\/+$/, '');
}

export interface BackendCapabilities {
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
  constructor(message = 'The ResumeForge PDF service could not be reached.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface ExportPdfRequest {
  title: string;
  html: string;
  page: { widthMm: number; heightMm: number };
  fonts: string[];
}

type Fetch = typeof fetch;

/**
 * Client for the optional ResumeForge PDF service. Resumes never leave the
 * browser except as the rendered pages sent for PDF conversion.
 */
export class ApiClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchImpl: Fetch = (...args) => fetch(...args),
  ) {}

  private async request(
    path: string,
    options: RequestInit & { timeoutMs?: number } = {},
  ): Promise<Response> {
    const { timeoutMs = 15_000, ...init } = options;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
          ...init.headers,
        },
      });
    } catch {
      throw new NetworkError(
        controller.signal.aborted ? 'The PDF service took too long to respond.' : undefined,
      );
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
    return { pdf: Boolean(body.capabilities?.pdf) };
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

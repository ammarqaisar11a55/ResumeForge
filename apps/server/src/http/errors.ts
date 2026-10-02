import type { ErrorRequestHandler, RequestHandler } from 'express';

/** An error with an HTTP status and a stable machine-readable code. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export const notFound: RequestHandler = (req, _res, next) => {
  next(new HttpError(404, 'not_found', `No route for ${req.method} ${req.path}.`));
};

/** Consistent JSON errors: { error: { code, message } }. Internal details are never leaked. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message } });
    return;
  }
  const body = error as { type?: string; status?: number };
  if (body?.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'payload_too_large', message: 'The request is too large.' } });
    return;
  }
  if (body?.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'invalid_json', message: 'The request body is not valid JSON.' } });
    return;
  }
  console.error('Unhandled error', error);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong on the server.' } });
};

import type { Request } from 'express';

/**
 * The user a request acts for. Until authentication exists every request
 * maps to the built-in local user; an auth middleware will set this instead.
 */
export function userId(req: Request): string {
  return (req as Request & { userId: string }).userId;
}

export function withUser(id: string) {
  return (req: Request, _res: unknown, next: () => void) => {
    (req as Request & { userId: string }).userId = id;
    next();
  };
}

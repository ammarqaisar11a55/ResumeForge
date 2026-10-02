/** Minimal SQL interface implemented by node-postgres and by embedded PGlite. */
export interface Db {
  readonly kind: 'postgres' | 'pglite';
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
  /** Run a multi-statement SQL script without parameters. */
  exec(sql: string): Promise<void>;
  /** Run `fn` inside a transaction; the callback receives a transaction-bound Db. */
  transaction<T>(fn: (tx: Db) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

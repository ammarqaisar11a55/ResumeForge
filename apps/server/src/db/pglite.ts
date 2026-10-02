import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite, type Transaction } from '@electric-sql/pglite';
import type { Db } from './types';

/**
 * Embedded PostgreSQL (compiled to WebAssembly). Used when no DATABASE_URL is
 * configured so ResumeForge runs with zero setup, and in tests.
 */
export async function createPgliteDb(dataDir: string): Promise<Db> {
  let pglite: PGlite;
  if (dataDir === 'memory') {
    pglite = new PGlite();
  } else {
    const dir = path.resolve(dataDir, 'pglite');
    mkdirSync(dir, { recursive: true });
    pglite = new PGlite(dir);
  }
  await pglite.waitReady;

  const txDb = (tx: Transaction): Db => ({
    kind: 'pglite',
    query: async (sql, params = []) => ({ rows: (await tx.query(sql, params)).rows as never[] }),
    exec: async (sql) => void (await tx.exec(sql)),
    transaction: (fn) => fn(txDb(tx)),
    close: async () => {},
  });

  return {
    kind: 'pglite',
    query: async (sql, params = []) => ({ rows: (await pglite.query(sql, params)).rows as never[] }),
    exec: async (sql) => void (await pglite.exec(sql)),
    transaction: (fn) => pglite.transaction((tx) => fn(txDb(tx))),
    close: () => pglite.close(),
  };
}

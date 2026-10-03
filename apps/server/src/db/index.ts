import type { Config } from '../config';
import { ensureUser, migrate } from './migrate';
import { createPgDb } from './pg';
import { createPgliteDb } from './pglite';
import type { Db } from './types';

export type { Db } from './types';

/** Connect to PostgreSQL (or embedded PGlite), migrate, and seed the default user. */
export async function openDatabase(
  config: Pick<Config, 'databaseUrl' | 'dataDir' | 'defaultUserId'>,
): Promise<Db> {
  const db = config.databaseUrl
    ? createPgDb(config.databaseUrl)
    : await createPgliteDb(config.dataDir);
  await migrate(db);
  await ensureUser(db, config.defaultUserId);
  return db;
}

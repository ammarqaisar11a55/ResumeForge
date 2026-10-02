import { MIGRATIONS } from './migrations';
import type { Db } from './types';

/** Apply pending migrations. Each runs in its own transaction. Returns applied versions. */
export async function migrate(db: Db): Promise<number[]> {
  await db.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version integer PRIMARY KEY,
      name text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const { rows } = await db.query<{ version: number }>('SELECT version FROM schema_migrations');
  const applied = new Set(rows.map((r) => Number(r.version)));
  const done: number[] = [];
  for (const migration of MIGRATIONS) {
    if (applied.has(migration.version)) continue;
    await db.transaction(async (tx) => {
      await tx.exec(migration.sql);
      await tx.query('INSERT INTO schema_migrations (version, name) VALUES ($1, $2)', [migration.version, migration.name]);
    });
    done.push(migration.version);
  }
  return done;
}

/** Make sure the built-in user exists (until authentication replaces it). */
export async function ensureUser(db: Db, id: string): Promise<void> {
  await db.query(`INSERT INTO users (id, display_name) VALUES ($1, 'Local user') ON CONFLICT (id) DO NOTHING`, [id]);
}

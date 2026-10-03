import pg from 'pg';
import type { Db } from './types';

export function createPgDb(connectionString: string): Db {
  const pool = new pg.Pool({ connectionString, max: 10 });

  const wrap =
    (client: pg.Pool | pg.PoolClient): Db['query'] =>
    async (sql, params = []) => {
      const result = await client.query(sql, params as unknown[]);
      return { rows: result.rows };
    };

  return {
    kind: 'postgres',
    query: wrap(pool),
    exec: async (sql) => void (await pool.query(sql)),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const tx: Db = {
          kind: 'postgres',
          query: wrap(client),
          exec: async (sql) => void (await client.query(sql)),
          transaction: (inner) => inner(tx),
          close: async () => {},
        };
        const result = await fn(tx);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

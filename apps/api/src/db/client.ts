import pg from 'pg';

export interface Queryable {
  query<T extends object = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface Db extends Queryable {
  /** Runs `fn` in a single transaction; rolls back if it throws. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

export interface PgDbOptions {
  connectionString: string;
  max: number;
}

export function createPgDb({ connectionString, max }: PgDbOptions): Db {
  const pool = new pg.Pool({
    connectionString,
    max,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 10_000,
  });
  // An idle client dropping must not crash the process.
  pool.on('error', (error) => {
    console.error('Unexpected PostgreSQL pool error:', error.message);
  });

  const toQueryable = (executor: pg.Pool | pg.PoolClient): Queryable => ({
    async query<T extends object>(text: string, params: unknown[] = []) {
      const result = await executor.query(text, params);
      return result.rows as T[];
    },
  });

  return {
    ...toQueryable(pool),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(toQueryable(client));
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}

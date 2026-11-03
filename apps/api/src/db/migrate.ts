import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Db } from './client.js';

// Resolves to apps/api/migrations from both src/db and dist/db.
const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../migrations');

/** Applies pending `NNN_name.sql` files in order. Returns the names applied. */
export async function migrate(db: Db): Promise<string[]> {
  const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort();
  const applied: string[] = [];

  await db.transaction(async (tx) => {
    // Serialise concurrent runners (e.g. parallel deploys) for the duration of this transaction.
    await tx.query('SELECT pg_advisory_xact_lock(7203041)');
    await tx.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name       text PRIMARY KEY,
         applied_at timestamptz NOT NULL DEFAULT now()
       )`,
    );
    const done = new Set(
      (await tx.query<{ name: string }>('SELECT name FROM schema_migrations')).map((row) => row.name),
    );
    for (const file of files) {
      if (done.has(file)) continue;
      await tx.query(await readFile(path.join(MIGRATIONS_DIR, file), 'utf8'));
      await tx.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      applied.push(file);
    }
  });

  return applied;
}

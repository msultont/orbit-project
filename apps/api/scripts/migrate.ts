import { createPgDb } from '../src/db/client.js';
import { loadConfig, loadEnvFile } from '../src/config/env.js';
import { migrate } from '../src/db/migrate.js';

loadEnvFile();
const config = loadConfig();
const db = createPgDb({ connectionString: config.databaseUrl, max: 1 });
try {
  const applied = await migrate(db);
  console.log(applied.length ? `Applied: ${applied.join(', ')}` : 'Database is up to date');
} finally {
  await db.close();
}

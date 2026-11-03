import { createPgDb } from '../src/db/client.js';
import { loadConfig, loadEnvFile } from '../src/config/env.js';
import { seed } from '../src/db/seed.js';

loadEnvFile();
const config = loadConfig();
const db = createPgDb({ connectionString: config.databaseUrl, max: 1 });
try {
  console.log(`Seeded ${await seed(db)} products`);
} finally {
  await db.close();
}

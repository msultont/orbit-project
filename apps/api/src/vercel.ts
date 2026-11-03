import { createApp } from './app.js';
import { loadConfig } from './config/env.js';
import { createPgDb } from './db/client.js';

// Serverless entry: the pool is created once per warm instance and reused across invocations.
const config = loadConfig();
const db = createPgDb({ connectionString: config.databaseUrl, max: config.poolMax });

export default createApp({ db, corsOrigins: config.corsOrigins });

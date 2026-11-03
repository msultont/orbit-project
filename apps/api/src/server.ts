import { createApp } from './app.js';
import { loadConfig, loadEnvFile } from './config/env.js';
import { createPgDb } from './db/client.js';

loadEnvFile();
const config = loadConfig();
const db = createPgDb({ connectionString: config.databaseUrl, max: config.poolMax });
const app = createApp({ db, corsOrigins: config.corsOrigins });

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    void db.close().finally(() => process.exit(0));
  });
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

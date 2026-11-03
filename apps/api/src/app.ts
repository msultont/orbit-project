import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import type { Db } from './db/client.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';

export interface AppDependencies {
  db: Db;
  corsOrigins?: string[];
}

export function createApp({ db, corsOrigins = [] }: AppDependencies): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  // Same-origin deployments need no CORS; cross-origin callers must be allow-listed.
  app.use(cors({ origin: corsOrigins.length > 0 ? corsOrigins : false }));
  app.use(express.json({ limit: '16kb' }));

  app.use('/api', createApiRouter(db));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  poolMax: number;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  CORS_ORIGIN: z.string().default(''),
  PG_POOL_MAX: z.coerce.number().int().min(1).max(50).optional(),
});

/** Loads the first `.env` found in the working directory or the repository root (existing variables win). */
export function loadEnvFile(): void {
  for (const dir of [process.cwd(), path.resolve(process.cwd(), '../..')]) {
    const file = path.join(dir, '.env');
    if (existsSync(file)) {
      process.loadEnvFile(file);
      return;
    }
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.parse(env);
  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    corsOrigins: parsed.CORS_ORIGIN.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    // Serverless instances are numerous and short-lived: keep one connection each.
    poolMax: parsed.PG_POOL_MAX ?? (env.VERCEL ? 1 : 5),
  };
}

import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase, createPool } from '@tallyroom/db';
import { createApp } from '../../apps/api/src/app.ts';
import { loadEnv } from '../../apps/api/src/config/env.ts';
import { createMemoryStorage } from '../../apps/api/src/storage/memory.ts';

/**
 * Die API für die Screenreader-Prüfung auf den Rechnern von GitHub.
 *
 * Dort laufen macOS und Windows, und auf beiden gibt es kein Docker — also
 * keinen Garage-Speicher wie in der übrigen CI. Die Dateien liegen deshalb im
 * Speicher des Prozesses, wie in den Integrationstests; die Datenbank ist
 * eine echte PostgreSQL auf dem Rechner. Geprüft wird, was ein Screenreader
 * ansagt, nicht die Anbindung an S3.
 *
 * Nur für diese Prüfung. Die API im Betrieb startet `apps/api/src/index.ts`.
 */
const databaseUrl = process.env.SCREENREADER_DATABASE_URL;
if (!databaseUrl) throw new Error('SCREENREADER_DATABASE_URL fehlt.');

const env = loadEnv({
  NODE_ENV: 'test',
  API_PORT: '4000',
  DATABASE_URL: databaseUrl,
  SESSION_SECRET: 'screenreader-pruefung-mindestens-zweiunddreissig-zeichen',
  APP_ORIGIN: 'http://localhost:5173',
  TRUST_PROXY_HOPS: '0',
  // Jeder Test startet seine eigene Demo; die Grenze für Besucher gilt hier nicht.
  DEMO_ENABLED: 'true',
  DEMO_RATE_LIMIT_MAX: '500',
  LOGIN_RATE_LIMIT_MAX: '500',
  S3_ENDPOINT: 'http://localhost:3900',
  S3_BUCKET: 'screenreader',
  S3_ACCESS_KEY_ID: 'screenreader',
  S3_SECRET_ACCESS_KEY: 'screenreader',
} as NodeJS.ProcessEnv);

const pool = createPool({ connectionString: env.DATABASE_URL });
const db = createDatabase(pool);

await migrate(db, {
  migrationsFolder: fileURLToPath(new URL('../../packages/db/migrations', import.meta.url)),
});

const app = createApp({ env, db, pool, storage: createMemoryStorage() });

// Ohne Adresse, wie die API im Betrieb: Vite fragt «localhost», und das kann
// auf macOS und Windows zuerst ::1 sein statt 127.0.0.1.
// Bereit meldet sich die API über /api/v1/health/ready; darauf wartet Playwright.
createServer(app).listen(env.API_PORT);

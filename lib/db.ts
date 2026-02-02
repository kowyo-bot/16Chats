import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: Pool | undefined;
}

export function getDbPool() {
  if (!globalThis.__dbPool) {
    globalThis.__dbPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DATABASE_URL?.includes('supabase.co') ||
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
    });
  }

  return globalThis.__dbPool;
}

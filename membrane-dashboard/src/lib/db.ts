import { Pool } from "pg";

// This checks if we already have a connection pool in development mode
// so hot-reloading doesn't crash your PostgreSQL server.
const globalForPg = global as unknown as { pool: Pool };

export const pool =
  globalForPg.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;
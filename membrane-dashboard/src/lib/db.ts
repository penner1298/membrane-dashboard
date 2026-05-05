import { Pool } from "pg";

// This checks if we already have a connection pool in development mode
// so hot-reloading doesn't crash your PostgreSQL server.
const globalForPg = global as unknown as { pool: Pool };

export const pool =
  globalForPg.pool ||
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // 👇 FIX: Force SSL on at all times since your cloud DB requires it!
    ssl: { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") globalForPg.pool = pool;
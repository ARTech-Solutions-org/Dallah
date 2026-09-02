import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL, DATABASE_URL, or POSTGRES_URL must be set. Did you forget to provision a database?",
  );
}

let databaseProtocol: string;

try {
  databaseProtocol = new URL(databaseUrl).protocol;
} catch {
  throw new Error("The configured database URL is not a valid PostgreSQL URL.");
}

if (databaseProtocol !== "postgres:" && databaseProtocol !== "postgresql:") {
  throw new Error("The configured database URL must use the PostgreSQL protocol.");
}

export const pool = new Pool({
  connectionString: databaseUrl,
  max: 1,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 10_000,
});
export const db = drizzle(pool, { schema });

export * from "./schema";

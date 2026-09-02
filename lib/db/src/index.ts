import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const databaseUrl = process.env.NEON_DATABASE_URL ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL, DATABASE_URL, or POSTGRES_URL must be set. Did you forget to provision a database?",
  );
}

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });

export * from "./schema";

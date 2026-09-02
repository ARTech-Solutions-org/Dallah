import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { desc } from "drizzle-orm";

const registrationsTable = pgTable("registrations", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  scfhsNumber: text("scfhs_number").notNull(),
  nationalId: text("national_id").notNull(),
  speciality: text("speciality").notNull(),
  hospital: text("hospital").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

function getDb() {
  const databaseUrl =
    process.env.NEON_DATABASE_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL;

  if (!databaseUrl) {
    throw new Error("Database URL not set in environment.");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  const expectedPassword = process.env.ADMIN_PASSWORD || "Dallah@2026";

  if (!authHeader || authHeader !== `Bearer ${expectedPassword}`) {
    return res.status(401).json({ error: "Invalid password" });
  }

  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(registrationsTable)
      .orderBy(desc(registrationsTable.createdAt));

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Admin DB error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return res.status(500).json({ error: `Database error: ${message}` });
  }
}

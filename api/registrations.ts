import type { VercelRequest, VercelResponse } from "@vercel/node";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import * as zod from "zod";

// ---- DB Schema (inlined to avoid monorepo workspace resolution on Vercel) ----
const registrationsTable = pgTable(
  "registrations",
  {
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
  },
  (table) => [
    uniqueIndex("registrations_email_unique").on(table.email),
    uniqueIndex("registrations_national_id_unique").on(table.nationalId),
  ],
);

// ---- Zod Schemas ----
const CreateRegistrationBody = zod.object({
  firstName: zod.string().min(1).max(100),
  lastName: zod.string().min(1).max(100),
  email: zod.string().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
  phone: zod.string().min(7).max(30).regex(/^[+0-9()\-\s]+$/),
  scfhsNumber: zod.string().min(1).max(100),
  nationalId: zod.string().min(1).max(30).regex(/^[0-9]+$/),
  speciality: zod.string().min(1).max(120),
  hospital: zod.string().min(1).max(200),
});

const GetRegistrationStatusResponse = zod.object({ registered: zod.boolean() });
const CreateRegistrationResponse = zod.object({ name: zod.string() });

// ---- DB Client ----
const REGISTRATION_COOKIE = "dallah_conference_registered";
const REGISTRATION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year in seconds

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL must be set.");
  }
  const sql = neon(databaseUrl);
  return drizzle(sql, { schema: { registrationsTable } });
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...v] = c.trim().split("=");
      return [key.trim(), decodeURIComponent(v.join("="))];
    }),
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cookies = parseCookies(req.headers.cookie as string | undefined);

  // ---- GET /api/registrations ----
  if (req.method === "GET") {
    const data = GetRegistrationStatusResponse.parse({
      registered: cookies[REGISTRATION_COOKIE] === "1",
    });
    return res.status(200).json(data);
  }

  // ---- POST /api/registrations ----
  if (req.method === "POST") {
    if (cookies[REGISTRATION_COOKIE] === "1") {
      return res.status(409).json({ error: "This browser has already been registered for the conference." });
    }

    const parsed = CreateRegistrationBody.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Please check the highlighted registration details." });
    }

    try {
      const db = getDb();
      const [registration] = await db
        .insert(registrationsTable)
        .values(parsed.data)
        .returning({
          firstName: registrationsTable.firstName,
          lastName: registrationsTable.lastName,
        });

      const response = CreateRegistrationResponse.parse({
        name: `${registration.firstName} ${registration.lastName}`,
      });

      const cookieValue = `${REGISTRATION_COOKIE}=1; HttpOnly; SameSite=Lax; Secure; Max-Age=${REGISTRATION_COOKIE_MAX_AGE}; Path=/`;
      res.setHeader("Set-Cookie", cookieValue);
      return res.status(201).json(response);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error as { code: string }).code === "23505"
      ) {
        return res.status(409).json({ error: "This attendee has already been registered for the conference." });
      }
      console.error("Failed to save registration:", error);
      return res.status(500).json({ error: "We couldn't save your registration. Please try again." });
    }
  }

  return res.status(405).json({ error: "Method not allowed." });
}

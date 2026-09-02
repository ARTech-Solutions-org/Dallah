import { createInsertSchema } from "drizzle-zod";
import { pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const registrationsTable = pgTable(
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

export const insertRegistrationSchema = createInsertSchema(registrationsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrationsTable.$inferSelect;
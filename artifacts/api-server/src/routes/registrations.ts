import { Router, type IRouter } from "express";
import { db, registrationsTable } from "@workspace/db";
import {
  CreateRegistrationBody,
  CreateRegistrationResponse,
  GetRegistrationStatusResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const REGISTRATION_COOKIE = "dallah_conference_registered";
const REGISTRATION_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 365;

router.get("/registrations", (req, res): void => {
  res.json(
    GetRegistrationStatusResponse.parse({
      registered: req.cookies?.[REGISTRATION_COOKIE] === "1",
    }),
  );
});

router.post("/registrations", async (req, res): Promise<void> => {
  if (req.cookies?.[REGISTRATION_COOKIE] === "1") {
    res.status(409).json({ error: "This browser has already been registered for the conference." });
    return;
  }

  const parsed = CreateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.issues.length }, "Invalid registration body");
    res.status(400).json({ error: "Please check the highlighted registration details." });
    return;
  }

  try {
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
    res.cookie(REGISTRATION_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: REGISTRATION_COOKIE_MAX_AGE,
      path: "/",
    });
    res.status(201).json(response);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      res.status(409).json({ error: "This attendee has already been registered for the conference." });
      return;
    }
    req.log.error({ err: error }, "Failed to save registration");
    res.status(500).json({ error: "We couldn't save your registration. Please try again." });
  }
});

export default router;
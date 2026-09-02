import { Router, type IRouter } from "express";
import { db, registrationsTable } from "@workspace/db";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

const handleAdminRegistrations = async (req: any, res: any): Promise<void> => {
  const authHeader = req.headers.authorization;
  const adminPassword = process.env.ADMIN_PASSWORD || "Dallah@2026";

  if (!authHeader || authHeader !== `Bearer ${adminPassword}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const registrations = await db
      .select()
      .from(registrationsTable)
      .orderBy(desc(registrationsTable.createdAt));
      
    res.json(registrations);
  } catch (error) {
    req.log.error({ err: error }, "Failed to fetch registrations for admin");
    const errorMessage = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: `Failed to fetch data. DB Error: ${errorMessage}` });
  }
};

router.get("/admin", handleAdminRegistrations);
router.get("/admin/registrations", handleAdminRegistrations);

export default router;

import type { VercelRequest, VercelResponse } from "@vercel/node";
import * as zod from "zod";

const HealthCheckResponse = zod.object({ status: zod.string() });

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.status(200).json(data);
}

import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession } from "../../../src/lib/auth";
import { upsertPushSubscription, deletePushSubscription } from "../../../src/lib/db";
import { getSiteConfig, RegisterPushSchema } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantId } = getSiteConfig();
  const auth = await requireApiSession(req, res);
  if (!auth) return;

  if (req.method === "POST") {
    const result = RegisterPushSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    await upsertPushSubscription(tenantId, {
      userId: auth.userId,
      endpoint: result.data.endpoint,
      keys: result.data.keys,
    });
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : null;
    if (!endpoint) return res.status(400).json({ message: "endpoint required" });
    await deletePushSubscription(tenantId, endpoint);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

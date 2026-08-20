import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession, requireMainSite } from "../../../../src/lib/auth";
import { getIntent, updateIntent, deleteIntent } from "../../../../src/lib/db";
import { getSiteConfig, UpdateIntentSchema } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMainSite(res)) return;
  const { tenantId } = getSiteConfig();
  const { intentId } = req.query as { intentId: string };

  const auth = await requireApiSession(req, res);
  if (!auth) return;

  const intent = await getIntent(tenantId, intentId);
  if (!intent) return res.status(404).json({ message: "Rally not found" });

  if (req.method === "GET") {
    return res.status(200).json(intent);
  }

  const isAuthor = intent.userId === auth.userId;

  if (req.method === "PATCH") {
    if (!isAuthor) return res.status(403).json({ message: "Only the author can edit a rally" });
    if (intent.status === "converted") {
      return res.status(409).json({ message: "This rally already became an event" });
    }

    const result = UpdateIntentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    await updateIntent(tenantId, intentId, result.data);
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    // Admin delete is the moderation lever for the public feed.
    if (!isAuthor && !auth.isAdmin) {
      return res.status(403).json({ message: "Only the author can delete a rally" });
    }
    await deleteIntent(tenantId, intentId);
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

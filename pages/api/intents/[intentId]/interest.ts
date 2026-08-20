import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession, requireMainSite } from "../../../../src/lib/auth";
import {
  getIntent,
  getUser,
  addIntentInterest,
  removeIntentInterest,
} from "../../../../src/lib/db";
import { notifyIntentInterest } from "../../../../src/lib/notify";
import { getSiteConfig } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMainSite(res)) return;
  const { tenantId } = getSiteConfig();
  const { intentId } = req.query as { intentId: string };

  const auth = await requireApiSession(req, res);
  if (!auth) return;

  const intent = await getIntent(tenantId, intentId);
  if (!intent) return res.status(404).json({ message: "Rally not found" });

  if (req.method === "POST") {
    if (intent.status !== "open") {
      return res.status(409).json({ message: "This rally is no longer open" });
    }
    if (intent.userId === auth.userId) {
      return res.status(400).json({ message: "You're already in — it's your rally" });
    }

    const user = await getUser(auth.userId);
    const added = await addIntentInterest(tenantId, intentId, {
      userId: auth.userId,
      displayName: user?.name ?? "Someone",
      image: user?.image ?? null,
      createdAt: new Date(),
    });
    if (added) {
      await notifyIntentInterest(tenantId, intent, {
        userId: auth.userId,
        name: user?.name ?? "Someone",
        image: user?.image ?? null,
      });
    }
    const updated = await getIntent(tenantId, intentId);
    return res.status(200).json(updated);
  }

  if (req.method === "DELETE") {
    await removeIntentInterest(tenantId, intentId, auth.userId);
    const updated = await getIntent(tenantId, intentId);
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

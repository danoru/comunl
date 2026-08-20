import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession } from "../../../src/lib/auth";
import { markNotificationsRead } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tenantId } = getSiteConfig();
  const auth = await requireApiSession(req, res);
  if (!auth) return;

  await markNotificationsRead(tenantId, auth.userId);
  return res.status(200).json({ success: true });
}

import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession } from "../../../src/lib/auth";
import { getNotifications, getUnreadNotificationCount } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tenantId } = getSiteConfig();
  const auth = await requireApiSession(req, res);
  if (!auth) return;

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(tenantId, auth.userId),
    getUnreadNotificationCount(tenantId, auth.userId),
  ]);

  return res.status(200).json({ notifications, unreadCount });
}

import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession, requireMainSite } from "../../../../src/lib/auth";
import {
  getUserByHandle,
  getUser,
  followUser,
  unfollowUser,
  getFollowState,
} from "../../../../src/lib/db";
import { notifyNewFollower } from "../../../../src/lib/notify";
import { getSiteConfig, isFriend } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMainSite(res)) return;
  const { tenantId } = getSiteConfig();

  const auth = await requireApiSession(req, res);
  if (!auth) return;

  const { handle } = req.query as { handle: string };
  const target = await getUserByHandle(tenantId, handle);
  if (!target) return res.status(404).json({ message: "Profile not found" });
  if (target.userId === auth.userId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  if (req.method === "POST") {
    const created = await followUser(tenantId, auth.userId, target.userId);
    if (created) {
      const actor = await getUser(auth.userId);
      await notifyNewFollower(
        tenantId,
        target.userId,
        { userId: auth.userId, name: actor?.name ?? "Someone", image: actor?.image ?? null },
        actor?.handle ?? null
      );
    }
    const followState = await getFollowState(tenantId, auth.userId, target.userId);
    return res.status(200).json({ followState, isFriend: isFriend(followState) });
  }

  if (req.method === "DELETE") {
    await unfollowUser(tenantId, auth.userId, target.userId);
    const followState = await getFollowState(tenantId, auth.userId, target.userId);
    return res.status(200).json({ followState, isFriend: isFriend(followState) });
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

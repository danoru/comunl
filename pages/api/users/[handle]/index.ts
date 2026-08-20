import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession, requireMainSite } from "../../../../src/lib/auth";
import {
  getUserByHandle,
  getFollowState,
  getVisibleEvents,
  getIntents,
} from "../../../../src/lib/db";
import { getSiteConfig, isFriend } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMainSite(res)) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tenantId } = getSiteConfig();
  const auth = await requireApiSession(req, res);
  if (!auth) return;

  const { handle } = req.query as { handle: string };
  const user = await getUserByHandle(tenantId, handle);
  if (!user || !user.handle) return res.status(404).json({ message: "Profile not found" });

  const isSelf = user.userId === auth.userId;
  const followState = isSelf
    ? { following: false, followedBy: false }
    : await getFollowState(tenantId, auth.userId, user.userId);

  const visibility = user.profileVisibility ?? "mutual";
  const canSeeFull =
    isSelf || visibility === "public" || (visibility === "mutual" && isFriend(followState));

  if (visibility === "private" && !isSelf) {
    return res.status(404).json({ message: "Profile not found" });
  }

  const base = {
    userId: user.userId,
    handle: user.handle,
    name: user.name,
    image: user.image ?? null,
    isSelf,
    followState,
    isFriend: isFriend(followState),
  };

  if (!canSeeFull) {
    return res.status(200).json({ ...base, limited: true });
  }

  // Full profile: public upcoming events they host + their open public rallies.
  const [events, intents] = await Promise.all([
    getVisibleEvents(tenantId, undefined, {
      $or: [{ createdBy: user.userId }, { hosts: user.userId }, { hostUserIds: user.userId }],
      date: { $gte: new Date() },
    }),
    getIntents(tenantId, user.userId),
  ]);

  return res.status(200).json({
    ...base,
    limited: false,
    city: user.city ?? null,
    state: user.state ?? null,
    hosting: events,
    rallies: intents.filter((i) => i.userId === user.userId && i.status === "open"),
  });
}

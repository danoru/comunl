import type { NextApiRequest, NextApiResponse } from "next";

import { requireApiSession, requireMainSite } from "../../../src/lib/auth";
import {
  getIntents,
  getMutualIds,
  createIntent,
  countOpenIntents,
  countRecentIntents,
} from "../../../src/lib/db";
import { getUser } from "../../../src/lib/db";
import { generateEventId } from "../../../src/lib/nanoid";
import { getSiteConfig, CreateIntentSchema } from "../../../src/models";

const MAX_OPEN_PER_USER = 5;
const MAX_PER_DAY = 10;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!requireMainSite(res)) return;
  const { tenantId } = getSiteConfig();

  const auth = await requireApiSession(req, res);
  if (!auth) return;

  if (req.method === "GET") {
    const limitParam = parseInt((req.query.limit as string) ?? "", 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 50;
    const mutualIds = await getMutualIds(tenantId, auth.userId);
    const intents = await getIntents(tenantId, auth.userId, limit, mutualIds);
    return res.status(200).json(intents);
  }

  if (req.method === "POST") {
    const result = CreateIntentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const [openCount, dayCount] = await Promise.all([
      countOpenIntents(tenantId, auth.userId),
      countRecentIntents(tenantId, auth.userId, new Date(Date.now() - 24 * 60 * 60 * 1000)),
    ]);
    if (openCount >= MAX_OPEN_PER_USER) {
      return res.status(429).json({
        message: `You already have ${MAX_OPEN_PER_USER} open rallies — close one to start another`,
      });
    }
    if (dayCount >= MAX_PER_DAY) {
      return res
        .status(429)
        .json({ message: "That's a lot of rallies for one day — try tomorrow" });
    }

    const user = await getUser(auth.userId);
    const intent = await createIntent(tenantId, {
      id: generateEventId(),
      userId: auth.userId,
      authorName: user?.name ?? "Someone",
      authorHandle: user?.handle ?? null,
      authorImage: user?.image ?? null,
      activity: result.data.activity.trim(),
      details: result.data.details?.trim() ?? "",
      place: result.data.place?.trim() || null,
      link: result.data.link ?? null,
      timeframe: result.data.timeframe ?? null,
      visibility: result.data.visibility ?? "public",
      interested: [],
      status: "open",
      convertedEventId: null,
    });

    return res.status(201).json(intent);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

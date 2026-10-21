import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import {
  getVisibleEvents,
  createEvent,
  getIntent,
  getUser,
  updateIntent,
} from "../../../src/lib/db";
import { generateEventId, generateInviteCode } from "../../../src/lib/nanoid";
import { notifyIntentConverted } from "../../../src/lib/notify";
import { getSiteConfig, isMainSite, CreateEventSchema } from "../../../src/models";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const session = await getServerSession(req, res, authOptions);
    const events = await getVisibleEvents(tenantId, {
      userId: (session as any)?.userId as string | undefined,
      isAdmin: (session as any)?.isAdmin ?? false,
    });
    return res.status(200).json(events);
  }

  if (req.method === "POST") {
    const session = await getServerSession(req, res, authOptions);
    const isAdmin = (session as any)?.isAdmin ?? false;
    const userId = (session as any)?.userId as string | undefined;
    const site = getSiteConfig();

    if (!session) {
      return res.status(401).json({ message: "Not signed in" });
    }

    if (!site.allowPublicEventCreation && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to create events" });
    }

    const result = CreateEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const id = generateEventId();
    const inviteCode = result.data.isPrivate
      ? result.data.inviteCode || generateInviteCode()
      : null;

    const event = await createEvent(tenantId, {
      ...result.data,
      // Featuring puts an event on the homepage, so only admins can do it.
      isFeatured: isAdmin ? result.data.isFeatured : false,
      id,
      inviteCode,
      createdBy: userId,
    });

    // "Make it happen": link a converted rally to its event (author only).
    const intentId = typeof req.body?.intentId === "string" ? req.body.intentId : null;
    if (intentId && isMainSite(site) && userId) {
      const intent = await getIntent(tenantId, intentId);
      if (intent && intent.userId === userId && intent.status === "open") {
        await updateIntent(tenantId, intentId, {
          status: "converted",
          convertedEventId: event.id,
        });
        const author = await getUser(userId);
        await notifyIntentConverted(tenantId, intent, event, {
          userId,
          name: author?.name ?? intent.authorName,
          image: author?.image ?? intent.authorImage,
        });
      }
    }

    return res.status(201).json(event);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getEvents, createEvent } from "../../../src/lib/db";
import { getSiteConfig, CreateEventSchema } from "../../../src/models";
import { generateEventId, generateInviteCode } from "../../../src/lib/nanoid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const events = await getEvents(tenantId);
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
      id,
      inviteCode,
      createdBy: userId,
    });

    return res.status(201).json(event);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

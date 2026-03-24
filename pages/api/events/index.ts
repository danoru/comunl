import type { NextApiRequest, NextApiResponse } from "next";
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
    const result = CreateEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    // Generate a short random ID — e.g. "xK7mP2"
    const id = generateEventId();

    // If the event is private and no invite code was provided, generate one
    const inviteCode = result.data.isPrivate
      ? result.data.inviteCode || generateInviteCode()
      : null;

    const event = await createEvent(tenantId, {
      ...result.data,
      id,
      inviteCode,
    });

    return res.status(201).json(event);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

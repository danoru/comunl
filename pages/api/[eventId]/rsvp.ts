import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { z } from "zod";
import {
  getGuests,
  addGuest,
  getExistingRSVP,
  deleteGuest,
  getEvent,
  getTenant,
} from "../../../src/lib/db";
import { getSiteConfig, resolveAnonymousGuests } from "../../../src/models";

const CreateRSVPSchema = z.object({
  displayName: z.string().min(1, "Name is required").max(100),
  additionalGuests: z.array(z.object({ name: z.string().optional() })).default([]),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (req.method === "GET") {
    const guests = await getGuests(tenantId, eventId);
    return res.status(200).json(guests);
  }

  if (req.method === "POST") {
    const [event, tenant] = await Promise.all([getEvent(tenantId, eventId), getTenant(tenantId)]);

    if (!event) return res.status(404).json({ message: "Event not found" });

    const tenantDefault = tenant?.allowAnonymousGuests ?? true;
    const allowAnon = resolveAnonymousGuests(event, tenantDefault);

    if (!userId && !allowAnon) {
      return res.status(403).json({
        message: "Sign in required to RSVP for this event",
        requires: "auth",
      });
    }

    if (userId) {
      const existing = await getExistingRSVP(tenantId, eventId, userId);
      if (existing) {
        return res.status(409).json({
          message: "You've already RSVP'd to this event",
          existing,
        });
      }
    }

    const result = CreateRSVPSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const guest = await addGuest(tenantId, eventId, {
      userId: userId ?? undefined,
      displayName: result.data.displayName,
      additionalGuests: result.data.additionalGuests,
    });

    return res.status(201).json(guest);
  }

  if (req.method === "DELETE") {
    if (!userId) return res.status(401).json({ message: "Not signed in" });

    const { guestId } = req.body as { guestId: string };
    if (!guestId) return res.status(400).json({ message: "guestId required" });

    const event = await getEvent(tenantId, eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const isAdmin = (session as any)?.isAdmin ?? false;
    const isEditor = isAdmin || event.createdBy === userId || (event.hosts ?? []).includes(userId);

    const deleted = await deleteGuest(tenantId, eventId, guestId, isEditor ? undefined : userId);
    if (!deleted) return res.status(404).json({ message: "RSVP not found" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

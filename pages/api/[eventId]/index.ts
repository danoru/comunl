import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { requireEventEditor } from "../../../src/lib/auth";
import { getEvent, updateEvent, deleteEvent } from "../../../src/lib/db";
import { getSiteConfig, UpdateEventSchema } from "../../../src/models";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const event = await getEvent(tenantId, eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // The invite code is only for hosts/admins to share — never expose it to
    // anyone who merely knows the 6-char event id.
    const session = await getServerSession(req, res, authOptions);
    const userId = (session as any)?.userId as string | undefined;
    const isAdmin = (session as any)?.isAdmin ?? false;
    const isEditor =
      isAdmin ||
      (!!userId &&
        (event.createdBy === userId ||
          event.hosts.includes(userId) ||
          (event.hostUserIds ?? []).includes(userId)));

    return res.status(200).json(isEditor ? event : { ...event, inviteCode: null });
  }

  if (req.method === "PATCH" || req.method === "DELETE") {
    const event = await getEvent(tenantId, eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const auth = await requireEventEditor(req, res, event);
    if (!auth) return;

    if (req.method === "PATCH") {
      const result = UpdateEventSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: "Validation failed",
          errors: result.error.flatten().fieldErrors,
        });
      }
      // Hosts can edit their event, but only admins can feature it.
      const { isFeatured, ...rest } = result.data;
      const changes = auth.isAdmin ? result.data : rest;
      if (!auth.isAdmin && isFeatured !== undefined && isFeatured !== event.isFeatured) {
        return res.status(403).json({ message: "Only admins can feature events" });
      }
      const updated = await updateEvent(tenantId, eventId, changes);
      if (!updated) return res.status(404).json({ message: "Event not found" });
      return res.status(200).json({ success: true });
    }

    const deleted = await deleteEvent(tenantId, eventId);
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

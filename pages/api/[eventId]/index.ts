// GET   /api/:eventId  — fetch single event
// PATCH /api/:eventId  — update event fields
// DELETE /api/:eventId — soft-delete event (sets deletedAt)

import type { NextApiRequest, NextApiResponse } from "next";
import { getEvent, updateEvent, deleteEvent } from "../../../src/lib/db";
import { getSiteConfig, UpdateEventSchema } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const event = await getEvent(tenantId, eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json(event);
  }

  if (req.method === "PATCH") {
    const result = UpdateEventSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    const updated = await updateEvent(tenantId, eventId, result.data);
    if (!updated) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json({ success: true });
  }

  if (req.method === "DELETE") {
    const deleted = await deleteEvent(tenantId, eventId);
    if (!deleted) return res.status(404).json({ message: "Event not found" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "PATCH", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

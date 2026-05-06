import type { NextApiRequest, NextApiResponse } from "next";
import { requireApiSession, requireEventEditor } from "../../../../src/lib/auth";
import { deleteItem, getEvent, getItem, getUser, updateItem } from "../../../../src/lib/db";
import { getSiteConfig } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId, itemId } = req.query as { eventId: string; itemId: string };
  const { tenantId } = getSiteConfig();

  if (req.method === "PATCH") {
    const auth = await requireApiSession(req, res);
    if (!auth) return;

    const item = await getItem(tenantId, eventId, itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.itemType !== "host-rec") {
      return res.status(400).json({ message: "Only host recommendations can be claimed" });
    }

    const action = (req.body as { action?: string })?.action;

    if (action === "claim") {
      if (item.userId) {
        return res.status(409).json({ message: "Already claimed" });
      }
      const user = await getUser(auth.userId);
      const updated = await updateItem(tenantId, eventId, itemId, {
        userId: auth.userId,
        guestName: user?.name ?? "Guest",
      });
      if (!updated) return res.status(500).json({ message: "Update failed" });
      const refreshed = await getItem(tenantId, eventId, itemId);
      return res.status(200).json(refreshed);
    }

    if (action === "unclaim") {
      const event = await getEvent(tenantId, eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const isEditor =
        auth.isAdmin ||
        event.createdBy === auth.userId ||
        (event.hosts ?? []).includes(auth.userId);

      if (item.userId !== auth.userId && !isEditor) {
        return res.status(403).json({ message: "Not authorized to unclaim" });
      }

      const updated = await updateItem(tenantId, eventId, itemId, {}, ["userId", "guestName"]);
      if (!updated) return res.status(500).json({ message: "Update failed" });
      const refreshed = await getItem(tenantId, eventId, itemId);
      return res.status(200).json(refreshed);
    }

    return res.status(400).json({ message: "Invalid action" });
  }

  if (req.method === "DELETE") {
    const event = await getEvent(tenantId, eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    const auth = await requireEventEditor(req, res, event);
    if (!auth) return;

    const deleted = await deleteItem(tenantId, eventId, itemId);
    if (!deleted) return res.status(404).json({ message: "Item not found" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["PATCH", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

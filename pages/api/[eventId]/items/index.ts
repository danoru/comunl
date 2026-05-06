import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { requireEventEditor } from "../../../../src/lib/auth";
import { getEvent, getItems, addItem, getUser } from "../../../../src/lib/db";
import { getSiteConfig, CreateItemSchema } from "../../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (req.method === "GET") {
    const items = await getItems(tenantId, eventId);
    return res.status(200).json(items);
  }

  if (req.method === "POST") {
    const result = CreateItemSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    if (result.data.itemType === "host-rec") {
      const event = await getEvent(tenantId, eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const auth = await requireEventEditor(req, res, event);
      if (!auth) return;

      const item = await addItem(tenantId, eventId, {
        itemType: "host-rec",
        item: result.data.item,
      });
      return res.status(201).json(item);
    }

    let guestName = result.data.guestName ?? "Guest";
    if (userId) {
      const user = await getUser(userId);
      guestName = user?.name ?? guestName;
    }

    const item = await addItem(tenantId, eventId, {
      ...result.data,
      userId: userId ?? undefined,
      guestName,
    });

    return res.status(201).json(item);
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

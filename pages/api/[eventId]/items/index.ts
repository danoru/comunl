import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]";
import { getItems, addItem, deleteItem, getUser } from "../../../../src/lib/db";
import { getSiteConfig, CreateItemSchema } from "../../../../src/models";
import type { ItemType } from "../../../../src/models";

const VALID_TYPES: ItemType[] = ["main", "side", "snack", "dessert", "drink", "supply", "host-rec"];

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

    // Resolve attribution name:
    // 1. If signed in, use their profile name
    // 2. Otherwise use whatever name they passed in guestName
    // 3. Fall back to "Guest"
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

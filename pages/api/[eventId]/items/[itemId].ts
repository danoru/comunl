// DELETE /api/:eventId/items/:itemId — remove a food item or guest

import type { NextApiRequest, NextApiResponse } from "next";
import { deleteItem } from "../../../../src/lib/db";
import { getSiteConfig } from "../../../../src/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "DELETE") {
    res.setHeader("Allow", ["DELETE"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }

  const { eventId, itemId } = req.query as { eventId: string; itemId: string };
  const { tenantId } = getSiteConfig();

  const deleted = await deleteItem(tenantId, eventId, itemId);
  if (!deleted) return res.status(404).json({ message: "Item not found" });
  return res.status(200).json({ success: true });
}

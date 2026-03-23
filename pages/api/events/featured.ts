import type { NextApiRequest, NextApiResponse } from "next";
import { getFeaturedEvents } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} not allowed` });
  }

  const { tenantId } = getSiteConfig();
  const events = await getFeaturedEvents(tenantId);
  return res.status(200).json(events);
}

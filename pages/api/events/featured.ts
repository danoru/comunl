import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { getFeaturedEvents } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: `Method ${req.method} not allowed` });
  }

  const { tenantId } = getSiteConfig();
  const session = await getServerSession(req, res, authOptions);
  const events = await getFeaturedEvents(tenantId, {
    userId: (session as any)?.userId as string | undefined,
    isAdmin: (session as any)?.isAdmin ?? false,
  });
  return res.status(200).json(events);
}

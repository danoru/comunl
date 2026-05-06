import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getDb } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (!userId) return res.status(401).json({ message: "Not signed in" });

  const { tenantId } = getSiteConfig();
  const db = await getDb();

  const rsvps = await db
    .collection("guests")
    .aggregate([
      { $match: { userId, tenantId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: "events",
          localField: "eventId",
          foreignField: "id",
          as: "eventData",
        },
      },
      {
        $addFields: {
          eventTitle: { $arrayElemAt: ["$eventData.title", 0] },
          eventDate: { $arrayElemAt: ["$eventData.date", 0] },
        },
      },
      {
        $project: {
          eventData: 0,
        },
      },
    ])
    .toArray();

  const serialised = rsvps.map((r) => ({
    ...r,
    _id: r._id.toString(),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    eventDate: r.eventDate instanceof Date ? r.eventDate.toISOString() : r.eventDate,
  }));

  return res.status(200).json(serialised);
}

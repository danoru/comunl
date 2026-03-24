// Returns all events the signed-in user has RSVP'd to,
// with event titles joined for display.

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getClient } from "../../../src/lib/db";
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
  const client = await getClient();
  const db = client.db("comunl");

  // Aggregate guest records with their event titles in one query
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
          eventData: 0, // remove the joined array
        },
      },
    ])
    .toArray();

  // Serialise ObjectIds
  const serialised = rsvps.map((r) => ({
    ...r,
    _id: r._id.toString(),
    createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
    eventDate: r.eventDate instanceof Date ? r.eventDate.toISOString() : r.eventDate,
  }));

  return res.status(200).json(serialised);
}

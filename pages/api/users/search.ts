import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getClient } from "../../../src/lib/db";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "Not signed in" });

  const q = ((req.query.q as string) ?? "").trim();
  if (q.length < 2) return res.status(200).json([]);

  const client = await getClient();
  const col = client.db("comunl").collection("users");

  if (req.query.ids) {
    const ids = (req.query.ids as string).split(",").filter(Boolean);
    const users = await col
      .find({ userId: { $in: ids } })
      .project({ userId: 1, name: 1, email: 1, image: 1 })
      .limit(20)
      .toArray();
    return res.status(200).json(
      users.map((u) => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        image: u.image ?? null,
      }))
    );
  }

  const regex = new RegExp(q, "i");
  const users = await col
    .find({
      $or: [{ name: { $regex: regex } }, { email: { $regex: regex } }],
    })
    .project({ userId: 1, name: 1, email: 1, image: 1 })
    .limit(8)
    .toArray();

  return res.status(200).json(
    users.map((u) => ({
      userId: u.userId,
      name: u.name,
      email: u.email,
      image: u.image ?? null,
    }))
  );
}

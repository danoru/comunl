import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getDb } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

const REGEX_SPECIALS = /[.*+?^${}()|[\]\\]/g;
function escapeRegex(s: string): string {
  return s.replace(REGEX_SPECIALS, "\\$&");
}

const MAX_IDS = 50;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: "Not signed in" });

  const { tenantId } = getSiteConfig();
  const col = (await getDb()).collection("users");

  if (typeof req.query.ids === "string" && req.query.ids.length > 0) {
    const ids = req.query.ids
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_IDS);
    if (ids.length === 0) return res.status(200).json([]);

    const users = await col
      .find({ tenantId, userId: { $in: ids } })
      .project({ userId: 1, name: 1, email: 1, image: 1 })
      .limit(MAX_IDS)
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

  const q = ((req.query.q as string) ?? "").trim();
  if (q.length < 2) return res.status(200).json([]);

  const regex = new RegExp(escapeRegex(q), "i");
  const users = await col
    .find({
      tenantId,
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

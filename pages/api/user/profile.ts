// pages/api/user/profile.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { getUser, updateUser } from "../../../src/lib/db";
import { UpdateUserSchema } from "../../../src/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (!userId) {
    return res.status(401).json({ message: "Not signed in" });
  }

  if (req.method === "GET") {
    const user = await getUser(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json(user);
  }

  if (req.method === "PATCH") {
    const result = UpdateUserSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }
    await updateUser(userId, result.data);
    const updated = await getUser(userId);
    return res.status(200).json(updated);
  }

  res.setHeader("Allow", ["GET", "PATCH"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

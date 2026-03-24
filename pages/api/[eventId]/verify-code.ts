// POST /api/:eventId/verify-code
// Validates an invite code and sets a signed cookie so the user
// can view the private event without re-entering the code.

import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";
import { getEvent } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();
  const { code } = req.body as { code: string };

  if (!code?.trim()) {
    return res.status(400).json({ message: "Code is required" });
  }

  const event = await getEvent(tenantId, eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });

  // Case-insensitive comparison
  const matches = event.inviteCode && event.inviteCode.toUpperCase() === code.trim().toUpperCase();

  if (!matches) {
    return res.status(403).json({ message: "Invalid invite code" });
  }

  // Set a cookie valid for 30 days so they don't have to re-enter
  const cookieName = `invite_${eventId}`;
  res.setHeader(
    "Set-Cookie",
    serialize(cookieName, code.trim().toUpperCase(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: `/events/${eventId}`,
    })
  );

  return res.status(200).json({ success: true });
}

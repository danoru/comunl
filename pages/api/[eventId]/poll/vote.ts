import { serialize } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import {
  getEvent,
  getTenant,
  getDatePoll,
  upsertDatePollVote,
  deleteDatePollVote,
} from "../../../../src/lib/db";
import { generateInviteCode } from "../../../../src/lib/nanoid";
import { notifyPollVote } from "../../../../src/lib/notify";
import { getSiteConfig, resolveAnonymousGuests, CastVoteSchema } from "../../../../src/models";
import { authOptions } from "../../auth/[...nextauth]";

const PARTICIPANT_COOKIE = "poll_participant";

// Signed-in voters get a stable key from their userId; anonymous voters get a
// per-browser cookie key so they can edit their own vote. Forgeable, but the
// same trust level as anonymous RSVPs.
function resolveParticipant(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string | undefined
): string {
  if (userId) return `u_${userId}`;

  const existing = req.cookies[PARTICIPANT_COOKIE];
  if (existing && /^[A-Za-z0-9_-]{4,64}$/.test(existing)) return existing;

  const key = `a_${generateInviteCode()}`;
  res.setHeader(
    "Set-Cookie",
    serialize(PARTICIPANT_COOKIE, key, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    })
  );
  return key;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (req.method === "POST") {
    const [event, tenant, poll] = await Promise.all([
      getEvent(tenantId, eventId),
      getTenant(tenantId),
      getDatePoll(tenantId, eventId),
    ]);

    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!poll) return res.status(404).json({ message: "No date poll for this event" });
    if (poll.status === "locked") {
      return res.status(409).json({ message: "Voting is closed — the date is locked" });
    }

    const tenantDefault = tenant?.allowAnonymousGuests ?? true;
    const allowAnon = resolveAnonymousGuests(event, tenantDefault);
    if (!userId && !allowAnon) {
      return res.status(403).json({
        message: "Sign in required to vote on this event",
        requires: "auth",
      });
    }

    const result = CastVoteSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const validOptionIds = new Set(poll.options.map((o) => o.optionId));
    const responses = Object.fromEntries(
      Object.entries(result.data.responses).filter(([optionId]) => validOptionIds.has(optionId))
    );
    if (Object.keys(responses).length === 0) {
      return res.status(400).json({ message: "No votes for known options" });
    }
    if (!poll.allowMaybe && Object.values(responses).includes("ifneedbe")) {
      return res.status(400).json({ message: "This poll does not allow 'if need be' votes" });
    }

    const participantKey = resolveParticipant(req, res, userId);
    const { vote, created } = await upsertDatePollVote(tenantId, eventId, {
      participantKey,
      userId: userId ?? null,
      displayName: result.data.displayName,
      responses,
    });

    // Notify hosts on the first vote from a participant, not on every edit.
    if (created) {
      await notifyPollVote(
        tenantId,
        event,
        {
          userId: userId ?? `anon:${participantKey}`,
          name: result.data.displayName,
          image: null,
        },
        result.data.displayName
      );
    }

    return res.status(200).json(vote);
  }

  if (req.method === "DELETE") {
    const participantKey = userId ? `u_${userId}` : req.cookies[PARTICIPANT_COOKIE];
    if (!participantKey) return res.status(404).json({ message: "No vote to withdraw" });

    const deleted = await deleteDatePollVote(tenantId, eventId, participantKey);
    if (!deleted) return res.status(404).json({ message: "No vote to withdraw" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

import { requireEventEditor } from "../../../../src/lib/auth";
import {
  getEvent,
  getUser,
  updateEvent,
  getDatePoll,
  createDatePoll,
  updateDatePoll,
  getDatePollVotes,
} from "../../../../src/lib/db";
import { generateEventId } from "../../../../src/lib/nanoid";
import { notifyDateLocked } from "../../../../src/lib/notify";
import { getSiteConfig, CreateDatePollSchema, DatePollOptionSchema } from "../../../../src/models";

const LockSchema = z.object({
  action: z.literal("lock"),
  optionId: z.string(),
});

const EditOptionsSchema = z.object({
  options: z
    .array(DatePollOptionSchema.partial({ optionId: true }))
    .min(2)
    .max(10),
});

// The provisional event.date while polling: the furthest-out option, so the
// event never drops into "past" before the poll resolves.
function provisionalDate(options: { start: Date | string }[]): Date {
  return new Date(Math.max(...options.map((o) => new Date(o.start).getTime())));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();

  if (req.method === "GET") {
    const poll = await getDatePoll(tenantId, eventId);
    if (!poll) return res.status(404).json({ message: "No date poll for this event" });
    const votes = await getDatePollVotes(tenantId, eventId);
    return res.status(200).json({ poll, votes });
  }

  const event = await getEvent(tenantId, eventId);
  if (!event) return res.status(404).json({ message: "Event not found" });

  if (req.method === "POST") {
    const auth = await requireEventEditor(req, res, event);
    if (!auth) return;

    const existing = await getDatePoll(tenantId, eventId);
    if (existing) return res.status(409).json({ message: "This event already has a date poll" });

    const result = CreateDatePollSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const options = result.data.options.map((o) => ({
      optionId: generateEventId(),
      start: o.start,
      end: o.end ?? null,
      allDay: false,
    }));

    const poll = await createDatePoll(tenantId, eventId, {
      options,
      status: "open",
      lockedOptionId: null,
      allowMaybe: result.data.allowMaybe ?? true,
      createdBy: auth.userId,
    });

    await updateEvent(tenantId, eventId, {
      dateStatus: "polling",
      date: provisionalDate(options),
    });

    return res.status(201).json(poll);
  }

  if (req.method === "PUT") {
    const auth = await requireEventEditor(req, res, event);
    if (!auth) return;

    const poll = await getDatePoll(tenantId, eventId);
    if (!poll) return res.status(404).json({ message: "No date poll for this event" });

    const lock = LockSchema.safeParse(req.body);
    if (lock.success) {
      if (poll.status === "locked") {
        return res.status(409).json({ message: "This poll is already locked" });
      }
      const option = poll.options.find((o) => o.optionId === lock.data.optionId);
      if (!option) return res.status(400).json({ message: "Unknown option" });

      await updateDatePoll(tenantId, eventId, {
        status: "locked",
        lockedOptionId: option.optionId,
      });
      const lockedDate = new Date(option.start);
      await updateEvent(tenantId, eventId, {
        dateStatus: "confirmed",
        date: lockedDate,
      });

      // Nudge every signed-in voter to come back and RSVP.
      const votes = await getDatePollVotes(tenantId, eventId);
      const locker = await getUser(auth.userId);
      await notifyDateLocked(
        tenantId,
        { ...event, date: lockedDate.toISOString(), dateStatus: "confirmed" },
        lockedDate,
        votes.map((v) => v.userId).filter((id): id is string => !!id),
        { userId: auth.userId, name: locker?.name ?? "The host", image: locker?.image ?? null }
      );

      return res.status(200).json({ success: true, lockedOptionId: option.optionId });
    }

    const edit = EditOptionsSchema.safeParse(req.body);
    if (edit.success) {
      if (poll.status === "locked") {
        return res.status(409).json({ message: "This poll is locked" });
      }
      const options = edit.data.options.map((o) => ({
        ...o,
        optionId: o.optionId ?? generateEventId(),
      }));
      await updateDatePoll(tenantId, eventId, { options });
      await updateEvent(tenantId, eventId, { date: provisionalDate(options) });
      return res.status(200).json({ success: true });
    }

    return res
      .status(400)
      .json({ message: "Expected { action: 'lock', optionId } or { options }" });
  }

  res.setHeader("Allow", ["GET", "POST", "PUT"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

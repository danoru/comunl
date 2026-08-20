import { z } from "zod";

// One poll per event (unique on tenantId+eventId). Options carry their own
// nanoid so votes survive option edits.
export const DatePollOptionSchema = z.object({
  optionId: z.string(),
  start: z.coerce.date(),
  end: z.coerce.date().nullable().default(null),
  allDay: z.boolean().default(false),
});

export const DatePollSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  options: z.array(DatePollOptionSchema).min(2).max(10),
  status: z.enum(["open", "locked"]).default("open"),
  lockedOptionId: z.string().nullable().default(null),
  allowMaybe: z.boolean().default(true),
  createdBy: z.string(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const VoteResponseSchema = z.enum(["yes", "no", "ifneedbe"]);

// One doc per participant, upserted on re-vote. userId null = anonymous voter
// (identified by a participantKey cookie), mirroring the guests pattern.
export const DatePollVoteSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  participantKey: z.string(),
  userId: z.string().nullable().default(null),
  displayName: z.string().min(1).max(100),
  responses: z.record(z.string(), VoteResponseSchema).default({}),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type DatePollOption = z.infer<typeof DatePollOptionSchema>;
export type DatePoll = z.infer<typeof DatePollSchema>;
export type VoteResponse = z.infer<typeof VoteResponseSchema>;
export type DatePollVote = z.infer<typeof DatePollVoteSchema>;

export const SerializedDatePollSchema = DatePollSchema.extend({
  _id: z.string(),
  options: z.array(DatePollOptionSchema.extend({ start: z.string(), end: z.string().nullable() })),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const SerializedDatePollVoteSchema = DatePollVoteSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SerializedDatePoll = z.infer<typeof SerializedDatePollSchema>;
export type SerializedDatePollVote = z.infer<typeof SerializedDatePollVoteSchema>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeDatePoll(
  doc: DatePoll & { _id: { toString(): string } }
): SerializedDatePoll {
  return {
    ...doc,
    _id: doc._id.toString(),
    options: doc.options.map((o) => ({
      ...o,
      start: toIso(o.start),
      end: o.end === null ? null : toIso(o.end),
    })),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function serializeDatePollVote(
  doc: DatePollVote & { _id: { toString(): string } }
): SerializedDatePollVote {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

// Client payloads
export const CreateDatePollSchema = z.object({
  options: z
    .array(z.object({ start: z.coerce.date(), end: z.coerce.date().nullable().optional() }))
    .min(2)
    .max(10),
  allowMaybe: z.boolean().optional(),
});

export const CastVoteSchema = z.object({
  displayName: z.string().min(1).max(100),
  responses: z.record(z.string(), VoteResponseSchema),
});

export type CreateDatePoll = z.infer<typeof CreateDatePollSchema>;
export type CastVote = z.infer<typeof CastVoteSchema>;

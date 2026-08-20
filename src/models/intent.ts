import { z } from "zod";

const EXPIRY_DAYS = 60;

// A "rally": someone posts what they want to do, friends jump on, and the
// author converts momentum into an event. Main-site only; no anonymous authors.
export const InterestedSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  image: z.string().nullable().default(null),
  createdAt: z.coerce.date().default(() => new Date()),
});

export const IntentSchema = z.object({
  tenantId: z.string(),
  id: z.string(),
  userId: z.string(),
  authorName: z.string(),
  authorHandle: z.string().nullable().default(null),
  authorImage: z.string().nullable().default(null),
  activity: z.string().min(1).max(200),
  details: z.string().max(1000).default(""),
  place: z.string().max(200).nullable().default(null),
  link: z.string().url().nullable().default(null),
  timeframe: z
    .object({
      label: z.string().max(60),
      start: z.coerce.date().optional(),
      end: z.coerce.date().optional(),
    })
    .nullable()
    .default(null),
  // "friends" is designed in but hidden in the UI until the follow graph ships.
  visibility: z.enum(["public", "friends"]).default("public"),
  interested: z.array(InterestedSchema).default([]),
  status: z.enum(["open", "converted", "closed", "expired"]).default("open"),
  convertedEventId: z.string().nullable().default(null),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
  expiresAt: z.coerce
    .date()
    .default(() => new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000)),
});

export const CreateIntentSchema = z.object({
  activity: z.string().min(1, "Say what you want to do").max(200),
  details: z.string().max(1000).optional(),
  place: z.string().max(200).nullable().optional(),
  link: z.string().url().nullable().optional(),
  timeframe: z
    .object({ label: z.string().min(1).max(60) })
    .nullable()
    .optional(),
  visibility: z.enum(["public", "friends"]).optional(),
});

export const UpdateIntentSchema = z.object({
  activity: z.string().min(1).max(200).optional(),
  details: z.string().max(1000).optional(),
  place: z.string().max(200).nullable().optional(),
  link: z.string().url().nullable().optional(),
  timeframe: z
    .object({ label: z.string().min(1).max(60) })
    .nullable()
    .optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export type Interested = z.infer<typeof InterestedSchema>;
export type Intent = z.infer<typeof IntentSchema>;
export type CreateIntent = z.infer<typeof CreateIntentSchema>;
export type UpdateIntent = z.infer<typeof UpdateIntentSchema>;

export const SerializedIntentSchema = IntentSchema.extend({
  _id: z.string(),
  interested: z.array(InterestedSchema.extend({ createdAt: z.string() })),
  timeframe: z
    .object({ label: z.string(), start: z.string().optional(), end: z.string().optional() })
    .nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  expiresAt: z.string(),
});

export type SerializedIntent = z.infer<typeof SerializedIntentSchema>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeIntent(doc: Intent & { _id: { toString(): string } }): SerializedIntent {
  return {
    ...doc,
    _id: doc._id.toString(),
    interested: doc.interested.map((i) => ({ ...i, createdAt: toIso(i.createdAt) })),
    timeframe: doc.timeframe
      ? {
          label: doc.timeframe.label,
          start: doc.timeframe.start ? toIso(doc.timeframe.start) : undefined,
          end: doc.timeframe.end ? toIso(doc.timeframe.end) : undefined,
        }
      : null,
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
    expiresAt: toIso(doc.expiresAt),
  };
}

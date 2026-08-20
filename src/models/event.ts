import { z } from "zod";

export const DateStatusSchema = z.enum(["confirmed", "polling"]);

export const EventSchema = z.object({
  createdBy: z.string().optional(),
  tenantId: z.string(),
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  location: z.string().min(1, "Location is required"),
  date: z.coerce.date(),
  // "polling": date is provisional (latest proposed option) until the host locks one.
  dateStatus: DateStatusSchema.default("confirmed"),
  image: z.string().default(""),
  flyer: z.string().default(""),
  isFeatured: z.boolean().default(false),
  isGuestOnly: z.boolean().default(false),
  allowAnonymousGuests: z.boolean().nullable().default(null),
  isPrivate: z.boolean().default(false),
  inviteCode: z.string().nullable().default(null),
  hosts: z.array(z.string()).default([]),
  // Written by scripts/migrate-social.ts; canonical host userIds going forward.
  hostUserIds: z.array(z.string()).optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
});

export const CreateEventSchema = EventSchema.omit({
  id: true,
  tenantId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.coerce.date(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export type DateStatus = z.infer<typeof DateStatusSchema>;
export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

export const SerializedEventSchema = EventSchema.extend({
  _id: z.string(),
  date: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SerializedEvent = z.infer<typeof SerializedEventSchema>;

function toIso(value: Date | string | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeEvent(doc: Event & { _id: { toString(): string } }): SerializedEvent {
  return {
    ...doc,
    _id: doc._id.toString(),
    date: doc.date instanceof Date ? doc.date.toISOString() : String(doc.date),
    createdAt: toIso(doc.createdAt),
    updatedAt: toIso(doc.updatedAt),
  };
}

export function resolveAnonymousGuests(event: SerializedEvent, tenantDefault: boolean): boolean {
  if (event.allowAnonymousGuests === null) return tenantDefault;
  return event.allowAnonymousGuests;
}

import { z } from "zod";

export const EventSchema = z.object({
  tenantId: z.string(),
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  location: z.string().min(1, "Location is required"),
  date: z.coerce.date(),
  image: z.string().default(""),
  flyer: z.string().default(""),
  isFeatured: z.boolean().default(false),
  isGuestOnly: z.boolean().default(false),
  allowAnonymousGuests: z.boolean().nullable().default(null),
  isPrivate: z.boolean().default(false),
  inviteCode: z.string().nullable().default(null),
});

export const CreateEventSchema = EventSchema.omit({ id: true, tenantId: true }).extend({
  date: z.coerce.date(),
});

export const UpdateEventSchema = CreateEventSchema.partial();

export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

export const SerializedEventSchema = EventSchema.extend({
  _id: z.string(),
  date: z.string(),
});

export type SerializedEvent = z.infer<typeof SerializedEventSchema>;

export function serializeEvent(doc: Event & { _id: { toString(): string } }): SerializedEvent {
  return {
    ...doc,
    _id: doc._id.toString(),
    date: doc.date instanceof Date ? doc.date.toISOString() : String(doc.date),
  };
}

export function resolveAnonymousGuests(event: SerializedEvent, tenantDefault: boolean): boolean {
  if (event.allowAnonymousGuests === null) return tenantDefault;
  return event.allowAnonymousGuests;
}

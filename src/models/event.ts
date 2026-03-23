import { z } from "zod";

export const EventSchema = z.object({
  tenantId: z.string(),
  id: z.string(),
  title: z.string().min(1, "Title is required"),
  description: z.string().default(""),
  location: z.string().min(1, "Location is required"),
  // z.coerce.date() handles all of: Date objects, ISO strings,
  // and the legacy "2022-10-22 17:00:00" format from your existing data
  date: z.coerce.date(),
  image: z.string().default(""),
  flyer: z.string().default(""),
  isFeatured: z.boolean().default(false),
  isGuestOnly: z.boolean().default(false),
});

// Schema for creating a new event (id + tenantId are set server-side)
export const CreateEventSchema = EventSchema.omit({
  id: true,
  tenantId: true,
}).extend({
  // date accepts a string from form inputs and coerces to Date
  date: z.coerce.date(),
});

// Schema for partial updates (all fields optional)
export const UpdateEventSchema = CreateEventSchema.partial();

// Inferred types — no need to maintain separate interfaces
export type Event = z.infer<typeof EventSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type UpdateEvent = z.infer<typeof UpdateEventSchema>;

// Serialised version safe for Next.js props (Date → ISO string)
export const SerializedEventSchema = EventSchema.extend({
  _id: z.string(),
  date: z.string(), // ISO string after serialisation
});

export type SerializedEvent = z.infer<typeof SerializedEventSchema>;

export function serializeEvent(
  doc: Event & { _id: { toString(): string } }
): SerializedEvent {
  return {
    ...doc,
    _id: doc._id.toString(),
    date: doc.date instanceof Date ? doc.date.toISOString() : String(doc.date),
  };
}

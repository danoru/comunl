import { z } from "zod";

export const AdditionalGuestSchema = z.object({
  name: z.string().optional(),
});

export const GuestSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  userId: z.string().nullable().optional(),
  displayName: z.string().min(1, "Name is required"),
  additionalGuests: z.array(AdditionalGuestSchema).default([]),
  totalCount: z.number().int().min(1).default(1),
  // optional() means the inferred Guest type won't require callers to
  // provide createdAt — Zod fills it via .default() at parse time.
  createdAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
});

export type Guest = z.infer<typeof GuestSchema>;
export type AdditionalGuest = z.infer<typeof AdditionalGuestSchema>;

export const SerializedGuestSchema = GuestSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
});

export type SerializedGuest = z.infer<typeof SerializedGuestSchema>;

export function serializeGuest(doc: Guest & { _id: { toString(): string } }): SerializedGuest {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : doc.createdAt
          ? String(doc.createdAt)
          : new Date().toISOString(),
  };
}

// Schema for POST /api/[eventId]/rsvp
export const CreateGuestSchema = GuestSchema.omit({
  tenantId: true,
  eventId: true,
  totalCount: true,
  createdAt: true,
});

export type CreateGuest = z.infer<typeof CreateGuestSchema>;

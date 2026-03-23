import { z } from "zod";

// An additional guest brought by the primary RSVP
export const AdditionalGuestSchema = z.object({
  name: z.string().optional(), // optional — can be anonymous
});

export const GuestSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),

  // Auth'd RSVP — userId is set, displayName comes from profile
  userId: z.string().optional(),
  // Anonymous RSVP — userId is null, displayName is manually entered
  displayName: z.string().min(1, "Name is required"),

  additionalGuests: z.array(AdditionalGuestSchema).default([]),

  // Stored for fast headcount queries without aggregation
  totalCount: z.number().int().min(1).default(1),

  createdAt: z.coerce.date().default(() => new Date()),
});

export type Guest = z.infer<typeof GuestSchema>;
export type AdditionalGuest = z.infer<typeof AdditionalGuestSchema>;

export const SerializedGuestSchema = GuestSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
});

export type SerializedGuest = z.infer<typeof SerializedGuestSchema>;

export function serializeGuest(
  doc: Guest & { _id: { toString(): string } }
): SerializedGuest {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

// Schema for POST /api/[eventId]/rsvp
export const CreateGuestSchema = GuestSchema.omit({
  tenantId: true,
  eventId: true,
  totalCount: true, // computed server-side
  createdAt: true,
});

export type CreateGuest = z.infer<typeof CreateGuestSchema>;

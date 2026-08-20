import { z } from "zod";

// In-app notifications, fanned out synchronously at write time in the API
// handlers (audiences are tiny: interested lists, poll voters, hosts).
export const NotificationTypeSchema = z.enum([
  "intent_interest",
  "intent_converted",
  "poll_vote",
  "date_locked",
  "new_follower",
]);

export const NotificationSchema = z.object({
  tenantId: z.string(),
  userId: z.string(), // recipient
  type: NotificationTypeSchema,
  actorName: z.string(),
  actorImage: z.string().nullable().default(null),
  // Where tapping the notification goes: event → /events/{id}, intent →
  // /intents, user → /profile/{id} (id = handle).
  subject: z.object({
    kind: z.enum(["event", "intent", "user"]),
    id: z.string(),
  }),
  message: z.string().max(300),
  readAt: z.coerce.date().nullable().default(null),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type NotificationType = z.infer<typeof NotificationTypeSchema>;
export type Notification = z.infer<typeof NotificationSchema>;

export const SerializedNotificationSchema = NotificationSchema.extend({
  _id: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});

export type SerializedNotification = z.infer<typeof SerializedNotificationSchema>;

function toIso(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function serializeNotification(
  doc: Notification & { _id: { toString(): string } }
): SerializedNotification {
  return {
    ...doc,
    _id: doc._id.toString(),
    readAt: doc.readAt === null ? null : toIso(doc.readAt),
    createdAt: toIso(doc.createdAt),
  };
}

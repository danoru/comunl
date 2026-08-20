import { z } from "zod";

// One doc per (user, browser) push endpoint. Dead endpoints are pruned when a
// send returns 404/410.
export const PushSubscriptionSchema = z.object({
  tenantId: z.string(),
  userId: z.string(),
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  createdAt: z.coerce.date().default(() => new Date()),
});

export const RegisterPushSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type PushSubscription = z.infer<typeof PushSubscriptionSchema>;
export type RegisterPush = z.infer<typeof RegisterPushSchema>;

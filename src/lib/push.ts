import webPush from "web-push";

import { getPushSubscriptionsForUsers, deletePushSubscription } from "./db";

let configured = false;

function ensureConfigured(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  if (!configured) {
    webPush.setVapidDetails(
      process.env.VAPID_SUBJECT ?? "mailto:admin@comunl.app",
      publicKey,
      privateKey
    );
    configured = true;
  }
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
}

// Best-effort: push failures never break the triggering action, and dead
// endpoints (404/410) are pruned as they're discovered.
export async function sendPushToUsers(
  tenantId: string,
  userIds: string[],
  payload: PushPayload
): Promise<void> {
  if (userIds.length === 0 || !ensureConfigured()) return;

  try {
    const subscriptions = await getPushSubscriptionsForUsers(tenantId, userIds);
    const body = JSON.stringify(payload);

    await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          await webPush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, body);
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(tenantId, sub.endpoint).catch(() => undefined);
          } else {
            console.warn("[push] send failed:", statusCode ?? err);
          }
        }
      })
    );
  } catch (err) {
    console.warn("[push] fan-out failed:", err);
  }
}

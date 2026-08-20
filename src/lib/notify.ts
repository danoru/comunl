import dayjs from "dayjs";

import type { Notification, SerializedEvent, SerializedIntent } from "../models";

import { addNotifications } from "./db";
import { sendPushToUsers } from "./push";

type NotificationInput = Omit<Notification, "tenantId" | "readAt" | "createdAt">;

function subjectUrl(subject: NotificationInput["subject"]): string {
  if (subject.kind === "event") return `/events/${subject.id}`;
  if (subject.kind === "user") return `/profile/${subject.id}`;
  return "/intents";
}

// Fan-out is synchronous at write time but never fatal — a failed notification
// insert must not break the action that triggered it. Each in-app notification
// also goes out as a web push to that user's subscribed devices.
async function fanOut(tenantId: string, notifications: NotificationInput[]): Promise<void> {
  try {
    await addNotifications(tenantId, notifications);
  } catch (err) {
    console.warn("[notify] fan-out failed:", err);
  }
  await Promise.all(
    notifications.map((n) =>
      sendPushToUsers(tenantId, [n.userId], {
        title: "Comunl",
        body: n.message,
        url: subjectUrl(n.subject),
        tag: `${n.type}:${n.subject.kind}:${n.subject.id}`,
      })
    )
  );
}

interface Actor {
  userId: string;
  name: string;
  image: string | null;
}

export async function notifyIntentInterest(
  tenantId: string,
  intent: SerializedIntent,
  actor: Actor
): Promise<void> {
  if (intent.userId === actor.userId) return;
  await fanOut(tenantId, [
    {
      userId: intent.userId,
      type: "intent_interest",
      actorName: actor.name,
      actorImage: actor.image,
      subject: { kind: "intent", id: intent.id },
      message: `${actor.name} is in on "${intent.activity}"`,
    },
  ]);
}

export async function notifyIntentConverted(
  tenantId: string,
  intent: SerializedIntent,
  event: SerializedEvent,
  actor: Actor
): Promise<void> {
  const recipients = intent.interested.filter((i) => i.userId !== actor.userId);
  await fanOut(
    tenantId,
    recipients.map((i) => ({
      userId: i.userId,
      type: "intent_converted" as const,
      actorName: actor.name,
      actorImage: actor.image,
      subject: { kind: "event" as const, id: event.id },
      message:
        event.dateStatus === "polling"
          ? `"${intent.activity}" is happening — help pick the date`
          : `"${intent.activity}" is happening — RSVP now`,
    }))
  );
}

export async function notifyPollVote(
  tenantId: string,
  event: SerializedEvent,
  actor: Actor,
  voterName: string
): Promise<void> {
  const hosts = new Set(
    [event.createdBy, ...(event.hosts ?? []), ...(event.hostUserIds ?? [])].filter(
      (id): id is string => !!id && id !== actor.userId
    )
  );
  await fanOut(
    tenantId,
    [...hosts].map((userId) => ({
      userId,
      type: "poll_vote" as const,
      actorName: voterName,
      actorImage: actor.image,
      subject: { kind: "event" as const, id: event.id },
      message: `${voterName} voted on your "${event.title}" poll`,
    }))
  );
}

export async function notifyDateLocked(
  tenantId: string,
  event: SerializedEvent,
  lockedDate: Date,
  voterUserIds: string[],
  actor: Actor
): Promise<void> {
  const recipients = [...new Set(voterUserIds)].filter((id) => id !== actor.userId);
  const dateLabel = dayjs(lockedDate).format("ddd, MMM D · h:mm A");
  await fanOut(
    tenantId,
    recipients.map((userId) => ({
      userId,
      type: "date_locked" as const,
      actorName: actor.name,
      actorImage: actor.image,
      subject: { kind: "event" as const, id: event.id },
      message: `"${event.title}" is locked for ${dateLabel} — RSVP now`,
    }))
  );
}

export async function notifyNewFollower(
  tenantId: string,
  followeeUserId: string,
  actor: Actor,
  actorHandle: string | null
): Promise<void> {
  await fanOut(tenantId, [
    {
      userId: followeeUserId,
      type: "new_follower",
      actorName: actor.name,
      actorImage: actor.image,
      subject: { kind: "user", id: actorHandle ?? actor.userId },
      message: `${actor.name} followed you`,
    },
  ]);
}

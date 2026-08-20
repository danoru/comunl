import { MongoClient, Collection, Document, Filter, Sort, ObjectId } from "mongodb";
import { z } from "zod";

import {
  EventSchema,
  SerializedEvent,
  serializeEvent,
  ItemSchema,
  SerializedItem,
  serializeItem,
  GuestSchema,
  SerializedGuest,
  serializeGuest,
  CommentSchema,
  SerializedComment,
  serializeComment,
  UserSchema,
  SerializedUser,
  serializeUser,
  DatePollSchema,
  SerializedDatePoll,
  serializeDatePoll,
  DatePollVoteSchema,
  SerializedDatePollVote,
  serializeDatePollVote,
  IntentSchema,
  SerializedIntent,
  serializeIntent,
  NotificationSchema,
  SerializedNotification,
  serializeNotification,
  FollowSchema,
  PushSubscriptionSchema,
  PageViewSchema,
  type AdminDashboard,
  type FollowState,
  type LocationStat,
  type Notification,
  type PageView,
  type PathStat,
  type PushSubscription,
  type TrafficDay,
  type Intent,
  type Interested,
  type Event,
  type Item,
  type Guest,
  type Comment,
  type User,
  type DatePoll,
  type DatePollVote,
} from "../models";

let cachedClient: MongoClient | null = null;

const DB_NAME = process.env.MONGODB_DB ?? "comunl";

export async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  cachedClient = await MongoClient.connect(process.env.MONGODB_URI);
  return cachedClient;
}

export async function getDb() {
  const client = await getClient();
  return client.db(DB_NAME);
}

async function col<T extends Document>(name: string): Promise<Collection<T>> {
  const db = await getDb();
  return db.collection<T>(name);
}

function parseMany<T>(schema: z.ZodType<T>, docs: unknown[]): T[] {
  return docs.flatMap((doc) => {
    const result = schema.safeParse(doc);
    if (!result.success) {
      console.warn("[db] Validation failed:", result.error.flatten());
      console.warn("[db] Raw doc:", JSON.stringify(doc, null, 2)); // ← add this
      return [];
    }
    return [result.data];
  });
}
function parseOne<T>(schema: z.ZodType<T>, doc: unknown): T {
  return schema.parse(doc);
}

const withId = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.extend({ _id: z.any() });

export async function getEvents(
  tenantId: string,
  filter: Filter<Document> = {},
  sort: Sort = { date: -1 }
): Promise<SerializedEvent[]> {
  const c = await col("events");
  const docs = await c
    .find({ ...filter, tenantId, deletedAt: { $exists: false } })
    .sort(sort)
    .toArray();
  return parseMany(withId(EventSchema), docs).map(serializeEvent as any);
}

export interface EventViewer {
  userId?: string;
  isAdmin?: boolean;
}

// Private events are hidden from list queries unless the viewer is an admin,
// the creator, or a host. (The detail page has its own invite-code gate.)
export function eventVisibilityFilter(viewer?: EventViewer): Filter<Document> {
  if (viewer?.isAdmin) return {};
  if (viewer?.userId) {
    return {
      $or: [
        { isPrivate: { $ne: true } },
        { createdBy: viewer.userId },
        { hosts: viewer.userId },
        { hostUserIds: viewer.userId },
      ],
    };
  }
  return { isPrivate: { $ne: true } };
}

export async function getVisibleEvents(
  tenantId: string,
  viewer?: EventViewer,
  filter: Filter<Document> = {},
  sort: Sort = { date: -1 }
): Promise<SerializedEvent[]> {
  return getEvents(tenantId, { ...filter, ...eventVisibilityFilter(viewer) }, sort);
}

export async function getEvent(tenantId: string, eventId: string): Promise<SerializedEvent | null> {
  const c = await col("events");
  const doc = await c.findOne({ id: eventId, tenantId, deletedAt: { $exists: false } });
  if (!doc) return null;
  return serializeEvent(parseOne(withId(EventSchema), doc) as any);
}

export async function getFeaturedEvents(
  tenantId: string,
  viewer?: EventViewer
): Promise<SerializedEvent[]> {
  return getVisibleEvents(tenantId, viewer, { isFeatured: true });
}

export async function createEvent(
  tenantId: string,
  data: Omit<Event, "tenantId">
): Promise<SerializedEvent> {
  const c = await col("events");
  const now = new Date();
  const doc = EventSchema.parse({ ...data, tenantId, createdAt: now, updatedAt: now });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeEvent({ _id, ...doc } as any);
}

export async function updateEvent(
  tenantId: string,
  eventId: string,
  data: Partial<Omit<Event, "tenantId" | "id">>
): Promise<boolean> {
  const c = await col("events");
  const result = await c.updateOne(
    { id: eventId, tenantId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteEvent(tenantId: string, eventId: string): Promise<boolean> {
  const c = await col("events");
  const result = await c.updateOne({ id: eventId, tenantId }, { $set: { deletedAt: new Date() } });
  return result.modifiedCount > 0;
}

export async function getItems(
  tenantId: string,
  eventId: string,
  filter: Filter<Document> = {}
): Promise<SerializedItem[]> {
  const c = await col("items");
  const docs = await c.find({ ...filter, tenantId, eventId }).toArray();
  return parseMany(withId(ItemSchema), docs).map(serializeItem as any);
}

export async function addItem(
  tenantId: string,
  eventId: string,
  data: Omit<Item, "tenantId" | "eventId">
): Promise<SerializedItem> {
  const c = await col("items");
  const doc = ItemSchema.parse({ ...data, tenantId, eventId });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeItem({ _id, ...doc } as any);
}

export async function deleteItem(
  tenantId: string,
  eventId: string,
  itemId: string
): Promise<boolean> {
  const c = await col("items");
  const result = await c.deleteOne({ _id: new ObjectId(itemId), tenantId, eventId });
  return result.deletedCount > 0;
}

export async function getItem(
  tenantId: string,
  eventId: string,
  itemId: string
): Promise<SerializedItem | null> {
  const c = await col("items");
  const doc = await c.findOne({ _id: new ObjectId(itemId), tenantId, eventId });
  if (!doc) return null;
  return serializeItem(parseOne(withId(ItemSchema), doc) as any);
}

export async function updateItem(
  tenantId: string,
  eventId: string,
  itemId: string,
  set: Partial<Omit<Item, "tenantId" | "eventId">>,
  unset: (keyof Item)[] = []
): Promise<boolean> {
  const c = await col("items");
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length > 0) update.$set = set;
  if (unset.length > 0) {
    update.$unset = Object.fromEntries(unset.map((k) => [k, ""]));
  }
  if (!update.$set && !update.$unset) return false;
  const result = await c.updateOne({ _id: new ObjectId(itemId), tenantId, eventId }, update);
  return result.modifiedCount > 0;
}

export async function getGuests(tenantId: string, eventId: string): Promise<SerializedGuest[]> {
  const c = await col("guests");
  const docs = await c.find({ tenantId, eventId }).sort({ createdAt: 1 }).toArray();
  return parseMany(withId(GuestSchema), docs).map(serializeGuest as any);
}

export async function getGuestCount(tenantId: string, eventId: string): Promise<number> {
  const c = await col("guests");
  const result = await c
    .aggregate([
      { $match: { tenantId, eventId } },
      { $group: { _id: null, total: { $sum: "$totalCount" } } },
    ])
    .toArray();
  return result[0]?.total ?? 0;
}

export async function addGuest(
  tenantId: string,
  eventId: string,
  data: Omit<Guest, "tenantId" | "eventId" | "totalCount" | "createdAt">
): Promise<SerializedGuest> {
  const c = await col("guests");
  const totalCount = 1 + (data.additionalGuests?.length ?? 0);
  const doc = GuestSchema.parse({ ...data, tenantId, eventId, totalCount });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeGuest({ _id, ...doc } as any);
}

export async function deleteGuest(
  tenantId: string,
  eventId: string,
  guestId: string,
  userId?: string
): Promise<boolean> {
  const c = await col("guests");
  const filter: any = { _id: new ObjectId(guestId), tenantId, eventId };
  if (userId) filter.userId = userId;
  const result = await c.deleteOne(filter);
  return result.deletedCount > 0;
}

export async function getExistingRSVP(
  tenantId: string,
  eventId: string,
  userId: string
): Promise<SerializedGuest | null> {
  const c = await col("guests");
  const doc = await c.findOne({ tenantId, eventId, userId });
  if (!doc) return null;
  return serializeGuest(parseOne(withId(GuestSchema), doc) as any);
}

export async function getComments(tenantId: string, eventId: string): Promise<SerializedComment[]> {
  const c = await col("comments");
  const docs = await c.find({ tenantId, eventId }).sort({ createdAt: 1 }).toArray();
  return parseMany(withId(CommentSchema), docs).map(serializeComment as any);
}

export async function getPhotos(tenantId: string, eventId: string): Promise<SerializedComment[]> {
  const c = await col("comments");
  const docs = await c
    .find({ tenantId, eventId, imageUrl: { $exists: true, $ne: null } })
    .sort({ createdAt: 1 })
    .toArray();
  return parseMany(withId(CommentSchema), docs).map(serializeComment as any);
}

export async function addComment(
  tenantId: string,
  eventId: string,
  data: Omit<Comment, "tenantId" | "eventId" | "createdAt">
): Promise<SerializedComment> {
  const c = await col("comments");
  const doc = CommentSchema.parse({ ...data, tenantId, eventId });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeComment({ _id, ...doc } as any);
}

export async function deleteComment(
  tenantId: string,
  eventId: string,
  commentId: string,
  userId?: string
): Promise<boolean> {
  const c = await col("comments");
  const filter: any = { _id: new ObjectId(commentId), tenantId, eventId };
  if (userId) filter.userId = userId;
  const result = await c.deleteOne(filter);
  return result.deletedCount > 0;
}

export async function getUser(userId: string): Promise<SerializedUser | null> {
  const c = await col("users");
  const doc = await c.findOne({ userId });
  if (!doc) return null;
  return serializeUser(parseOne(withId(UserSchema), doc) as any);
}

export async function upsertUser(data: User): Promise<SerializedUser> {
  const c = await col("users");
  const { createdAt, ...rest } = UserSchema.parse({ ...data, updatedAt: new Date() });
  await c.updateOne(
    { userId: data.userId },
    { $set: rest, $setOnInsert: { createdAt: createdAt ?? new Date() } },
    { upsert: true }
  );
  const updated = await c.findOne({ userId: data.userId });
  return serializeUser(parseOne(withId(UserSchema), updated) as any);
}
export async function updateUser(
  userId: string,
  data: Partial<Pick<User, "name" | "phone" | "city" | "state" | "dietaryPreferences">>
): Promise<boolean> {
  const c = await col("users");
  const result = await c.updateOne({ userId }, { $set: { ...data, updatedAt: new Date() } });
  return result.modifiedCount > 0;
}

export async function getDietaryAlerts(tenantId: string, eventId: string): Promise<string[]> {
  const guestCol = await col("guests");
  const guests = await guestCol
    .find({ tenantId, eventId, userId: { $exists: true, $ne: null } })
    .toArray();

  const userIds = [...new Set(guests.map((g) => g.userId).filter(Boolean))];
  if (userIds.length === 0) return [];

  const userCol = await col("users");
  const users = await userCol.find({ userId: { $in: userIds } }).toArray();

  const all = users.flatMap((u) => {
    const prefs = u.dietaryPreferences;
    if (!prefs) return [];
    if (typeof prefs === "string")
      return prefs
        .split(",")
        .map((s: string) => s.trim())
        .filter(Boolean);
    if (Array.isArray(prefs)) return prefs as string[];
    return [];
  });

  return [...new Set(all)].sort();
}

export async function getDatePoll(
  tenantId: string,
  eventId: string
): Promise<SerializedDatePoll | null> {
  const c = await col("datePolls");
  const doc = await c.findOne({ tenantId, eventId });
  if (!doc) return null;
  return serializeDatePoll(parseOne(withId(DatePollSchema), doc) as any);
}

export async function createDatePoll(
  tenantId: string,
  eventId: string,
  data: Omit<DatePoll, "tenantId" | "eventId" | "createdAt" | "updatedAt">
): Promise<SerializedDatePoll> {
  const c = await col("datePolls");
  const doc = DatePollSchema.parse({ ...data, tenantId, eventId });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeDatePoll({ _id, ...doc } as any);
}

export async function updateDatePoll(
  tenantId: string,
  eventId: string,
  data: Partial<Pick<DatePoll, "options" | "status" | "lockedOptionId" | "allowMaybe">>
): Promise<boolean> {
  const c = await col("datePolls");
  const result = await c.updateOne(
    { tenantId, eventId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function getDatePollVotes(
  tenantId: string,
  eventId: string
): Promise<SerializedDatePollVote[]> {
  const c = await col("datePollVotes");
  const docs = await c.find({ tenantId, eventId }).sort({ createdAt: 1 }).toArray();
  return parseMany(withId(DatePollVoteSchema), docs).map(serializeDatePollVote as any);
}

export async function upsertDatePollVote(
  tenantId: string,
  eventId: string,
  data: Omit<DatePollVote, "tenantId" | "eventId" | "createdAt" | "updatedAt">
): Promise<{ vote: SerializedDatePollVote; created: boolean }> {
  const c = await col("datePollVotes");
  const now = new Date();
  const rest: Partial<DatePollVote> = DatePollVoteSchema.parse({ ...data, tenantId, eventId });
  delete rest.createdAt;
  delete rest.updatedAt;
  const result = await c.updateOne(
    { tenantId, eventId, participantKey: data.participantKey },
    { $set: { ...rest, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );
  const doc = await c.findOne({ tenantId, eventId, participantKey: data.participantKey });
  return {
    vote: serializeDatePollVote(parseOne(withId(DatePollVoteSchema), doc) as any),
    created: result.upsertedCount > 0,
  };
}

export async function deleteDatePollVote(
  tenantId: string,
  eventId: string,
  participantKey: string
): Promise<boolean> {
  const c = await col("datePollVotes");
  const result = await c.deleteOne({ tenantId, eventId, participantKey });
  return result.deletedCount > 0;
}

// Feed: open + converted (social proof), non-expired, newest first. Friends-
// visibility intents show only to mutuals (pass the viewer's mutualIds).
export async function getIntents(
  tenantId: string,
  viewerUserId: string,
  limit = 50,
  mutualIds: string[] = []
): Promise<SerializedIntent[]> {
  const c = await col("intents");
  const docs = await c
    .find({
      tenantId,
      status: { $in: ["open", "converted"] },
      expiresAt: { $gt: new Date() },
      $or: [
        { visibility: "public" },
        { visibility: "friends", userId: { $in: mutualIds } },
        { userId: viewerUserId },
      ],
    })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
  return parseMany(withId(IntentSchema), docs).map(serializeIntent as any);
}

export async function getIntent(
  tenantId: string,
  intentId: string
): Promise<SerializedIntent | null> {
  const c = await col("intents");
  const doc = await c.findOne({ tenantId, id: intentId });
  if (!doc) return null;
  return serializeIntent(parseOne(withId(IntentSchema), doc) as any);
}

export async function createIntent(
  tenantId: string,
  data: Omit<Intent, "tenantId" | "createdAt" | "updatedAt" | "expiresAt">
): Promise<SerializedIntent> {
  const c = await col("intents");
  const doc = IntentSchema.parse({ ...data, tenantId });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeIntent({ _id, ...doc } as any);
}

export async function updateIntent(
  tenantId: string,
  intentId: string,
  data: Partial<
    Pick<
      Intent,
      "activity" | "details" | "place" | "link" | "timeframe" | "status" | "convertedEventId"
    >
  >
): Promise<boolean> {
  const c = await col("intents");
  const result = await c.updateOne(
    { tenantId, id: intentId },
    { $set: { ...data, updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function deleteIntent(tenantId: string, intentId: string): Promise<boolean> {
  const c = await col("intents");
  const result = await c.deleteOne({ tenantId, id: intentId });
  return result.deletedCount > 0;
}

export async function addIntentInterest(
  tenantId: string,
  intentId: string,
  interested: Interested
): Promise<boolean> {
  const c = await col("intents");
  const result = await c.updateOne(
    { tenantId, id: intentId, status: "open", "interested.userId": { $ne: interested.userId } },
    { $push: { interested: interested as any }, $set: { updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

export async function removeIntentInterest(
  tenantId: string,
  intentId: string,
  userId: string
): Promise<boolean> {
  const c = await col("intents");
  const result = await c.updateOne(
    { tenantId, id: intentId },
    { $pull: { interested: { userId } as any }, $set: { updatedAt: new Date() } }
  );
  return result.modifiedCount > 0;
}

// Cheap in-handler abuse caps (no vendor rate-limit infra at this scale).
export async function countOpenIntents(tenantId: string, userId: string): Promise<number> {
  const c = await col("intents");
  return c.countDocuments({ tenantId, userId, status: "open" });
}

export async function countRecentIntents(
  tenantId: string,
  userId: string,
  since: Date
): Promise<number> {
  const c = await col("intents");
  return c.countDocuments({ tenantId, userId, createdAt: { $gte: since } });
}

export async function getUserByHandle(
  tenantId: string,
  handle: string
): Promise<SerializedUser | null> {
  const c = await col("users");
  const doc = await c.findOne({ tenantId, handle: handle.toLowerCase() });
  if (!doc) return null;
  return serializeUser(parseOne(withId(UserSchema), doc) as any);
}

// ── Follows (friends = mutual follow) ───────────────────────────────────────

export async function followUser(
  tenantId: string,
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const c = await col("follows");
  const doc = FollowSchema.parse({ tenantId, followerId, followeeId });
  const result = await c.updateOne(
    { tenantId, followerId, followeeId },
    { $setOnInsert: doc },
    { upsert: true }
  );
  return result.upsertedCount > 0;
}

export async function unfollowUser(
  tenantId: string,
  followerId: string,
  followeeId: string
): Promise<boolean> {
  const c = await col("follows");
  const result = await c.deleteOne({ tenantId, followerId, followeeId });
  return result.deletedCount > 0;
}

export async function getFollowState(
  tenantId: string,
  viewerId: string,
  targetId: string
): Promise<FollowState> {
  const c = await col("follows");
  const [following, followedBy] = await Promise.all([
    c.findOne({ tenantId, followerId: viewerId, followeeId: targetId }),
    c.findOne({ tenantId, followerId: targetId, followeeId: viewerId }),
  ]);
  return { following: !!following, followedBy: !!followedBy };
}

// Two indexed queries, intersected in app code — fine at friends scale.
export async function getMutualIds(tenantId: string, userId: string): Promise<string[]> {
  const c = await col("follows");
  const [followees, followers] = await Promise.all([
    c.find({ tenantId, followerId: userId }).project({ followeeId: 1 }).toArray(),
    c.find({ tenantId, followeeId: userId }).project({ followerId: 1 }).toArray(),
  ]);
  const followerSet = new Set(followers.map((f) => f.followerId));
  return followees.map((f) => f.followeeId).filter((id) => followerSet.has(id));
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function addNotifications(
  tenantId: string,
  notifications: Omit<Notification, "tenantId" | "readAt" | "createdAt">[]
): Promise<void> {
  if (notifications.length === 0) return;
  const c = await col("notifications");
  const docs = notifications.map((n) => ({
    _id: new ObjectId(),
    ...NotificationSchema.parse({ ...n, tenantId }),
  }));
  await c.insertMany(docs as any);
}

export async function getNotifications(
  tenantId: string,
  userId: string,
  limit = 30
): Promise<SerializedNotification[]> {
  const c = await col("notifications");
  const docs = await c.find({ tenantId, userId }).sort({ createdAt: -1 }).limit(limit).toArray();
  return parseMany(withId(NotificationSchema), docs).map(serializeNotification as any);
}

export async function getUnreadNotificationCount(
  tenantId: string,
  userId: string
): Promise<number> {
  const c = await col("notifications");
  return c.countDocuments({ tenantId, userId, readAt: null });
}

export async function markNotificationsRead(tenantId: string, userId: string): Promise<void> {
  const c = await col("notifications");
  await c.updateMany({ tenantId, userId, readAt: null }, { $set: { readAt: new Date() } });
}

// ── Push subscriptions ──────────────────────────────────────────────────────

export async function upsertPushSubscription(
  tenantId: string,
  data: Omit<PushSubscription, "tenantId" | "createdAt">
): Promise<void> {
  const c = await col("pushSubscriptions");
  const doc = PushSubscriptionSchema.parse({ ...data, tenantId });
  const { createdAt, ...rest } = doc;
  await c.updateOne(
    { tenantId, endpoint: doc.endpoint },
    { $set: rest, $setOnInsert: { createdAt } },
    { upsert: true }
  );
}

export async function deletePushSubscription(tenantId: string, endpoint: string): Promise<boolean> {
  const c = await col("pushSubscriptions");
  const result = await c.deleteMany({ tenantId, endpoint });
  return result.deletedCount > 0;
}

export async function getPushSubscriptionsForUsers(
  tenantId: string,
  userIds: string[]
): Promise<PushSubscription[]> {
  if (userIds.length === 0) return [];
  const c = await col("pushSubscriptions");
  const docs = await c.find({ tenantId, userId: { $in: userIds } }).toArray();
  return parseMany(PushSubscriptionSchema, docs);
}

// ── Analytics ───────────────────────────────────────────────────────────────

export async function addPageView(
  tenantId: string,
  data: Omit<PageView, "tenantId" | "createdAt">
): Promise<void> {
  const c = await col("pageViews");
  await c.insertOne(PageViewSchema.parse({ ...data, tenantId }) as any);
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function utcDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// Zero-fills missing days so the chart never shows a broken time axis.
function fillTrafficDays(
  rows: { _id: string; accounts: number; guests: number }[],
  days: number
): TrafficDay[] {
  const byDay = new Map(rows.map((r) => [r._id, r]));
  const out: TrafficDay[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = utcDayKey(daysAgo(i));
    const row = byDay.get(day);
    out.push({ day, accounts: row?.accounts ?? 0, guests: row?.guests ?? 0 });
  }
  return out;
}

async function getTraffic(tenantId: string, days: number): Promise<TrafficDay[]> {
  const c = await col("pageViews");
  const rows = await c
    .aggregate<{ _id: string; accounts: number; guests: number }>([
      { $match: { tenantId, createdAt: { $gte: daysAgo(days - 1) } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          accounts: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 1, 0] } },
          guests: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 0, 1] } },
        },
      },
    ])
    .toArray();
  return fillTrafficDays(rows, days);
}

async function getTrafficSummary(tenantId: string, days: number) {
  const c = await col("pageViews");
  const [row] = await c
    .aggregate<{
      views: number;
      uniqueVisitors: string[];
      accountViews: number;
      guestViews: number;
      standaloneViews: number;
    }>([
      { $match: { tenantId, createdAt: { $gte: daysAgo(days) } } },
      {
        $group: {
          _id: null,
          views: { $sum: 1 },
          uniqueVisitors: { $addToSet: "$visitorHash" },
          accountViews: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 1, 0] } },
          guestViews: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 0, 1] } },
          standaloneViews: { $sum: { $cond: ["$standalone", 1, 0] } },
        },
      },
    ])
    .toArray();

  return {
    views: row?.views ?? 0,
    uniqueVisitors: row?.uniqueVisitors?.length ?? 0,
    accountViews: row?.accountViews ?? 0,
    guestViews: row?.guestViews ?? 0,
    standaloneViews: row?.standaloneViews ?? 0,
  };
}

async function getLocations(tenantId: string, days: number): Promise<LocationStat[]> {
  const c = await col("pageViews");
  const rows = await c
    .aggregate<LocationStat & { _id: unknown }>([
      { $match: { tenantId, createdAt: { $gte: daysAgo(days) } } },
      {
        $group: {
          _id: { city: "$city", region: "$region", country: "$country" },
          lat: { $avg: "$lat" },
          lon: { $avg: "$lon" },
          accounts: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 1, 0] } },
          guests: { $sum: { $cond: [{ $ifNull: ["$userId", false] }, 0, 1] } },
          total: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 200 },
      {
        $project: {
          _id: 0,
          city: "$_id.city",
          region: "$_id.region",
          country: "$_id.country",
          lat: 1,
          lon: 1,
          accounts: 1,
          guests: 1,
          total: 1,
        },
      },
    ])
    .toArray();
  return rows;
}

async function getTopPaths(tenantId: string, days: number): Promise<PathStat[]> {
  const c = await col("pageViews");
  return c
    .aggregate<PathStat>([
      { $match: { tenantId, createdAt: { $gte: daysAgo(days) } } },
      { $group: { _id: "$path", views: { $sum: 1 }, visitors: { $addToSet: "$visitorHash" } } },
      { $sort: { views: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, path: "$_id", views: 1, uniques: { $size: "$visitors" } } },
    ])
    .toArray();
}

async function getDevices(tenantId: string, days: number) {
  const c = await col("pageViews");
  return c
    .aggregate<{
      device: string;
      views: number;
    }>([
      { $match: { tenantId, createdAt: { $gte: daysAgo(days) } } },
      { $group: { _id: "$device", views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $project: { _id: 0, device: "$_id", views: 1 } },
    ])
    .toArray();
}

async function getLoopFunnel(tenantId: string) {
  const [intents, polls, guests] = await Promise.all([
    col("intents"),
    col("datePolls"),
    col("guests"),
  ]);

  const [rallies, withInterest, convertedDocs, pollsCreated, pollsLocked, votedPollEventIds] =
    await Promise.all([
      intents.countDocuments({ tenantId }),
      intents.countDocuments({ tenantId, "interested.0": { $exists: true } }),
      intents
        .find({ tenantId, status: "converted", convertedEventId: { $ne: null } })
        .project({ convertedEventId: 1 })
        .toArray(),
      polls.countDocuments({ tenantId }),
      polls.countDocuments({ tenantId, status: "locked" }),
      (await col("datePollVotes")).distinct("eventId", { tenantId }),
    ]);

  const convertedEventIds = convertedDocs.map((d) => d.convertedEventId as string).filter(Boolean);

  const [headcount] = convertedEventIds.length
    ? await guests
        .aggregate<{
          total: number;
        }>([
          { $match: { tenantId, eventId: { $in: convertedEventIds } } },
          { $group: { _id: null, total: { $sum: "$totalCount" } } },
        ])
        .toArray()
    : [];

  return {
    rallies,
    withInterest,
    converted: convertedEventIds.length,
    pollsCreated,
    pollsVotedOn: votedPollEventIds.length,
    pollsLocked,
    rsvpsFromRallies: headcount?.total ?? 0,
  };
}

// Every tenant with data in this database. The admin panel is deploy-agnostic:
// one deploy can inspect another tenant's numbers (e.g. legacy "cody" data)
// without redeploying with a different NEXT_PUBLIC_TENANT_ID.
export async function getKnownTenants(): Promise<{ tenantId: string; events: number }[]> {
  const events = await col("events");
  const rows = await events
    .aggregate<{
      _id: string | null;
      events: number;
    }>([
      { $match: { deletedAt: { $exists: false } } },
      { $group: { _id: "$tenantId", events: { $sum: 1 } } },
      { $sort: { events: -1 } },
    ])
    .toArray();
  return rows
    .filter((r) => typeof r._id === "string" && r._id.length > 0)
    .map((r) => ({ tenantId: r._id as string, events: r.events }));
}

export async function getAdminDashboard(
  tenantId: string,
  windowDays = 30
): Promise<AdminDashboard> {
  const [users, events, guests, intents, follows, pushSubs] = await Promise.all([
    col("users"),
    col("events"),
    col("guests"),
    col("intents"),
    col("follows"),
    col("pushSubscriptions"),
  ]);

  const now = new Date();
  const liveEvents = { tenantId, deletedAt: { $exists: false } };

  const [
    totalUsers,
    newUsers7d,
    totalEvents,
    upcomingEvents,
    pollingEvents,
    rsvpAgg,
    totalRallies,
    openRallies,
    totalFollows,
    totalPushSubs,
    traffic,
    trafficSummary,
    locations,
    topPaths,
    devices,
    recentUserDocs,
    recentEventDocs,
    recentRallyDocs,
    funnel,
  ] = await Promise.all([
    users.countDocuments({ tenantId }),
    users.countDocuments({ tenantId, createdAt: { $gte: daysAgo(7) } }),
    events.countDocuments(liveEvents),
    events.countDocuments({ ...liveEvents, date: { $gte: now } }),
    events.countDocuments({ ...liveEvents, dateStatus: "polling" }),
    guests
      .aggregate<{
        total: number;
      }>([{ $match: { tenantId } }, { $group: { _id: null, total: { $sum: "$totalCount" } } }])
      .toArray(),
    intents.countDocuments({ tenantId }),
    intents.countDocuments({ tenantId, status: "open" }),
    follows.countDocuments({ tenantId }),
    pushSubs.countDocuments({ tenantId }),
    getTraffic(tenantId, windowDays),
    getTrafficSummary(tenantId, windowDays),
    getLocations(tenantId, windowDays),
    getTopPaths(tenantId, windowDays),
    getDevices(tenantId, windowDays),
    users.find({ tenantId }).sort({ createdAt: -1 }).limit(12).toArray(),
    events.find(liveEvents).sort({ _id: -1 }).limit(10).toArray(),
    intents.find({ tenantId }).sort({ createdAt: -1 }).limit(10).toArray(),
    getLoopFunnel(tenantId),
  ]);

  // Headcount per recent event, in one grouped query rather than N.
  const recentEventIds = recentEventDocs.map((e) => e.id as string);
  const headcounts = recentEventIds.length
    ? await guests
        .aggregate<{
          _id: string;
          total: number;
        }>([
          { $match: { tenantId, eventId: { $in: recentEventIds } } },
          { $group: { _id: "$eventId", total: { $sum: "$totalCount" } } },
        ])
        .toArray()
    : [];
  const headcountByEvent = new Map(headcounts.map((h) => [h._id, h.total]));

  const hostIds = [
    ...new Set(recentEventDocs.map((e) => e.createdBy as string | undefined).filter(Boolean)),
  ] as string[];
  const hostDocs = hostIds.length
    ? await users
        .find({ tenantId, userId: { $in: hostIds } })
        .project({ userId: 1, name: 1 })
        .toArray()
    : [];
  const hostNameById = new Map(hostDocs.map((u) => [u.userId as string, u.name as string]));

  const iso = (value: unknown): string | null =>
    value instanceof Date ? value.toISOString() : value ? String(value) : null;

  return {
    windowDays,
    totals: {
      users: totalUsers,
      newUsers7d,
      events: totalEvents,
      upcomingEvents,
      pollingEvents,
      rsvpHeadcount: rsvpAgg[0]?.total ?? 0,
      rallies: totalRallies,
      openRallies,
      follows: totalFollows,
      pushSubscribers: totalPushSubs,
    },
    traffic,
    trafficSummary,
    locations,
    topPaths,
    devices,
    recentUsers: recentUserDocs.map((u) => ({
      userId: u.userId,
      name: u.name ?? "—",
      email: u.email ?? "—",
      handle: u.handle ?? null,
      image: u.image ?? null,
      city: u.city ?? null,
      state: u.state ?? null,
      createdAt: iso(u.createdAt) ?? "",
    })),
    recentEvents: recentEventDocs.map((e) => ({
      id: e.id,
      title: e.title,
      date: iso(e.date) ?? "",
      dateStatus: e.dateStatus ?? "confirmed",
      isPrivate: !!e.isPrivate,
      createdAt: iso(e.createdAt),
      hostName: e.createdBy ? (hostNameById.get(e.createdBy) ?? null) : null,
      headcount: headcountByEvent.get(e.id) ?? 0,
    })),
    recentRallies: recentRallyDocs.map((i) => ({
      id: i.id,
      activity: i.activity,
      authorName: i.authorName ?? "—",
      authorHandle: i.authorHandle ?? null,
      interested: Array.isArray(i.interested) ? i.interested.length : 0,
      status: i.status ?? "open",
      visibility: i.visibility ?? "public",
      createdAt: iso(i.createdAt) ?? "",
    })),
    funnel,
    geoAvailable: locations.some((l) => l.lat !== null && l.lon !== null),
  };
}

export async function getTenant(tenantId: string) {
  const c = await col("tenants");
  return c.findOne({ tenantId });
}

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
  type Event,
  type Item,
  type Guest,
  type Comment,
  type User,
} from "../models";

// ─── Connection ───────────────────────────────────────────────────────────────

let cachedClient: MongoClient | null = null;

export async function getClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  cachedClient = await MongoClient.connect(process.env.MONGODB_URI);
  return cachedClient;
}

async function col<T extends Document>(name: string): Promise<Collection<T>> {
  const client = await getClient();
  return client.db("comunl").collection<T>(name);
}

// ─── Parse helpers ────────────────────────────────────────────────────────────

function parseMany<T>(schema: z.ZodType<T>, docs: unknown[]): T[] {
  return docs.flatMap((doc) => {
    const result = schema.safeParse(doc);
    if (!result.success) {
      console.warn("[db] Validation failed:", result.error.flatten());
      return [];
    }
    return [result.data];
  });
}

function parseOne<T>(schema: z.ZodType<T>, doc: unknown): T {
  return schema.parse(doc);
}

const withId = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) => schema.extend({ _id: z.any() });

// ─── Events ───────────────────────────────────────────────────────────────────

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

export async function getEvent(tenantId: string, eventId: string): Promise<SerializedEvent | null> {
  const c = await col("events");
  const doc = await c.findOne({ id: eventId, tenantId, deletedAt: { $exists: false } });
  if (!doc) return null;
  return serializeEvent(parseOne(withId(EventSchema), doc) as any);
}

export async function getFeaturedEvents(tenantId: string): Promise<SerializedEvent[]> {
  return getEvents(tenantId, { isFeatured: true });
}

export async function createEvent(
  tenantId: string,
  data: Omit<Event, "tenantId">
): Promise<SerializedEvent> {
  const c = await col("events");
  const doc = EventSchema.parse({ ...data, tenantId });
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
  const result = await c.updateOne({ id: eventId, tenantId }, { $set: data });
  return result.modifiedCount > 0;
}

export async function deleteEvent(tenantId: string, eventId: string): Promise<boolean> {
  const c = await col("events");
  const result = await c.updateOne({ id: eventId, tenantId }, { $set: { deletedAt: new Date() } });
  return result.modifiedCount > 0;
}

// ─── Items (food, host-rec — NOT guests) ─────────────────────────────────────

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

// ─── Guests ───────────────────────────────────────────────────────────────────

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
  guestId: string
): Promise<boolean> {
  const c = await col("guests");
  const result = await c.deleteOne({ _id: new ObjectId(guestId), tenantId, eventId });
  return result.deletedCount > 0;
}

// Check if a user has already RSVP'd to an event
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

// ─── Comments ─────────────────────────────────────────────────────────────────

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
  userId?: string // if provided, only delete if owned by this user
): Promise<boolean> {
  const c = await col("comments");
  const filter: any = { _id: new ObjectId(commentId), tenantId, eventId };
  if (userId) filter.userId = userId;
  const result = await c.deleteOne(filter);
  return result.deletedCount > 0;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getUser(userId: string): Promise<SerializedUser | null> {
  const c = await col("users");
  const doc = await c.findOne({ userId });
  if (!doc) return null;
  return serializeUser(parseOne(withId(UserSchema), doc) as any);
}

export async function upsertUser(data: User): Promise<SerializedUser> {
  const c = await col("users");
  const doc = UserSchema.parse({ ...data, updatedAt: new Date() });
  await c.updateOne(
    { userId: data.userId },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
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

// ─── Tenants ──────────────────────────────────────────────────────────────────

export async function getTenant(tenantId: string) {
  const c = await col("tenants");
  return c.findOne({ tenantId });
}

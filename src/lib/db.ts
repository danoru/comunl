import {
  MongoClient,
  Collection,
  Document,
  Filter,
  Sort,
  ObjectId,
  WithId,
} from "mongodb";
import { z } from "zod";
import {
  EventSchema,
  SerializedEvent,
  serializeEvent,
  ItemSchema,
  SerializedItem,
  serializeItem,
  type Event,
  type Item,
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
// Validates documents coming OUT of MongoDB against the Zod schema.
// Invalid docs log a warning and are filtered out rather than crashing the page.

function parseMany<T>(schema: z.ZodType<T>, docs: unknown[]): T[] {
  return docs.flatMap((doc) => {
    const result = schema.safeParse(doc);
    if (!result.success) {
      console.warn("[db] Document failed validation:", result.error.flatten());
      return [];
    }
    return [result.data];
  });
}

function parseOne<T>(schema: z.ZodType<T>, doc: unknown): T {
  return schema.parse(doc); // throws ZodError with a clear message if invalid
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function getEvents(
  tenantId: string,
  filter: Filter<Document> = {},
  sort: Sort = { date: -1 }
): Promise<SerializedEvent[]> {
  const c = await col("events");
  const docs = await c
    .find({ ...filter, tenantId })
    .sort(sort)
    .toArray();
  const parsed = parseMany(EventSchema.extend({ _id: z.any() }), docs);
  return parsed.map(serializeEvent as any);
}

export async function getEvent(
  tenantId: string,
  eventId: string
): Promise<SerializedEvent | null> {
  const c = await col("events");
  const doc = await c.findOne({ id: eventId, tenantId });
  if (!doc) return null;
  const parsed = parseOne(EventSchema.extend({ _id: z.any() }), doc);
  return serializeEvent(parsed as any);
}

export async function getFeaturedEvents(
  tenantId: string
): Promise<SerializedEvent[]> {
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

// ─── Items ────────────────────────────────────────────────────────────────────

export async function getItems(
  tenantId: string,
  eventId: string,
  filter: Filter<Document> = {}
): Promise<SerializedItem[]> {
  const c = await col("items");
  const docs = await c.find({ ...filter, tenantId, eventId }).toArray();
  const parsed = parseMany(ItemSchema.extend({ _id: z.any() }), docs);
  return parsed.map(serializeItem as any);
}

export async function addItem(
  tenantId: string,
  eventId: string,
  data: Omit<Item, "tenantId" | "eventId">
): Promise<SerializedItem> {
  const c = await col("items");
  // Validate the full document before inserting
  const doc = ItemSchema.parse({ ...data, tenantId, eventId });
  const _id = new ObjectId();
  await c.insertOne({ _id, ...doc } as any);
  return serializeItem({ _id, ...doc } as any);
}

// ─── Tenants ──────────────────────────────────────────────────────────────────

export async function getTenant(tenantId: string) {
  const c = await col("tenants");
  return c.findOne({ tenantId });
}

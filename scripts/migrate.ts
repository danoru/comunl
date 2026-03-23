/**
 * scripts/migrate.ts
 * Run: npx ts-node --skip-project scripts/migrate.ts
 */
import { MongoClient } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";
import {
  EventSchema,
  ItemSchema,
  TenantSchema,
  LEGACY_ITEM_TYPE_MAP,
} from "../src/models";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
const SOURCE_DB = "rsvp";
const TARGET_DB = "comunl";
const TENANT_ID = "cody";

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✓ Connected");

  const source = client.db(SOURCE_DB);
  const target = client.db(TARGET_DB);

  // 1. Tenant
  const tenant = TenantSchema.parse({
    tenantId: TENANT_ID,
    name: "Cody's Corner",
    domain: "cody.party",
    primaryColor: "#F4631E",
    accentColor: "#FFD166",
  });
  await target
    .collection("tenants")
    .updateOne({ tenantId: TENANT_ID }, { $set: tenant }, { upsert: true });
  console.log("✓ Tenant upserted");

  // 2. Events — Zod coerces the "2022-10-22 17:00:00" date strings automatically
  const sourceEvents = await source.collection("events").find().toArray();
  let eventsOk = 0,
    eventsFailed = 0;

  for (const ev of sourceEvents) {
    // Strip _id before Zod validation — ObjectId isn't a Zod type.
    // We reattach the original _id when upserting so nothing gets a new _id.
    const { _id, ...rest } = ev;
    const result = EventSchema.safeParse({ ...rest, tenantId: TENANT_ID });

    if (!result.success) {
      console.warn(`  ✗ Event ${ev.id} failed:`, result.error.flatten());
      eventsFailed++;
      continue;
    }

    await target
      .collection("events")
      .updateOne({ _id }, { $set: { _id, ...result.data } }, { upsert: true });
    eventsOk++;
  }
  console.log(`✓ Events: ${eventsOk} migrated, ${eventsFailed} failed`);

  // 3. Attendance → items with itemType: "guest"
  const sourceAttendance = await source
    .collection("attendance")
    .find()
    .toArray();
  let attOk = 0,
    attFailed = 0;

  for (const att of sourceAttendance) {
    // All fields are nested inside itemEntry, not at the top level
    const entry = att.itemEntry ?? {};
    const normalisedType =
      LEGACY_ITEM_TYPE_MAP[entry.itemType] ?? entry.itemType;
    const result = ItemSchema.safeParse({
      tenantId: TENANT_ID,
      eventId: entry.eventId,
      itemType: normalisedType,
      item: entry.item,
    });

    if (!result.success) {
      console.warn(`  ✗ Attendance ${att._id} failed:`, result.error.flatten());
      attFailed++;
      continue;
    }

    await target
      .collection("items")
      .updateOne(
        { _id: att._id },
        { $set: { _id: att._id, ...result.data } },
        { upsert: true }
      );
    attOk++;
  }
  console.log(`✓ Attendance: ${attOk} migrated, ${attFailed} failed`);

  // 4. Items (food, host recs)
  const sourceItems = await source.collection("items").find().toArray();
  let itemsOk = 0,
    itemsFailed = 0;

  for (const it of sourceItems) {
    const entry = it.itemEntry ?? {};
    const normalisedType =
      LEGACY_ITEM_TYPE_MAP[entry.itemType ?? it.itemType] ??
      entry.itemType ??
      it.itemType;
    const result = ItemSchema.safeParse({
      tenantId: TENANT_ID,
      eventId: entry.eventId ?? it.eventId,
      itemType: normalisedType,
      item: entry.item ?? it.item,
    });

    if (!result.success) {
      console.warn(`  ✗ Item ${it._id} failed:`, result.error.flatten());
      itemsFailed++;
      continue;
    }

    await target
      .collection("items")
      .updateOne(
        { _id: it._id },
        { $set: { _id: it._id, ...result.data } },
        { upsert: true }
      );
    itemsOk++;
  }
  console.log(`✓ Items: ${itemsOk} migrated, ${itemsFailed} failed`);

  // 5. Summary
  const [ec, ic] = await Promise.all([
    target.collection("events").countDocuments({ tenantId: TENANT_ID }),
    target.collection("items").countDocuments({ tenantId: TENANT_ID }),
  ]);
  console.log(`\n── Done ──\n  Events: ${ec}\n  Items:  ${ic}\n`);

  await client.close();
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { MongoClient, ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI not set");

async function migrate() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  console.log("✓ Connected");

  const db = client.db("comunl");
  const items = db.collection("items");
  const guests = db.collection("guests");

  // Find all guest items
  const guestItems = await items.find({ itemType: "guest" }).toArray();
  console.log(`  Found ${guestItems.length} guest items to migrate`);

  let ok = 0,
    failed = 0;

  for (const item of guestItems) {
    try {
      const doc = {
        _id: item._id,
        tenantId: item.tenantId ?? "cody", // fallback for old docs without tenantId
        eventId: item.eventId,
        userId: undefined, // anonymous — no userId
        displayName: item.item, // "item" field held the name
        additionalGuests: [],
        totalCount: 1,
        createdAt: item._id.getTimestamp(), // approximate from ObjectId
      };

      await guests.updateOne({ _id: item._id }, { $set: doc }, { upsert: true });
      ok++;
    } catch (e) {
      console.warn(`  ✗ Failed ${item._id}:`, e);
      failed++;
    }
  }

  console.log(`✓ Guests migrated: ${ok} ok, ${failed} failed`);

  // Verify
  const count = await guests.countDocuments();
  console.log(`  Total guests collection size: ${count}`);

  // Remove migrated guest items from items collection
  // (comment this out if you want to keep them as a backup)
  const removed = await items.deleteMany({ itemType: "guest" });
  console.log(`✓ Removed ${removed.deletedCount} guest entries from items collection`);

  await client.close();
  console.log("✓ Done");
}

migrate().catch((e) => {
  console.error(e);
  process.exit(1);
});

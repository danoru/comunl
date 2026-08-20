/**
 * migrate-social.ts
 *
 * Phase 1 + 3 of the social-features remodel. Additive only — does not remove
 * any fields. Safe to run multiple times.
 *
 * Phase 1: backfill new fields
 *   - events.hostUserIds   ← derived from hosts (preferred) or createdBy (if non-admin)
 *   - events.createdAt     ← _id.getTimestamp() if missing
 *   - events.updatedAt     ← createdAt initially
 *   - users.handle         ← derived from email local-part, collision-suffixed
 *   - users.profileVisibility ← "mutual" if missing
 *   - items.guestName      ← copied from submittedBy where guestName is empty
 *
 * Phase 3: write CSV of events that need manual host review
 *   (hosts empty AND createdBy is in ADMIN_EMAILS — admin-created on behalf
 *    of someone else, real host unknown)
 *
 * Usage:
 *   npx tsx scripts/migrate-social.ts                  # dry-run, both phases
 *   npx tsx scripts/migrate-social.ts --phase 1        # dry-run, phase 1 only
 *   npx tsx scripts/migrate-social.ts --phase 3        # dry-run, phase 3 only (read-only anyway)
 *   npx tsx scripts/migrate-social.ts --apply          # ACTUALLY WRITE to DB
 *
 * Output CSV path: scripts/output/host-review-{timestamp}.csv
 */

import { MongoClient, type Db, type ObjectId } from "mongodb";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in .env.local");

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const phaseFlagIdx = args.indexOf("--phase");
const PHASES =
  phaseFlagIdx >= 0 && args[phaseFlagIdx + 1]
    ? args[phaseFlagIdx + 1].split(",").map((s) => s.trim())
    : ["1", "3"];

function redactUri(uri: string): string {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
}

async function main() {
  const client = new MongoClient(MONGODB_URI!);
  await client.connect();
  const db = client.db("comunl");

  console.log(`▸ URI:    ${redactUri(MONGODB_URI!)}`);
  console.log(`▸ DB:     ${db.databaseName}`);
  console.log(`▸ Mode:   ${APPLY ? "APPLY (writes will be made)" : "DRY-RUN (no writes)"}`);
  console.log(`▸ Phases: ${PHASES.join(", ")}`);
  console.log(`▸ Admins: ${ADMIN_EMAILS.length} email(s) configured`);

  // Resolve admin userIds (from emails) — needed by both phases
  const adminUsers = await db
    .collection("users")
    .find({ email: { $in: ADMIN_EMAILS } })
    .project({ userId: 1, email: 1 })
    .toArray();
  const adminUserIds = new Set(adminUsers.map((u) => u.userId).filter(Boolean));
  console.log(`▸ Resolved ${adminUserIds.size} admin userId(s) from emails`);
  console.log("");

  if (PHASES.includes("1")) {
    await phase1(db, adminUserIds);
  }
  if (PHASES.includes("3")) {
    await phase3(db, adminUserIds);
  }

  await client.close();
  console.log("\n✓ Done");
}

// ─── Phase 1 ────────────────────────────────────────────────────────────────

async function phase1(db: Db, adminUserIds: Set<string>) {
  console.log("═══ Phase 1: additive backfill ═══");
  await backfillEvents(db, adminUserIds);
  await backfillUsers(db);
  await backfillItems(db);
}

async function backfillEvents(db: Db, adminUserIds: Set<string>) {
  console.log("\n── events: hostUserIds, createdAt, updatedAt ──");
  const events = await db.collection("events").find({}).toArray();

  let touched = 0;
  let alreadySet = 0;
  let fromHosts = 0;
  let fromCreator = 0;
  let needsReview = 0;
  let timestampsAdded = 0;

  for (const e of events) {
    const updates: Record<string, unknown> = {};

    if (Array.isArray(e.hostUserIds) && e.hostUserIds.length > 0) {
      alreadySet++;
    } else if (Array.isArray(e.hosts) && e.hosts.length > 0) {
      updates.hostUserIds = e.hosts;
      fromHosts++;
    } else if (e.createdBy && !adminUserIds.has(e.createdBy)) {
      updates.hostUserIds = [e.createdBy];
      fromCreator++;
    } else {
      // Admin-created with no hosts set, or no createdBy at all.
      // Phase 3 will surface these in the review CSV.
      updates.hostUserIds = [];
      needsReview++;
    }

    if (!e.createdAt) {
      const id = e._id as ObjectId;
      updates.createdAt = id.getTimestamp();
      timestampsAdded++;
    }
    if (!e.updatedAt) {
      updates.updatedAt = updates.createdAt ?? e.createdAt ?? new Date();
    }

    if (Object.keys(updates).length > 0) {
      touched++;
      if (APPLY) {
        await db.collection("events").updateOne({ _id: e._id }, { $set: updates });
      }
    }
  }

  console.log(`  total events:            ${events.length}`);
  console.log(`  hostUserIds already set: ${alreadySet}`);
  console.log(`  backfilled from hosts:   ${fromHosts}`);
  console.log(`  backfilled from creator: ${fromCreator}`);
  console.log(`  flagged for review:      ${needsReview}  (see Phase 3 CSV)`);
  console.log(`  createdAt added:         ${timestampsAdded}`);
  console.log(`  ${APPLY ? "updated" : "would update"}:           ${touched}`);
}

async function backfillUsers(db: Db) {
  console.log("\n── users: handle, profileVisibility ──");
  const users = await db.collection("users").find({}).toArray();

  // Build handle uniqueness map. Existing handles claim their slot first.
  const taken = new Map<string, number>();
  for (const u of users) {
    if (typeof u.handle === "string" && u.handle.length > 0) {
      taken.set(u.handle, (taken.get(u.handle) ?? 0) + 1);
    }
  }

  // Derive a handle for each user that doesn't have one. Process in
  // _id order so results are deterministic across runs.
  users.sort((a, b) => (a._id < b._id ? -1 : 1));
  const proposed = new Map<string, string>(); // userId → handle

  for (const u of users) {
    if (typeof u.handle === "string" && u.handle.length > 0) continue;
    const local = (u.email ?? "").split("@")[0] ?? "";
    const base = local.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!base) continue; // skip — no derivable handle (vanishingly rare)

    let candidate = base;
    let n = 1;
    while (taken.has(candidate)) {
      n++;
      candidate = `${base}${n}`;
    }
    taken.set(candidate, 1);
    proposed.set(u.userId, candidate);
  }

  let touched = 0;
  let handlesAdded = 0;
  let visibilityAdded = 0;

  for (const u of users) {
    const updates: Record<string, unknown> = {};

    if (proposed.has(u.userId)) {
      updates.handle = proposed.get(u.userId);
      handlesAdded++;
    }
    if (!u.profileVisibility) {
      updates.profileVisibility = "mutual";
      visibilityAdded++;
    }

    if (Object.keys(updates).length > 0) {
      touched++;
      if (APPLY) {
        await db.collection("users").updateOne({ _id: u._id }, { $set: updates });
      }
    }
  }

  console.log(`  total users:             ${users.length}`);
  console.log(`  handles added:           ${handlesAdded}`);
  console.log(`  profileVisibility added: ${visibilityAdded}`);
  console.log(`  ${APPLY ? "updated" : "would update"}:           ${touched}`);
}

async function backfillItems(db: Db) {
  console.log("\n── items: guestName from submittedBy ──");
  const items = await db
    .collection("items")
    .find({
      submittedBy: { $exists: true, $nin: [null, ""] },
      $or: [{ guestName: { $exists: false } }, { guestName: { $in: [null, ""] } }],
    })
    .toArray();

  if (APPLY) {
    for (const it of items) {
      await db
        .collection("items")
        .updateOne({ _id: it._id }, { $set: { guestName: it.submittedBy } });
    }
  }

  console.log(`  items needing backfill:  ${items.length}`);
  console.log(`  ${APPLY ? "updated" : "would update"}:           ${items.length}`);
}

// ─── Phase 3 ────────────────────────────────────────────────────────────────

async function phase3(db: Db, adminUserIds: Set<string>) {
  console.log("\n═══ Phase 3: manual review CSV ═══");

  if (adminUserIds.size === 0) {
    console.log("  No admin userIds resolved — nothing to flag for review.");
    return;
  }

  // Find events that have no usable host signal, where the creator is an admin.
  // Covers both pre-Phase-1 (no hostUserIds field) and post-Phase-1 (hostUserIds = []).
  const events = await db
    .collection("events")
    .find({
      $and: [
        {
          $or: [{ hostUserIds: { $exists: false } }, { hostUserIds: { $size: 0 } }],
        },
        {
          $or: [{ hosts: { $exists: false } }, { hosts: { $size: 0 } }],
        },
        { createdBy: { $in: Array.from(adminUserIds) } },
      ],
    })
    .toArray();

  if (events.length === 0) {
    console.log("  No events need manual host review. ✓");
    return;
  }

  // Resolve creator info for context in the CSV.
  const creatorIds = [...new Set(events.map((e) => e.createdBy).filter(Boolean))];
  const creators = await db
    .collection("users")
    .find({ userId: { $in: creatorIds } })
    .project({ userId: 1, email: 1, name: 1 })
    .toArray();
  const creatorMap = new Map(creators.map((u) => [u.userId, u]));

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const header = [
    "eventId",
    "tenantId",
    "title",
    "date",
    "createdBy_userId",
    "createdBy_email",
    "createdBy_name",
    "current_hosts_array",
    "_objectId",
  ];

  const rows = [header.map(escape).join(",")];
  for (const e of events) {
    const creator = creatorMap.get(e.createdBy);
    rows.push(
      [
        e.id ?? "",
        e.tenantId ?? "",
        e.title ?? "",
        e.date instanceof Date ? e.date.toISOString() : String(e.date ?? ""),
        e.createdBy ?? "",
        creator?.email ?? "(unknown)",
        creator?.name ?? "",
        JSON.stringify(e.hosts ?? []),
        String(e._id),
      ]
        .map(escape)
        .join(",")
    );
  }

  const outDir = path.resolve(process.cwd(), "scripts/output");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outFile = path.resolve(outDir, `host-review-${stamp}.csv`);
  fs.writeFileSync(outFile, rows.join("\n") + "\n");

  console.log(`  events flagged: ${events.length}`);
  console.log(`  csv written:    ${outFile}`);
  console.log(`  next: review the CSV, then update each row's hostUserIds in the DB`);
  console.log(`        (or via an admin UI when one exists)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

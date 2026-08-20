/**
 * atlas-indexes.js
 *
 * Run these in the Atlas UI → your cluster → Browse Collections → indexes tab,
 * or paste into the Atlas shell (mongosh).
 *
 * These make tenant-scoped queries fast as your data grows.
 */

// ── events collection ─────────────────────────────────────────────────────────

// Primary lookup: all events for a tenant, sorted by date
db.events.createIndex({ tenantId: 1, date: -1 });

// Event detail page: find one event by tenant + slug
db.events.createIndex({ tenantId: 1, id: 1 }, { unique: true });

// Featured events per tenant
db.events.createIndex({ tenantId: 1, isFeatured: 1 });

// ── items collection ──────────────────────────────────────────────────────────

// All items for an event (most common query — RSVP list, food lists)
db.items.createIndex({ tenantId: 1, eventId: 1 });

// Filter by type within an event (e.g. just guests, just mains)
db.items.createIndex({ tenantId: 1, eventId: 1, itemType: 1 });

// ── tenants collection ────────────────────────────────────────────────────────

db.tenants.createIndex({ tenantId: 1 }, { unique: true });
db.tenants.createIndex({ domain: 1 }, { unique: true });

// ── datePolls collection ──────────────────────────────────────────────────────

// One poll per event
db.datePolls.createIndex({ tenantId: 1, eventId: 1 }, { unique: true });

// ── datePollVotes collection ──────────────────────────────────────────────────

// One vote doc per participant per event (upserted on re-vote)
db.datePollVotes.createIndex({ tenantId: 1, eventId: 1, participantKey: 1 }, { unique: true });
db.datePollVotes.createIndex({ tenantId: 1, eventId: 1 });

// ── intents collection (Rally) ────────────────────────────────────────────────

// Feed query: open/converted intents, newest first
db.intents.createIndex({ tenantId: 1, status: 1, createdAt: -1 });

// Detail lookup by short id
db.intents.createIndex({ tenantId: 1, id: 1 }, { unique: true });

// Rate caps: per-user open/recent counts
db.intents.createIndex({ tenantId: 1, userId: 1, status: 1 });

// ── follows collection ────────────────────────────────────────────────────────

// One edge per (follower, followee); reverse lookup for followers-of
db.follows.createIndex({ tenantId: 1, followerId: 1, followeeId: 1 }, { unique: true });
db.follows.createIndex({ tenantId: 1, followeeId: 1 });

// ── notifications collection ──────────────────────────────────────────────────

// Bell dropdown: a user's notifications, newest first (also serves unread count)
db.notifications.createIndex({ tenantId: 1, userId: 1, createdAt: -1 });

// ── users collection ──────────────────────────────────────────────────────────

// Profile pages: lookup by handle (sparse — pre-migration docs lack it)
db.users.createIndex({ tenantId: 1, handle: 1 }, { unique: true, sparse: true });

// ── pushSubscriptions collection ──────────────────────────────────────────────

// Send path: all subscriptions for a set of users
db.pushSubscriptions.createIndex({ tenantId: 1, userId: 1 });

// Upsert/prune by endpoint
db.pushSubscriptions.createIndex({ tenantId: 1, endpoint: 1 }, { unique: true });

// ── pageViews collection (admin analytics) ────────────────────────────────────

// Dashboard queries: everything is a tenant + time-window scan
db.pageViews.createIndex({ tenantId: 1, createdAt: -1 });

// Top-pages and unique-visitor rollups
db.pageViews.createIndex({ tenantId: 1, path: 1, createdAt: -1 });

// Retention: analytics rows self-delete after 180 days so the collection
// can't grow without bound. Adjust the seconds value to change the window.
db.pageViews.createIndex({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 180 });

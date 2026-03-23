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

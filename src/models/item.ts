import { z } from "zod";

export const ItemTypeSchema = z.enum([
  "main",
  "side",
  "snack",
  "dessert",
  "drink",
  "supply",
  "host-rec",
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

export const LEGACY_ITEM_TYPE_MAP: Record<string, ItemType> = {
  "main-dish": "main",
  "side-dish": "side",
  snack: "snack",
  dessert: "dessert",
  drink: "drink",
  supply: "supply",
  supplies: "supply",
  "host-recommendation": "host-rec",
  "host-recommendations": "host-rec",
  recommendation: "host-rec",
  recommendations: "host-rec",
};

export const ItemSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  itemType: ItemTypeSchema,
  item: z.string().min(1, "Item name is required"),
  // Attribution — one or both may be set
  userId: z.string().optional(), // set if signed-in user added the item
  guestName: z.string().optional(), // display name — from profile or RSVP name
  submittedBy: z.string().optional(), // legacy field — kept for old data
});

export const CreateItemSchema = ItemSchema.omit({ tenantId: true, eventId: true });

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;

export const SerializedItemSchema = ItemSchema.extend({ _id: z.string() });
export type SerializedItem = z.infer<typeof SerializedItemSchema>;

export function serializeItem(doc: Item & { _id: { toString(): string } }): SerializedItem {
  return { ...doc, _id: doc._id.toString() };
}

// Resolve the display name for an item — used in UI
export function resolveItemAttribution(item: SerializedItem): string | null {
  if (item.guestName) return item.guestName;
  if (item.submittedBy) return item.submittedBy;
  return null;
}

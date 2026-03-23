import { z } from "zod";

// All valid itemType values in one place — add new ones here only
export const ItemTypeSchema = z.enum([
  "guest",
  "main",
  "side",
  "snack",
  "dessert",
  "drink",
  "supply",
  "host-rec",
]);

export type ItemType = z.infer<typeof ItemTypeSchema>;

// Legacy itemType values from the rsvp database → normalised values
// Used by the migration script and any old data coming in
export const LEGACY_ITEM_TYPE_MAP: Record<string, ItemType> = {
  "guest-name": "guest",
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
  submittedBy: z.string().optional(),
});

// Schema for POST /api/[eventId]/items
export const CreateItemSchema = ItemSchema.omit({
  tenantId: true,
  eventId: true,
});

export type Item = z.infer<typeof ItemSchema>;
export type CreateItem = z.infer<typeof CreateItemSchema>;

export const SerializedItemSchema = ItemSchema.extend({
  _id: z.string(),
});

export type SerializedItem = z.infer<typeof SerializedItemSchema>;

export function serializeItem(
  doc: Item & { _id: { toString(): string } }
): SerializedItem {
  return { ...doc, _id: doc._id.toString() };
}

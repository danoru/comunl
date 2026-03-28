export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-free",
  "Dairy-free",
  "Nut allergy",
  "Halal",
  "Kosher",
  "Shellfish allergy",
] as const;

export type DietaryOption = (typeof DIETARY_OPTIONS)[number];

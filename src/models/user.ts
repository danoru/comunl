import { z } from "zod";

export const UserSchema = z.object({
  userId: z.string(),
  tenantId: z.string(),
  email: z.string().email(),
  name: z.string(),
  image: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  dietaryPreferences: z
    .union([
      z.array(z.string()),
      z.string().transform((v) =>
        v
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      ),
    ])
    .default([])
    .optional(),
  createdAt: z.coerce.date().default(() => new Date()),
  updatedAt: z.coerce.date().default(() => new Date()),
});

export const UpdateUserSchema = UserSchema.pick({
  name: true,
  phone: true,
  city: true,
  state: true,
  dietaryPreferences: true,
}).partial();

export type User = z.infer<typeof UserSchema>;
export type UpdateUser = z.infer<typeof UpdateUserSchema>;

export const SerializedUserSchema = UserSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type SerializedUser = z.infer<typeof SerializedUserSchema>;

export function serializeUser(doc: User & { _id: { toString(): string } }): SerializedUser {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt),
  };
}

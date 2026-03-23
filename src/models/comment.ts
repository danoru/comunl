import { z } from "zod";

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;

export const CommentSchema = z.object({
  tenantId: z.string(),
  eventId: z.string(),
  userId: z.string().optional(),
  displayName: z.string().min(1),
  userImage: z.string().optional(),
  body: z.string().min(1, "Comment can't be empty").max(1000),
  imageUrl: z
    .string()
    .refine((v) => !v || IMGUR_RE.test(v), "Must be an Imgur URL")
    .optional(),
  createdAt: z.coerce.date().default(() => new Date()),
});

export type Comment = z.infer<typeof CommentSchema>;

export const SerializedCommentSchema = CommentSchema.extend({
  _id: z.string(),
  createdAt: z.string(),
});

export type SerializedComment = z.infer<typeof SerializedCommentSchema>;

export function serializeComment(
  doc: Comment & { _id: { toString(): string } }
): SerializedComment {
  return {
    ...doc,
    _id: doc._id.toString(),
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : String(doc.createdAt),
  };
}

// Schema for POST /api/[eventId]/comments
export const CreateCommentSchema = CommentSchema.omit({
  tenantId: true,
  eventId: true,
  createdAt: true,
});

export type CreateComment = z.infer<typeof CreateCommentSchema>;

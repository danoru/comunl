// pages/api/[eventId]/comments.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { z } from "zod";
import { getComments, addComment, deleteComment } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;

const CreateCommentSchema = z.object({
  displayName: z.string().min(1).max(100),
  body: z.string().min(1, "Comment can't be empty").max(1000),
  imageUrl: z
    .string()
    .refine((v) => !v || IMGUR_RE.test(v), "Must be an Imgur URL")
    .optional(),
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { eventId } = req.query as { eventId: string };
  const { tenantId } = getSiteConfig();
  const session = await getServerSession(req, res, authOptions);
  const userId = (session as any)?.userId as string | undefined;

  if (req.method === "GET") {
    const comments = await getComments(tenantId, eventId);
    return res.status(200).json(comments);
  }

  if (req.method === "POST") {
    const result = CreateCommentSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.flatten().fieldErrors,
      });
    }

    const comment = await addComment(tenantId, eventId, {
      userId: userId ?? undefined,
      displayName: result.data.displayName,
      userImage: session?.user?.image ?? undefined,
      body: result.data.body,
      imageUrl: result.data.imageUrl ?? undefined,
    });

    return res.status(201).json(comment);
  }

  if (req.method === "DELETE") {
    const { commentId } = req.body as { commentId: string };
    if (!commentId)
      return res.status(400).json({ message: "commentId required" });

    const isAdmin = (session as any)?.isAdmin ?? false;
    // Admins can delete any comment; users can only delete their own
    const deleted = await deleteComment(
      tenantId,
      eventId,
      commentId,
      isAdmin ? undefined : userId
    );

    if (!deleted)
      return res
        .status(404)
        .json({ message: "Comment not found or not yours" });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ message: `Method ${req.method} not allowed` });
}

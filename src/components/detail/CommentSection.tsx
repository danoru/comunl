import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ImageRoundedIcon from "@mui/icons-material/ImageRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

import type { SerializedComment } from "../../models";
import { tokens } from "../../styles/theme";

dayjs.extend(relativeTime);

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;
const PIP_COLORS = [tokens.orange, tokens.pink, tokens.green, "#6C63FF", tokens.yellow];

interface CommentSectionProps {
  eventId: string;
  initialComments: SerializedComment[];
}

export default function CommentSection({ eventId, initialComments }: CommentSectionProps) {
  const { data: session } = useSession();
  const userId = (session as any)?.userId as string | undefined;
  const isAdmin = (session as any)?.isAdmin ?? false;
  const userName = session?.user?.name ?? "";
  const userImage = session?.user?.image ?? undefined;

  const [comments, setComments] = useState<SerializedComment[]>(initialComments);
  const [body, setBody] = useState("");
  const [anonName, setAnonName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const displayName = userId ? userName : anonName;
  const imageValid = !imageUrl || IMGUR_RE.test(imageUrl);

  async function handleSubmit() {
    if (!body.trim()) {
      setError("Comment can't be empty.");
      return;
    }
    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!imageValid) {
      setError("Image must be an Imgur URL.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          body: body.trim(),
          imageUrl: imageUrl.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error();

      const comment: SerializedComment = await res.json();
      setComments((prev) => [...prev, comment]);
      setBody("");
      setImageUrl("");
      setShowImage(false);
    } catch {
      setError("Couldn't post comment — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await fetch(`/api/${eventId}/comments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId }),
      });
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    } catch {
      // silent
    }
  }

  return (
    <Box>
      {/* Comment list */}
      {comments.length === 0 ? (
        <Typography
          sx={{
            fontStyle: "italic",
            color: tokens.mutedLight,
            display: "block",
            mb: 2,
          }}
          variant="caption"
        >
          No comments yet — be the first!
        </Typography>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          {comments.map((comment, i) => {
            const canDelete = isAdmin || comment.userId === userId;
            return (
              <Box key={comment._id} sx={{ display: "flex", gap: 1.5 }}>
                {/* Avatar */}
                <Avatar
                  src={comment.userImage ?? undefined}
                  sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    background: PIP_COLORS[i % PIP_COLORS.length],
                    fontSize: "0.875rem",
                  }}
                >
                  {comment.displayName[0]?.toUpperCase()}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 1,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography sx={{ fontSize: "0.875rem", fontWeight: 600 }}>
                      {comment.displayName}
                    </Typography>
                    <Typography sx={{ color: tokens.mutedLight }} variant="caption">
                      {dayjs(comment.createdAt).fromNow()}
                    </Typography>
                    {canDelete && (
                      <IconButton
                        size="small"
                        sx={{
                          ml: "auto",
                          p: 0.25,
                          color: tokens.mutedLight,
                          "&:hover": { color: "error.main" },
                        }}
                        onClick={() => handleDelete(comment._id)}
                      >
                        <DeleteOutlineRoundedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    )}
                  </Box>

                  <Typography sx={{ fontSize: "0.9375rem", lineHeight: 1.6, mt: 0.25 }}>
                    {comment.body}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      {/* Compose box */}
      <Box
        sx={{
          background: "#fff",
          border: `1.5px solid ${tokens.border}`,
          borderRadius: "16px",
          p: 2,
        }}
      >
        {/* Anonymous name field */}
        {!userId && (
          <TextField
            fullWidth
            placeholder="Your name *"
            size="small"
            sx={{ mb: 1.5 }}
            value={anonName}
            onChange={(e) => setAnonName(e.target.value)}
          />
        )}

        {/* Signed-in identity */}
        {userId && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
            <Avatar src={userImage} sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
              {userName[0]?.toUpperCase()}
            </Avatar>
            <Typography sx={{ fontWeight: 600 }} variant="caption">
              {userName}
            </Typography>
          </Box>
        )}

        <TextField
          fullWidth
          multiline
          minRows={2}
          placeholder="Leave a comment…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />

        {/* Optional image URL */}
        <Collapse in={showImage}>
          <TextField
            fullWidth
            error={!!imageUrl && !imageValid}
            helperText={imageUrl && !imageValid ? "Must be an Imgur URL" : undefined}
            placeholder="Imgur photo URL (optional) — e.g. https://i.imgur.com/abc.jpg"
            size="small"
            sx={{ mt: 1.5 }}
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {imageUrl && imageValid && (
            <Box
              alt="Preview"
              component="img"
              src={imageUrl}
              sx={{
                mt: 1,
                maxHeight: 160,
                maxWidth: "100%",
                borderRadius: "8px",
                objectFit: "cover",
              }}
            />
          )}
        </Collapse>

        {error && (
          <Typography color="error" sx={{ display: "block", mt: 1 }} variant="caption">
            {error}
          </Typography>
        )}

        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mt: 1.5,
          }}
        >
          <IconButton
            size="small"
            sx={{ color: showImage ? tokens.orange : tokens.muted }}
            title="Add photo"
            onClick={() => setShowImage((v) => !v)}
          >
            <ImageRoundedIcon fontSize="small" />
          </IconButton>

          <Button
            disabled={submitting || !body.trim() || (!userId && !anonName.trim())}
            size="small"
            sx={{ borderRadius: 100, px: 2.5 }}
            variant="contained"
            onClick={handleSubmit}
          >
            {submitting ? "Posting…" : "Post"}
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

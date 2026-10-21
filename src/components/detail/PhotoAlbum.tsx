import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

import type { SerializedComment } from "../../models";
import { tokens } from "../../styles/theme";

interface PhotoAlbumProps {
  comments: SerializedComment[];
}

export default function PhotoAlbum({ comments }: PhotoAlbumProps) {
  const photos = comments.filter((c) => c.imageUrl);
  const [selected, setSelected] = useState<SerializedComment | null>(null);

  if (photos.length === 0) return null;

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 1,
        }}
      >
        {photos.map((comment) => (
          <Box
            key={comment._id}
            sx={{
              position: "relative",
              aspectRatio: "1 / 1",
              borderRadius: "12px",
              overflow: "hidden",
              cursor: "pointer",
              border: `1.5px solid ${tokens.border}`,
              background: tokens.creamDark,
              "&:hover .overlay": { opacity: 1 },
              "&:hover img": { transform: "scale(1.06)" },
            }}
            onClick={() => setSelected(comment)}
          >
            <Box
              alt={`Photo by ${comment.displayName}`}
              component="img"
              src={comment.imageUrl!}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transition: "transform 0.3s ease",
              }}
            />
            {/* Hover overlay */}
            <Box
              className="overlay"
              sx={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(26,31,58,0.75) 0%, transparent 55%)",
                opacity: 0,
                transition: "opacity 0.2s ease",
                display: "flex",
                alignItems: "flex-end",
                p: 1,
              }}
            >
              <Avatar
                alt={comment.displayName}
                src={comment.userImage ?? undefined}
                sx={{ width: 22, height: 22, fontSize: "0.65rem", mr: 0.75 }}
              />
              <Typography
                sx={{
                  color: "#fff",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {comment.displayName.split(" ")[0]}
              </Typography>
            </Box>
          </Box>
        ))}
      </Box>

      {/* Lightbox */}
      <Modal
        open={!!selected}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
        onClose={() => setSelected(null)}
      >
        <Box
          sx={{
            outline: "none",
            maxWidth: "min(90vw, 680px)",
            width: "100%",
            mx: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {selected && (
            <Box
              sx={{
                background: "#fff",
                borderRadius: "20px",
                overflow: "hidden",
                border: `1.5px solid ${tokens.border}`,
                boxShadow: "0 24px 64px rgba(26,31,58,0.22)",
              }}
            >
              <Box
                alt={`Photo by ${selected.displayName}`}
                component="img"
                src={selected.imageUrl!}
                sx={{
                  width: "100%",
                  maxHeight: "65vh",
                  objectFit: "contain",
                  background: tokens.creamDark,
                  display: "block",
                }}
              />
              <Box
                sx={{
                  p: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                }}
              >
                <Avatar
                  alt={selected.displayName}
                  src={selected.userImage ?? undefined}
                  sx={{ width: 32, height: 32 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "0.875rem", color: tokens.navy }}>
                    {selected.displayName}
                  </Typography>
                  {selected.body && (
                    <Typography sx={{ fontSize: "0.8125rem", color: tokens.muted, mt: 0.25 }}>
                      {selected.body}
                    </Typography>
                  )}
                </Box>
                <IconButton
                  aria-label="Close"
                  size="small"
                  sx={{ color: tokens.muted, flexShrink: 0 }}
                  onClick={() => setSelected(null)}
                >
                  ✕
                </IconButton>
              </Box>
            </Box>
          )}
        </Box>
      </Modal>
    </>
  );
}

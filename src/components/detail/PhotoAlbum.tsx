import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import { tokens } from "../../styles/theme";
import type { SerializedComment } from "../../models";

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
            onClick={() => setSelected(comment)}
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
          >
            <Box
              component="img"
              src={comment.imageUrl!}
              alt={`Photo by ${comment.displayName}`}
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
                src={comment.userImage ?? undefined}
                alt={comment.displayName}
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
        onClose={() => setSelected(null)}
        sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
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
                component="img"
                src={selected.imageUrl!}
                alt={`Photo by ${selected.displayName}`}
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
                  src={selected.userImage ?? undefined}
                  alt={selected.displayName}
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
                  size="small"
                  onClick={() => setSelected(null)}
                  sx={{ color: tokens.muted, flexShrink: 0 }}
                  aria-label="Close"
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

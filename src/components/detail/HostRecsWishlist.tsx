// Host-recommended items that guests can claim ("I'll bring this").
// Splits into "Still needed" (unclaimed, clickable) and "Got it covered"
// (claimed, with attribution). Anonymous viewers are nudged to sign in.

import React, { useState } from "react";
import { signIn, useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import type { SerializedItem } from "../../models";
import { tokens } from "../../styles/theme";

interface HostRecsWishlistProps {
  eventId: string;
  items: SerializedItem[];
  onChange: (next: SerializedItem[]) => void;
}

export default function HostRecsWishlist({ eventId, items, onChange }: HostRecsWishlistProps) {
  const { data: session } = useSession();
  const userId = (session as any)?.userId as string | undefined;
  const [pending, setPending] = useState<Set<string>>(new Set());

  const recs = items.filter((i) => i.itemType === "host-rec");
  if (recs.length === 0) return null;

  const needed = recs.filter((r) => !r.userId && !r.guestName);
  const claimed = recs.filter((r) => r.userId || r.guestName);

  function setBusy(id: string, busy: boolean) {
    setPending((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function patch(itemId: string, action: "claim" | "unclaim") {
    setBusy(itemId, true);
    try {
      const res = await fetch(`/api/${eventId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      const updated: SerializedItem = await res.json();
      onChange(items.map((i) => (i._id === itemId ? updated : i)));
    } catch {
      // silent — chip stays in its current state
    } finally {
      setBusy(itemId, false);
    }
  }

  function handleClaim(itemId: string) {
    if (!userId) {
      signIn("google");
      return;
    }
    patch(itemId, "claim");
  }

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: tokens.muted, display: "block", mb: 2, mt: -1 }}
      >
        Things the host would love someone to bring.
      </Typography>

      {needed.length > 0 && (
        <Box sx={{ mb: claimed.length > 0 ? 2.5 : 0 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: tokens.muted,
              display: "block",
              mb: 1,
            }}
          >
            Still needed ({needed.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {needed.map((rec) => {
              const busy = pending.has(rec._id);
              const label = userId
                ? busy
                  ? `${rec.item} · saving…`
                  : `${rec.item} · I'll bring →`
                : `${rec.item} · sign in to claim`;
              return (
                <Tooltip
                  key={rec._id}
                  title={userId ? "Tap to claim" : "Sign in to claim this"}
                  arrow
                  placement="top"
                >
                  <Chip
                    label={label}
                    onClick={() => !busy && handleClaim(rec._id)}
                    disabled={busy}
                    sx={{
                      background: tokens.orangeGlow,
                      border: `1.5px solid ${tokens.orange}`,
                      color: tokens.orange,
                      borderRadius: "100px",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      height: 36,
                      px: 0.75,
                      cursor: busy ? "default" : "pointer",
                      "&:hover": busy
                        ? {}
                        : {
                            background: "rgba(244,99,30,0.22)",
                            transform: "translateY(-1px)",
                          },
                      transition: "transform 0.15s, background 0.15s",
                    }}
                  />
                </Tooltip>
              );
            })}
          </Box>
        </Box>
      )}

      {claimed.length > 0 && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              color: tokens.muted,
              display: "block",
              mb: 1,
            }}
          >
            Got it covered ({claimed.length})
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {claimed.map((rec) => {
              const mine = !!userId && rec.userId === userId;
              const busy = pending.has(rec._id);
              const who = rec.guestName ?? "Someone";
              return (
                <Chip
                  key={rec._id}
                  icon={<CheckRoundedIcon sx={{ fontSize: 16 }} />}
                  label={
                    <Box component="span">
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {rec.item}
                      </Box>
                      <Box component="span" sx={{ color: tokens.muted, ml: 0.75 }}>
                        · {mine ? "you" : who}
                      </Box>
                    </Box>
                  }
                  onDelete={mine && !busy ? () => patch(rec._id, "unclaim") : undefined}
                  deleteIcon={<CloseRoundedIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    background: tokens.greenBg,
                    border: `1.5px solid rgba(6, 214, 160, 0.35)`,
                    color: tokens.navy,
                    borderRadius: "100px",
                    fontSize: "0.875rem",
                    height: 36,
                    px: 0.5,
                    "& .MuiChip-icon": { color: tokens.green },
                  }}
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

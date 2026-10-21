import React, { useState } from "react";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Collapse from "@mui/material/Collapse";

import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import type { ItemType, SerializedItem } from "../../models";
import { resolveItemAttribution } from "../../models";
import { tokens } from "../../styles/theme";

const CATEGORY_META: Record<ItemType, { label: string; icon: string; placeholder: string }> = {
  main: { label: "Main Dishes", icon: "🍖", placeholder: "e.g. BBQ ribs, pasta salad…" },
  side: { label: "Side Dishes", icon: "🥗", placeholder: "e.g. coleslaw, beans…" },
  snack: { label: "Snacks", icon: "🍿", placeholder: "e.g. chips, dip…" },
  dessert: { label: "Desserts", icon: "🍰", placeholder: "e.g. cake, cookies…" },
  drink: { label: "Drinks", icon: "🍺", placeholder: "e.g. beer, lemonade…" },
  supply: { label: "Supplies", icon: "🛒", placeholder: "e.g. paper plates, cups…" },
  "host-rec": { label: "Host Recs", icon: "⭐", placeholder: "e.g. bring a bottle…" },
};

interface FoodSectionProps {
  category: ItemType;
  items: SerializedItem[];
  eventId: string;
  // The RSVP name entered by an anonymous guest — used for attribution
  guestName?: string;
  onItemAdded: (item: SerializedItem) => void;
}

export default function FoodSection({
  category,
  items,
  eventId,
  guestName,
  onItemAdded,
}: FoodSectionProps) {
  const { data: session } = useSession();
  const meta = CATEGORY_META[category];
  const categoryItems = items.filter((i) => i.itemType === category);

  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/${eventId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item: trimmed,
          itemType: category,
          // Pass the guest's RSVP name for attribution if not signed in
          guestName: session ? undefined : (guestName ?? "Guest"),
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      const newItem: SerializedItem = await res.json();
      onItemAdded(newItem);
      setValue("");
      setAdding(false);
    } catch {
      setError("Couldn't save — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        background: "#fff",
        borderRadius: "16px",
        border: `1.5px solid ${tokens.border}`,
        p: "14px 16px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: categoryItems.length > 0 || adding ? 1 : 0,
        }}
      >
        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: tokens.navy }}>
          {meta.icon} {meta.label}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setAdding((a) => !a)}
          sx={{
            width: 26,
            height: 26,
            background: tokens.creamDark,
            color: adding ? tokens.muted : tokens.orange,
            "&:hover": { background: tokens.orangeGlow },
          }}
        >
          {adding ? <CloseIcon sx={{ fontSize: 14 }} /> : <AddIcon sx={{ fontSize: 14 }} />}
        </IconButton>
      </Box>

      {/* Items with attribution */}
      {categoryItems.map((item, i) => {
        const who = resolveItemAttribution(item);
        return (
          <Box key={item._id}>
            {i > 0 && <Divider sx={{ my: 0.5 }} />}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 0.75,
              }}
            >
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>{item.item}</Typography>
              {who && (
                <Typography variant="caption" sx={{ color: tokens.muted, flexShrink: 0, ml: 1 }}>
                  {who}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}

      {categoryItems.length === 0 && !adding && (
        <Typography
          variant="caption"
          sx={{ fontStyle: "italic", color: tokens.mutedLight, mt: 0.5 }}
        >
          Nothing yet — add something!
        </Typography>
      )}

      {/* Add form */}
      <Collapse in={adding}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
          <TextField
            size="small"
            placeholder={meta.placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            autoFocus
            fullWidth
          />
          {error && (
            <Typography variant="caption" color="error">
              {error}
            </Typography>
          )}
          <Button
            variant="contained"
            size="small"
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
            sx={{ alignSelf: "flex-start", borderRadius: 100, px: 2 }}
          >
            {loading ? "Saving…" : "Add"}
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}

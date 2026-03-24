import React from "react";

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
import { tokens } from "../../styles/theme";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<ItemType, { label: string; icon: string; placeholder: string }> = {
  main: {
    label: "Main Dishes",
    icon: "🍖",
    placeholder: "e.g. BBQ ribs, pasta salad…",
  },
  side: {
    label: "Side Dishes",
    icon: "🥗",
    placeholder: "e.g. coleslaw, beans…",
  },
  snack: { label: "Snacks", icon: "🍿", placeholder: "e.g. chips, dip…" },
  dessert: {
    label: "Desserts",
    icon: "🍰",
    placeholder: "e.g. cake, cookies…",
  },
  drink: { label: "Drinks", icon: "🍺", placeholder: "e.g. beer, lemonade…" },
  supply: {
    label: "Supplies",
    icon: "🛒",
    placeholder: "e.g. paper plates, cups…",
  },
  guest: { label: "Guests", icon: "👤", placeholder: "Guest name…" },
  "host-rec": {
    label: "Host Recommendations",
    icon: "⭐",
    placeholder: "e.g. bring a bottle…",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FoodSectionProps {
  category: ItemType;
  items: SerializedItem[];
  eventId: string;
  onItemAdded: (item: SerializedItem) => void;
}

export default function FoodSection({ category, items, eventId, onItemAdded }: FoodSectionProps) {
  const meta = CATEGORY_META[category];
  const categoryItems = items.filter((i) => i.itemType === category);

  const [adding, setAdding] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [submittedBy, setSubmittedBy] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

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
          submittedBy: submittedBy.trim() || undefined,
        }),
      });

      if (!res.ok) throw new Error("Failed to add item");

      const newItem: SerializedItem = await res.json();
      onItemAdded(newItem);
      setValue("");
      setSubmittedBy("");
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

      {/* Existing items */}
      {categoryItems.map((item, i) => (
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
            {item.submittedBy && (
              <Typography variant="caption" sx={{ color: tokens.muted }}>
                {item.submittedBy}
              </Typography>
            )}
          </Box>
        </Box>
      ))}

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
          <TextField
            size="small"
            placeholder="Your name (optional)"
            value={submittedBy}
            onChange={(e) => setSubmittedBy(e.target.value)}
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

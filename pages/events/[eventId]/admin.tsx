import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import dayjs, { Dayjs } from "dayjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";

import { adminGuard } from "../../../src/lib/auth";
import { getEvent, getItems } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";
import type { SerializedEvent, SerializedItem } from "../../../src/models";
import { tokens } from "../../../src/styles/theme";

interface AdminPageProps {
  event: SerializedEvent;
  initialItems: SerializedItem[];
}

export default function AdminPage({ event, initialItems }: AdminPageProps) {
  const router = useRouter();

  // ── Edit form state ──────────────────────────────────────────────────────
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location);
  const [date, setDate] = useState<Dayjs | null>(dayjs(event.date));
  const [flyer, setFlyer] = useState(event.flyer ?? "");
  const [image, setImage] = useState(event.image ?? "");
  const [isFeatured, setIsFeatured] = useState(event.isFeatured);
  const [isGuestOnly, setIsGuestOnly] = useState(event.isGuestOnly);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Host recs state ──────────────────────────────────────────────────────
  const [items, setItems] = useState<SerializedItem[]>(initialItems);
  const [newRec, setNewRec] = useState("");
  const [addingRec, setAddingRec] = useState(false);

  // ── Delete dialog ────────────────────────────────────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const hostRecs = items.filter((i) => i.itemType === "host-rec");
  const flyerValid = /^https?:\/\/(i\.)?imgur\.com\/.+/i.test(flyer);

  // ── Save handler ──────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          date: date?.toISOString(),
          flyer: flyer.trim(),
          image: image.trim() || flyer.trim(),
          isFeatured,
          isGuestOnly,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.message ?? "Save failed");
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("Network error — please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Add host rec ──────────────────────────────────────────────────────────
  async function handleAddRec() {
    const trimmed = newRec.trim();
    if (!trimmed) return;
    setAddingRec(true);

    try {
      const res = await fetch(`/api/${event.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item: trimmed, itemType: "host-rec" }),
      });
      if (!res.ok) throw new Error();
      const item: SerializedItem = await res.json();
      setItems((prev) => [...prev, item]);
      setNewRec("");
    } catch {
      // silent — item just won't appear
    } finally {
      setAddingRec(false);
    }
  }

  // ── Remove item ───────────────────────────────────────────────────────────
  async function handleRemoveItem(itemId: string) {
    try {
      await fetch(`/api/${event.id}/items/${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch {
      // silent
    }
  }

  // ── Delete event ──────────────────────────────────────────────────────────
  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/${event.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      router.push("/events");
    } catch {
      setDeleting(false);
      setDeleteOpen(false);
    }
  }

  return (
    <>
      <Head>
        <title>Admin — {event.title}</title>
      </Head>

      <Box sx={{ maxWidth: 680, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                letterSpacing: "0.25em",
                color: tokens.orange,
                display: "block",
                mb: 0.5,
              }}
            >
              ADMIN
            </Typography>
            <Typography variant="h1" sx={{ fontSize: "clamp(28px, 7vw, 44px)", lineHeight: 1 }}>
              {event.title}
            </Typography>
          </Box>

          <Button
            href={`/events/${event.id}`}
            component="a"
            variant="outlined"
            size="small"
            endIcon={<OpenInNewRoundedIcon />}
            sx={{
              borderRadius: 100,
              borderColor: tokens.border,
              color: tokens.muted,
              "&:hover": { borderColor: tokens.navy, color: tokens.navy },
            }}
          >
            View Event
          </Button>
        </Box>

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: "12px" }}>
            Changes saved successfully.
          </Alert>
        )}
        {saveError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {saveError}
          </Alert>
        )}

        {/* ── Event details ── */}
        <SectionLabel>Event Details</SectionLabel>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mb: 3 }}>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            minRows={3}
          />
          <TextField
            label="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            fullWidth
          />
          <DateTimePicker
            label="Date & time"
            value={date}
            onChange={setDate}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            label="Flyer URL"
            value={flyer}
            onChange={(e) => setFlyer(e.target.value)}
            fullWidth
            helperText="Imgur direct link — e.g. https://i.imgur.com/abc123.png"
            error={!!flyer && !flyerValid}
          />

          {/* Flyer preview */}
          {flyerValid && (
            <Box
              sx={{
                borderRadius: "12px",
                overflow: "hidden",
                border: `1.5px solid ${tokens.border}`,
                maxHeight: 200,
              }}
            >
              <Box
                component="img"
                src={flyer}
                alt="Flyer preview"
                sx={{ width: "100%", objectFit: "cover", display: "block" }}
              />
            </Box>
          )}

          <TextField
            label="Thumbnail URL (optional)"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            fullWidth
            helperText="Leave blank to use flyer as thumbnail"
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ── Toggles ── */}
        <SectionLabel>Options</SectionLabel>

        <Box
          sx={{
            background: "#fff",
            border: `1.5px solid ${tokens.border}`,
            borderRadius: "16px",
            p: "8px 20px",
            mb: 3,
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: tokens.orange,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: tokens.orange,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500 }}>
                  Featured event
                </Typography>
                <Typography variant="caption">Shows on the homepage hero</Typography>
              </Box>
            }
            sx={{ py: 1 }}
          />
          <Divider />
          <FormControlLabel
            control={
              <Switch
                checked={isGuestOnly}
                onChange={(e) => setIsGuestOnly(e.target.checked)}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: tokens.orange,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: tokens.orange,
                  },
                }}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500 }}>
                  Guest list only
                </Typography>
                <Typography variant="caption">Hides food/drink sections</Typography>
              </Box>
            }
            sx={{ py: 1 }}
          />
        </Box>

        <Button
          variant="contained"
          size="large"
          onClick={handleSave}
          disabled={saving}
          fullWidth
          sx={{ mb: 4 }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>

        <Divider sx={{ my: 3 }} />

        {/* ── Host recommendations ── */}
        <SectionLabel>Host Recommendations</SectionLabel>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {hostRecs.length === 0 && (
            <Typography variant="caption" sx={{ color: tokens.muted, fontStyle: "italic" }}>
              No recommendations yet
            </Typography>
          )}
          {hostRecs.map((rec) => (
            <Chip
              key={rec._id}
              label={rec.item}
              onDelete={() => handleRemoveItem(rec._id)}
              sx={{
                background: "#fff",
                border: `1.5px solid ${tokens.border}`,
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            size="small"
            placeholder="e.g. Beer, Ice, Lime…"
            value={newRec}
            onChange={(e) => setNewRec(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddRec()}
            sx={{ flex: 1 }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={handleAddRec}
            disabled={addingRec || !newRec.trim()}
            startIcon={<AddRoundedIcon />}
            sx={{ borderRadius: 100, px: 2 }}
          >
            Add
          </Button>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* ── Guest list ── */}
        <SectionLabel>
          Guest List ({items.filter((i) => i.itemType === "guest").length})
        </SectionLabel>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
          {items.filter((i) => i.itemType === "guest").length === 0 && (
            <Typography variant="caption" sx={{ color: tokens.muted, fontStyle: "italic" }}>
              No guests yet
            </Typography>
          )}
          {items
            .filter((i) => i.itemType === "guest")
            .map((guest) => (
              <Chip
                key={guest._id}
                label={guest.item}
                onDelete={() => handleRemoveItem(guest._id)}
                sx={{
                  background: "#fff",
                  border: `1.5px solid ${tokens.border}`,
                  fontWeight: 500,
                }}
              />
            ))}
        </Box>

        {/* ── Food items ── */}
        {(["main", "side", "snack", "dessert", "drink", "supply"] as const).map((cat) => {
          const catItems = items.filter((i) => i.itemType === cat);
          if (catItems.length === 0) return null;
          return (
            <Box key={cat} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Bebas Neue", sans-serif',
                  letterSpacing: "0.15em",
                  color: tokens.muted,
                  display: "block",
                  mb: 1,
                }}
              >
                {cat.toUpperCase()}
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {catItems.map((item) => (
                  <Chip
                    key={item._id}
                    label={item.submittedBy ? `${item.item} (${item.submittedBy})` : item.item}
                    onDelete={() => handleRemoveItem(item._id)}
                    sx={{
                      background: "#fff",
                      border: `1.5px solid ${tokens.border}`,
                      fontWeight: 500,
                    }}
                  />
                ))}
              </Box>
            </Box>
          );
        })}

        <Divider sx={{ my: 3 }} />

        {/* ── Danger zone ── */}
        <SectionLabel>Danger Zone</SectionLabel>

        <Box
          sx={{
            background: "rgba(211,47,47,0.04)",
            border: "1.5px solid rgba(211,47,47,0.15)",
            borderRadius: "16px",
            p: 2.5,
          }}
        >
          <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Delete this event</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            The event will be hidden from all pages. Guest and food history is preserved.
          </Typography>
          <Button
            variant="outlined"
            color="error"
            onClick={() => setDeleteOpen(true)}
            startIcon={<DeleteOutlineRoundedIcon />}
            sx={{ borderRadius: 100 }}
          >
            Delete Event
          </Button>
        </Box>
      </Box>

      {/* ── Delete confirmation dialog ── */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{ sx: { borderRadius: "20px", p: 1 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: "1.5rem" }}>
          Delete "{event.title}"?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Type <strong>{event.title}</strong> to confirm.
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={event.title}
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteOpen(false)} sx={{ borderRadius: 100 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={deleteConfirm !== event.title || deleting}
            onClick={handleDelete}
            sx={{ borderRadius: 100 }}
          >
            {deleting ? "Deleting…" : "Delete Forever"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: "0.8125rem",
        letterSpacing: "0.2em",
        color: tokens.muted,
        display: "block",
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

// ─── Auth-protected data fetching ─────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async (context) => {
  const guard = await adminGuard(context);
  if (guard) return guard;

  const eventId = context.params?.eventId as string;
  const site = getSiteConfig();

  const [event, initialItems] = await Promise.all([
    getEvent(site.tenantId, eventId),
    getItems(site.tenantId, eventId),
  ]);

  if (!event) return { notFound: true };

  return { props: { event, initialItems } };
};

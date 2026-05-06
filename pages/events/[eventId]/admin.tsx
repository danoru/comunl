import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import React from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import dayjs, { Dayjs } from "dayjs";
import { useSession } from "next-auth/react";
import CoHostPicker, { type HostUser } from "../../../src/components/events/CoHostPicker";
import { adminGuard, getSession } from "../../../src/lib/auth";
import { getEvent, getGuests, getItems } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";
import type { SerializedEvent, SerializedGuest, SerializedItem } from "../../../src/models";
import { tokens } from "../../../src/styles/theme";

interface AdminPageProps {
  event: SerializedEvent;
  initialGuests: SerializedGuest[];
  initialItems: SerializedItem[];
}

export default function AdminPage({ event, initialGuests, initialItems }: AdminPageProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(event.title);
  const [description, setDescription] = React.useState(event.description ?? "");
  const [location, setLocation] = React.useState(event.location);
  const [date, setDate] = React.useState<Dayjs | null>(dayjs(event.date));
  const [flyer, setFlyer] = React.useState(event.flyer ?? "");
  const [image, setImage] = React.useState(event.image ?? "");
  const [isFeatured, setIsFeatured] = React.useState(event.isFeatured);
  const [isGuestOnly, setIsGuestOnly] = React.useState(event.isGuestOnly);
  const { data: session } = useSession();
  const currentUserId = (session as any)?.userId as string | undefined;
  const isAdmin = (session as any)?.isAdmin ?? false;
  const canManageHosts = isAdmin || event.createdBy === currentUserId;

  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState("");
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const [hosts, setHosts] = React.useState<HostUser[]>([]);
  const [items, setItems] = React.useState<SerializedItem[]>(initialItems);
  const [guests, setGuests] = React.useState<SerializedGuest[]>(initialGuests);
  const [newRec, setNewRec] = React.useState("");
  const [addingRec, setAddingRec] = React.useState(false);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const [eventUrl, setEventUrl] = React.useState("");
  React.useEffect(() => {
    setEventUrl(`${window.location.origin}/events/${event.id}`);
  }, [event.id]);

  const hostRecs = items.filter((i) => i.itemType === "host-rec");
  const flyerValid = /^https?:\/\/(i\.)?imgur\.com\/.+/i.test(flyer);

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
          hosts: hosts.map((h) => h.userId),
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
    } finally {
      setAddingRec(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await fetch(`/api/${event.id}/items/${itemId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch {}
  }

  async function handleRemoveGuest(guestId: string) {
    try {
      await fetch(`/api/${event.id}/rsvp`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestId }),
      });
      setGuests((prev) => prev.filter((g) => g._id !== guestId));
    } catch {}
  }

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

  React.useEffect(() => {
    if (!event.hosts?.length) return;
    fetch(`/api/users/search?ids=${event.hosts.join(",")}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHosts(data);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <Head>
        <title>Admin — {event.title}</title>
      </Head>

      <Box sx={{ maxWidth: 680, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
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

        <SectionLabel>Sharing</SectionLabel>

        <Box
          sx={{
            background: "#fff",
            border: `1.5px solid ${tokens.border}`,
            borderRadius: "16px",
            p: "16px 20px",
            mb: 3,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <CopyableField label="Event link" value={eventUrl} />

          {event.isPrivate && event.inviteCode && (
            <CopyableField
              label="Invite code"
              value={event.inviteCode}
              mono
              helperText="Guests need this code to unlock the event."
            />
          )}
        </Box>

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
        <SectionLabel>Co-Hosts</SectionLabel>

        <CoHostPicker value={hosts} disabled={!canManageHosts} onChange={setHosts} />

        <Divider sx={{ my: 3 }} />

        <SectionLabel>Host Recommendations</SectionLabel>
        <Typography variant="caption" sx={{ color: tokens.muted, mt: -1, mb: 1.5, display: "block" }}>
          Things you'd like guests to bring. They'll see a "still needed" list and can claim
          items from the event page.
        </Typography>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {hostRecs.length === 0 && (
            <Typography variant="caption" sx={{ color: tokens.muted, fontStyle: "italic" }}>
              No recommendations yet
            </Typography>
          )}
          {hostRecs.map((rec) => {
            const claimed = !!(rec.userId || rec.guestName);
            const who = rec.guestName ?? "someone";
            return (
              <Chip
                key={rec._id}
                label={
                  claimed ? (
                    <Box component="span">
                      <Box component="span" sx={{ fontWeight: 600 }}>
                        {rec.item}
                      </Box>
                      <Box component="span" sx={{ color: tokens.muted, ml: 0.75 }}>
                        · {who}
                      </Box>
                    </Box>
                  ) : (
                    rec.item
                  )
                }
                onDelete={() => handleRemoveItem(rec._id)}
                sx={{
                  background: claimed ? tokens.greenBg : "#fff",
                  border: `1.5px solid ${claimed ? "rgba(6, 214, 160, 0.35)" : tokens.border}`,
                  fontWeight: 500,
                }}
              />
            );
          })}
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

        <SectionLabel>Guest List ({guests.length})</SectionLabel>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 4 }}>
          {guests.length === 0 && (
            <Typography variant="caption" sx={{ color: tokens.muted, fontStyle: "italic" }}>
              No guests yet
            </Typography>
          )}
          {guests.map((guest) => (
            <Chip
              key={guest._id}
              label={guest.displayName}
              onDelete={() => handleRemoveGuest(guest._id)}
              sx={{
                background: "#fff",
                border: `1.5px solid ${tokens.border}`,
                fontWeight: 500,
              }}
            />
          ))}
        </Box>

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

function CopyableField({
  label,
  value,
  mono,
  helperText,
}: {
  label: string;
  value: string;
  mono?: boolean;
  helperText?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API can fail in insecure contexts; silently ignore.
    }
  }

  return (
    <Box>
      <Typography
        variant="caption"
        sx={{
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: tokens.muted,
          display: "block",
          mb: 0.75,
        }}
      >
        {label}
      </Typography>
      <TextField
        size="small"
        value={value}
        fullWidth
        InputProps={{
          readOnly: true,
          sx: mono
            ? { fontFamily: "monospace", letterSpacing: "0.15em", fontWeight: 600 }
            : undefined,
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title={copied ? "Copied!" : "Copy"} placement="top" arrow>
                <span>
                  <IconButton size="small" onClick={copy} disabled={!value}>
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        }}
      />
      {helperText && (
        <Typography variant="caption" sx={{ color: tokens.muted, mt: 0.5, display: "block" }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const eventId = context.params?.eventId as string;
  const site = getSiteConfig();

  const event = await getEvent(site.tenantId, eventId);
  if (!event) return { notFound: true };

  const guard = await adminGuard(context);

  if (guard !== null) {
    const session = await getSession(context);
    const userId = (session as any)?.userId as string | undefined;
    const isHost = !!userId && (event.hosts ?? []).includes(userId);
    const isCreator = !!userId && event.createdBy === userId;
    if (!isHost && !isCreator) return guard;
  }

  const [initialGuests, initialItems] = await Promise.all([
    getGuests(site.tenantId, eventId),
    getItems(site.tenantId, eventId),
  ]);

  return { props: { event, initialGuests, initialItems } };
};

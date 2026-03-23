import React, { useState } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";

import CloseIcon from "@mui/icons-material/Close";

import type { SerializedItem } from "../../models";
import { tokens } from "../../styles/theme";

const PIP_COLORS = [
  tokens.orange,
  tokens.pink,
  tokens.green,
  "#6C63FF",
  tokens.yellow,
  "#00BCD4",
  "#FF5722",
  "#4CAF50",
];

// ─── GuestList ────────────────────────────────────────────────────────────────

interface GuestListProps {
  guests: SerializedItem[];
}

export function GuestList({ guests }: GuestListProps) {
  if (guests.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={{ fontStyle: "italic", color: tokens.mutedLight }}
      >
        No one yet — be the first!
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {guests.map((guest, i) => (
        <Box
          key={guest._id}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.875,
            background: "#fff",
            border: `1.5px solid ${tokens.border}`,
            borderRadius: 100,
            pl: 0.75,
            pr: 1.75,
            py: 0.625,
          }}
        >
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: PIP_COLORS[i % PIP_COLORS.length],
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.6875rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0,
            }}
          >
            {guest.item[0]?.toUpperCase() ?? "?"}
          </Box>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
            {guest.item}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── RSVPBar + Modal ──────────────────────────────────────────────────────────

interface RSVPBarProps {
  eventId: string;
  guestCount: number;
  eventTitle: string;
  eventDate: string;
  onRSVP: (guest: SerializedItem) => void;
}

export function RSVPBar({
  eventId,
  guestCount,
  eventTitle,
  eventDate,
  onRSVP,
}: RSVPBarProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleRSVP() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Please enter your name.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, email: email.trim() }),
      });

      if (!res.ok) throw new Error("RSVP failed");

      const data = await res.json();
      onRSVP(data.entry);
      setDone(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setDone(false);
      setName("");
      setEmail("");
      setError("");
    }, 300);
  }

  return (
    <>
      <Box
        sx={{
          background: tokens.navy,
          borderRadius: "16px",
          p: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          mb: 3.5,
        }}
      >
        <Box>
          <Typography
            sx={{ color: "#fff", fontWeight: 600, fontSize: "1rem", mb: 0.25 }}
          >
            Are you coming?
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem" }}
          >
            {guestCount} {guestCount === 1 ? "person has" : "people have"}{" "}
            RSVP'd
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={() => setOpen(true)}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          RSVP Now →
        </Button>
      </Box>

      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "24px 24px 0 0",
            m: 0,
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            maxWidth: "100%",
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 0,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <Box>
            <Typography variant="h3" sx={{ fontSize: "2rem" }}>
              {done ? "You're in! 🎉" : "RSVP"}
            </Typography>
            {!done && (
              <Typography variant="caption">
                {eventTitle} · {eventDate}
              </Typography>
            )}
          </Box>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2 }}>
          {done ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography sx={{ fontSize: "3.5rem", mb: 1.5 }}>🎉</Typography>
              <Typography sx={{ color: tokens.muted, mb: 3 }}>
                See you at {eventTitle}! We'll send updates if anything changes.
              </Typography>
              <Button variant="contained" fullWidth onClick={handleClose}>
                Close
              </Button>
            </Box>
          ) : (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}
            >
              <TextField
                label="Your name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRSVP()}
                fullWidth
                autoFocus
                error={!!error && !name.trim()}
              />
              <TextField
                label="Email for updates (optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
              />
              {error && (
                <Typography variant="caption" color="error">
                  {error}
                </Typography>
              )}
              <Button
                variant="contained"
                size="large"
                onClick={handleRSVP}
                disabled={loading}
                fullWidth
                sx={{ mt: 0.5 }}
              >
                {loading ? "Saving…" : "I'm Coming! 🎉"}
              </Button>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

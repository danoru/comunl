// src/components/detail/GuestList.tsx
import React, { useState } from "react";
import { useSession, signIn } from "next-auth/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";

import CloseIcon from "@mui/icons-material/Close";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";

import type { SerializedGuest } from "../../models";
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
  guests: SerializedGuest[];
  totalCount: number;
}

export function GuestList({ guests, totalCount }: GuestListProps) {
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);

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
      {guests.map((guest, i) => {
        const hasAdditional = guest.additionalGuests.length > 0;
        const namedAdditional = guest.additionalGuests.filter((g) => g.name);
        const isExpanded = expandedGuest === guest._id;

        return (
          <Box key={guest._id}>
            {/* Main guest chip */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                background: "#fff",
                border: `1.5px solid ${tokens.border}`,
                borderRadius: "100px",
                pl: 0.625,
                pr: hasAdditional ? 0.75 : 1.75,
                py: 0.5,
                cursor: hasAdditional ? "pointer" : "default",
              }}
              onClick={() =>
                hasAdditional && setExpandedGuest(isExpanded ? null : guest._id)
              }
            >
              {/* Avatar — from Google if available */}
              {guest.userId ? (
                <Avatar
                  src={undefined} // we'd need to pass image through — see note below
                  sx={{
                    width: 26,
                    height: 26,
                    fontSize: "0.6875rem",
                    background: PIP_COLORS[i % PIP_COLORS.length],
                  }}
                >
                  {guest.displayName[0]?.toUpperCase()}
                </Avatar>
              ) : (
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
                  {guest.displayName[0]?.toUpperCase() ?? "?"}
                </Box>
              )}

              <Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>
                {guest.displayName}
              </Typography>

              {/* +N badge if bringing additional guests */}
              {hasAdditional && (
                <Chip
                  label={`+${guest.additionalGuests.length}`}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: tokens.orangeGlow,
                    color: tokens.orange,
                    ml: 0.25,
                  }}
                />
              )}

              {/* Expand toggle if named additional guests */}
              {namedAdditional.length > 0 && (
                <IconButton size="small" sx={{ p: 0.25, ml: -0.25 }}>
                  {isExpanded ? (
                    <ExpandLessRoundedIcon
                      sx={{ fontSize: 16, color: tokens.muted }}
                    />
                  ) : (
                    <ExpandMoreRoundedIcon
                      sx={{ fontSize: 16, color: tokens.muted }}
                    />
                  )}
                </IconButton>
              )}
            </Box>

            {/* Expanded additional guest names */}
            {namedAdditional.length > 0 && (
              <Collapse in={isExpanded}>
                <Box
                  sx={{
                    pl: 4,
                    pt: 0.75,
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.5,
                  }}
                >
                  {namedAdditional.map((g, j) => (
                    <Typography
                      key={j}
                      variant="caption"
                      sx={{ color: tokens.muted }}
                    >
                      + {g.name}
                    </Typography>
                  ))}
                </Box>
              </Collapse>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── RSVPBar ──────────────────────────────────────────────────────────────────

interface RSVPBarProps {
  eventId: string;
  totalCount: number;
  eventTitle: string;
  eventDate: string;
  allowAnonymous: boolean;
  onRSVP: (guest: SerializedGuest) => void;
}

export function RSVPBar({
  eventId,
  totalCount,
  eventTitle,
  eventDate,
  allowAnonymous,
  onRSVP,
}: RSVPBarProps) {
  const { data: session, status } = useSession();
  const userId = (session as any)?.userId as string | undefined;
  const isSignedIn = !!userId;
  const userName = session?.user?.name ?? "";
  const userImage = session?.user?.image ?? undefined;

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"rsvp" | "additional" | "done">("rsvp");
  const [anonName, setAnonName] = useState("");
  const [additional, setAdditional] = useState<{ name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleOpen() {
    setStep("rsvp");
    setOpen(true);
    setError("");
  }
  function handleClose() {
    setOpen(false);
    setTimeout(() => {
      setStep("rsvp");
      setAnonName("");
      setAdditional([]);
      setError("");
    }, 300);
  }

  function addAdditionalSlot() {
    setAdditional((prev) => [...prev, { name: "" }]);
  }

  function updateAdditional(index: number, name: string) {
    setAdditional((prev) => prev.map((g, i) => (i === index ? { name } : g)));
  }

  function removeAdditional(index: number) {
    setAdditional((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    const displayName = isSignedIn ? userName : anonName.trim();
    if (!displayName) {
      setError("Please enter your name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/${eventId}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          additionalGuests: additional.map((g) => ({
            name: g.name.trim() || undefined,
          })),
        }),
      });

      if (res.status === 409) {
        setError("You've already RSVP'd to this event!");
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error();

      const guest: SerializedGuest = await res.json();
      onRSVP(guest);
      setStep("done");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const countLabel =
    totalCount === 1
      ? "1 person has RSVP'd"
      : `${totalCount} people have RSVP'd`;

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
            {countLabel}
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleOpen}
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
        >
          I'm Attending →
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
            <Typography variant="h3" sx={{ fontSize: "1.75rem" }}>
              {step === "done" ? "You're in! 🎉" : "RSVP"}
            </Typography>
            {step !== "done" && (
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
          {step === "done" ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🎉</Typography>
              <Typography sx={{ color: tokens.muted, mb: 3 }}>
                See you at {eventTitle}!
                {additional.length > 0 &&
                  ` You're bringing ${additional.length} additional ${additional.length === 1 ? "guest" : "guests"}.`}
              </Typography>
              <Button variant="contained" fullWidth onClick={handleClose}>
                Close
              </Button>
            </Box>
          ) : step === "additional" ? (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}
            >
              <Typography sx={{ color: tokens.muted, fontSize: "0.9375rem" }}>
                Are you bringing anyone else? Add them below, or leave names
                blank for anonymous guests.
              </Typography>

              {additional.map((g, i) => (
                <Box
                  key={i}
                  sx={{ display: "flex", gap: 1, alignItems: "center" }}
                >
                  <TextField
                    size="small"
                    placeholder={`Guest ${i + 1} name (optional)`}
                    value={g.name}
                    onChange={(e) => updateAdditional(i, e.target.value)}
                    fullWidth
                  />
                  <IconButton size="small" onClick={() => removeAdditional(i)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Button
                variant="outlined"
                size="small"
                startIcon={<AddRoundedIcon />}
                onClick={addAdditionalSlot}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 100,
                  borderColor: tokens.border,
                  color: tokens.muted,
                }}
              >
                Add another guest
              </Button>

              <Divider sx={{ my: 0.5 }} />

              <Button
                variant="contained"
                size="large"
                onClick={handleSubmit}
                disabled={loading}
                fullWidth
              >
                {loading ? "Saving…" : "Confirm RSVP →"}
              </Button>
              <Button
                variant="text"
                onClick={handleSubmit}
                disabled={loading}
                sx={{ color: tokens.muted, fontSize: "0.8125rem" }}
              >
                Just me — skip this
              </Button>
            </Box>
          ) : (
            // Step 1: identity
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}
            >
              {/* Signed in — show profile */}
              {isSignedIn ? (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.5,
                    background: tokens.creamDark,
                    borderRadius: "12px",
                    p: "12px 16px",
                  }}
                >
                  <Avatar src={userImage} sx={{ width: 40, height: 40 }}>
                    {userName[0]?.toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                      {userName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: tokens.muted }}>
                      RSVP'ing as yourself
                    </Typography>
                  </Box>
                </Box>
              ) : allowAnonymous ? (
                // Anonymous fallback
                <TextField
                  label="Your name *"
                  value={anonName}
                  onChange={(e) => setAnonName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setStep("additional")}
                  fullWidth
                  autoFocus
                  error={!!error}
                />
              ) : (
                // Auth required
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography sx={{ mb: 2, color: tokens.muted }}>
                    You need to sign in to RSVP for this event.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => signIn("google")}
                  >
                    Sign in with Google
                  </Button>
                </Box>
              )}

              {/* Sign in nudge for anonymous flow */}
              {!isSignedIn && allowAnonymous && (
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    background: tokens.creamDark,
                    borderRadius: "10px",
                    p: "10px 14px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: tokens.muted, flex: 1 }}
                  >
                    Sign in to track your event history and save your info.
                  </Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => signIn("google")}
                    sx={{
                      whiteSpace: "nowrap",
                      borderRadius: 100,
                      borderColor: tokens.border,
                      color: tokens.navy,
                      fontSize: "0.75rem",
                    }}
                  >
                    Sign in
                  </Button>
                </Box>
              )}

              {error && (
                <Alert severity="error" sx={{ borderRadius: "10px" }}>
                  {error}
                </Alert>
              )}

              {(isSignedIn || allowAnonymous) && (
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => {
                    if (!isSignedIn && !anonName.trim()) {
                      setError("Please enter your name.");
                      return;
                    }
                    setError("");
                    setStep("additional");
                  }}
                  fullWidth
                >
                  Next →
                </Button>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

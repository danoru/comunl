import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseIcon from "@mui/icons-material/Close";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useSession, signIn } from "next-auth/react";
import React, { useState } from "react";

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

interface GuestListProps {
  guests: SerializedGuest[];
  totalCount: number;
}

export function GuestList({ guests }: GuestListProps) {
  const [expandedGuest, setExpandedGuest] = useState<string | null>(null);

  if (guests.length === 0) {
    return (
      <Typography sx={{ fontStyle: "italic", color: tokens.mutedLight }} variant="caption">
        No one yet — be the first!
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {guests.map((guest, i) => {
        const additionalGuests = guest.additionalGuests ?? [];
        const hasAdditional = additionalGuests.length > 0;
        const namedAdditional = additionalGuests.filter((g) => g.name);
        const isExpanded = expandedGuest === guest._id;

        return (
          <Box key={guest._id}>
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
              onClick={() => hasAdditional && setExpandedGuest(isExpanded ? null : guest._id)}
            >
              {guest.userId ? (
                <Avatar
                  src={undefined}
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

              {hasAdditional && (
                <Chip
                  label={`+${additionalGuests.length}`}
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

              {namedAdditional.length > 0 && (
                <IconButton size="small" sx={{ p: 0.25, ml: -0.25 }}>
                  {isExpanded ? (
                    <ExpandLessRoundedIcon sx={{ fontSize: 16, color: tokens.muted }} />
                  ) : (
                    <ExpandMoreRoundedIcon sx={{ fontSize: 16, color: tokens.muted }} />
                  )}
                </IconButton>
              )}
            </Box>

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
                    <Typography key={j} sx={{ color: tokens.muted }} variant="caption">
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
  const { data: session } = useSession();
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
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

  React.useEffect(() => {
    if (!open) return;

    const onResize = () => {
      const viewport = window.visualViewport;
      if (!viewport) return;
      const keyboardH = window.innerHeight - viewport.height - viewport.offsetTop;
      setKeyboardHeight(Math.max(0, keyboardH));
    };

    window.visualViewport?.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("scroll", onResize);
    return () => {
      window.visualViewport?.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("scroll", onResize);
      setKeyboardHeight(0);
    };
  }, [open]);

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

  const countLabel = totalCount === 1 ? "1 person has RSVP'd" : `${totalCount} people have RSVP'd`;

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
          <Typography sx={{ color: "#fff", fontWeight: 600, fontSize: "1rem", mb: 0.25 }}>
            Are you coming?
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8125rem" }}>
            {countLabel}
          </Typography>
        </Box>
        <Button
          sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
          variant="contained"
          onClick={handleOpen}
        >
          I'm Attending →
        </Button>
      </Box>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={open}
        PaperProps={{
          sx: {
            borderRadius: "24px 24px 0 0",
            m: 0,
            position: "fixed",
            bottom: keyboardHeight,
            left: 0,
            right: 0,
            maxWidth: "100%",
            maxHeight: "90svh",
            overflowY: "auto",
            transition: "bottom 0.15s ease",
          },
        }}
        onClose={handleClose}
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
            <Typography sx={{ fontSize: "1.75rem" }} variant="h3">
              {step === "done" ? "You're in! 🎉" : "RSVP"}
            </Typography>
            {step !== "done" && (
              <Typography variant="caption">
                {eventTitle} · {eventDate}
              </Typography>
            )}
          </Box>
          <IconButton size="small" onClick={handleClose}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 2, pb: "env(safe-area-inset-bottom, 16px)" }}>
          {step === "done" ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🎉</Typography>
              <Typography sx={{ color: tokens.muted, mb: 3 }}>
                See you at {eventTitle}!
                {additional.length > 0 &&
                  ` You're bringing ${additional.length} additional ${additional.length === 1 ? "guest" : "guests"}.`}
              </Typography>
              <Button fullWidth variant="contained" onClick={handleClose}>
                Close
              </Button>
            </Box>
          ) : step === "additional" ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}>
              <Typography sx={{ color: tokens.muted, fontSize: "0.9375rem" }}>
                Are you bringing anyone else? Add them below, or leave names blank for anonymous
                guests.
              </Typography>

              {additional.map((g, i) => (
                <Box key={i} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    placeholder={`Guest ${i + 1} name (optional)`}
                    size="small"
                    value={g.name}
                    onChange={(e) => updateAdditional(i, e.target.value)}
                  />
                  <IconButton size="small" onClick={() => removeAdditional(i)}>
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Button
                size="small"
                startIcon={<AddRoundedIcon />}
                sx={{
                  alignSelf: "flex-start",
                  borderRadius: 100,
                  borderColor: tokens.border,
                  color: tokens.muted,
                }}
                variant="outlined"
                onClick={addAdditionalSlot}
              >
                Add another guest
              </Button>

              <Divider sx={{ my: 0.5 }} />

              <Button
                fullWidth
                disabled={loading}
                size="large"
                variant="contained"
                onClick={handleSubmit}
              >
                {loading ? "Saving…" : "Confirm RSVP →"}
              </Button>
              <Button
                disabled={loading}
                sx={{ color: tokens.muted, fontSize: "0.8125rem" }}
                variant="text"
                onClick={handleSubmit}
              >
                Just me — skip this
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, pb: 2 }}>
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
                    <Typography sx={{ color: tokens.muted }} variant="caption">
                      RSVP'ing as yourself
                    </Typography>
                  </Box>
                </Box>
              ) : allowAnonymous ? (
                <TextField
                  autoFocus
                  fullWidth
                  error={!!error}
                  label="Your name *"
                  value={anonName}
                  onChange={(e) => setAnonName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setStep("additional")}
                />
              ) : (
                <Box sx={{ textAlign: "center", py: 2 }}>
                  <Typography sx={{ mb: 2, color: tokens.muted }}>
                    You need to sign in to RSVP for this event.
                  </Typography>
                  <Button fullWidth variant="contained" onClick={() => signIn("google")}>
                    Sign in with Google
                  </Button>
                </Box>
              )}

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
                  <Typography sx={{ color: tokens.muted, flex: 1 }} variant="caption">
                    Sign in to track your event history and save your info.
                  </Typography>
                  <Button
                    size="small"
                    sx={{
                      whiteSpace: "nowrap",
                      borderRadius: 100,
                      borderColor: tokens.border,
                      color: tokens.navy,
                      fontSize: "0.75rem",
                    }}
                    variant="outlined"
                    onClick={() => signIn("google")}
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
                  fullWidth
                  size="large"
                  variant="contained"
                  onClick={() => {
                    if (!isSignedIn && !anonName.trim()) {
                      setError("Please enter your name.");
                      return;
                    }
                    setError("");
                    setStep("additional");
                  }}
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

// Shown when an event is private and the visitor hasn't entered the invite code yet.

import React, { useState } from "react";
import { useRouter } from "next/router";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import LockRoundedIcon from "@mui/icons-material/LockRounded";

import { tokens } from "../../styles/theme";

interface EventLockedProps {
  eventId: string;
  eventTitle: string;
}

export default function EventLocked({ eventId, eventTitle }: EventLockedProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/${eventId}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });

      if (res.status === 200) {
        // Reload the page — the server will now see the code cookie
        router.reload();
      } else {
        setError("That code doesn't look right. Double-check and try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "80svh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: tokens.creamDark,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1,
        }}
      >
        <LockRoundedIcon sx={{ fontSize: 32, color: tokens.muted }} />
      </Box>

      <Typography variant="h2" sx={{ fontSize: "clamp(24px, 6vw, 36px)" }}>
        {eventTitle}
      </Typography>

      <Typography
        sx={{
          fontFamily: '"Playfair Display", serif',
          fontStyle: "italic",
          color: tokens.muted,
          maxWidth: 340,
        }}
      >
        This is a private event. Enter the invite code to see the details.
      </Typography>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          width: "100%",
          maxWidth: 320,
          mt: 1,
        }}
      >
        <TextField
          placeholder="Enter invite code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          inputProps={{
            style: {
              textAlign: "center",
              letterSpacing: "0.2em",
              fontWeight: 700,
              fontSize: "1.25rem",
              textTransform: "uppercase",
            },
          }}
          autoFocus
          fullWidth
        />

        {error && (
          <Alert severity="error" sx={{ borderRadius: "10px", textAlign: "left" }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          fullWidth
        >
          {loading ? "Checking…" : "Unlock Event →"}
        </Button>
      </Box>

      <Typography variant="caption" sx={{ color: tokens.mutedLight, mt: 1 }}>
        Ask the host for the invite code.
      </Typography>
    </Box>
  );
}

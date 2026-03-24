import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";

import { tokens } from "../../src/styles/theme";

interface FormState {
  title: string;
  description: string;
  location: string;
  date: Dayjs | null;
  flyer: string;
  image: string;
  isFeatured: boolean;
  isGuestOnly: boolean;
}

const EMPTY_FORM: FormState = {
  title: "",
  description: "",
  location: "",
  date: dayjs().add(7, "day").hour(17).minute(0).second(0),
  flyer: "",
  image: "",
  isFeatured: false,
  isGuestOnly: false,
};

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!form.title.trim()) e.title = "Title is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!form.date || !form.date.isValid()) e.date = "A valid date is required";
    if (form.flyer && !IMGUR_RE.test(form.flyer))
      e.flyer = "Must be an Imgur URL (e.g. https://i.imgur.com/abc123.png)";
    if (form.image && !IMGUR_RE.test(form.image))
      e.image = "Must be an Imgur URL (e.g. https://i.imgur.com/abc123.png)";

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setSubmitting(true);
    setServerError("");

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          date: form.date!.toISOString(),
          flyer: form.flyer.trim() || "",
          image: form.image.trim() || form.flyer.trim() || "",
          isFeatured: form.isFeatured,
          isGuestOnly: form.isGuestOnly,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      const event = await res.json();
      router.push(`/events/${event.id}`);
    } catch {
      setServerError("Network error — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Live preview of flyer URL
  const flyerPreviewUrl = IMGUR_RE.test(form.flyer) ? form.flyer : null;

  return (
    <>
      <Head>
        <title>Create Event — Comunl</title>
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
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
            NEW EVENT
          </Typography>
          <Typography variant="h1" sx={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 1 }}>
            Create an Event
          </Typography>
        </Box>

        {serverError && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
            {serverError}
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* ── Basic info ── */}
          <SectionLabel>Event Details</SectionLabel>

          <TextField
            label="Event title *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            error={!!errors.title}
            helperText={errors.title}
            fullWidth
            autoFocus
            placeholder="e.g. Halloween Party!"
          />

          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Tell guests what to expect, what to bring, dress code…"
          />

          <TextField
            label="Location *"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            error={!!errors.location}
            helperText={errors.location}
            fullWidth
            placeholder="e.g. Cody's Corner"
          />

          <DateTimePicker
            label="Date & time *"
            value={form.date}
            onChange={(val) => set("date", val)}
            slotProps={{
              textField: {
                fullWidth: true,
                error: !!errors.date,
                helperText: errors.date,
              },
            }}
          />

          <Divider sx={{ my: 0.5 }} />

          {/* ── Flyer ── */}
          <SectionLabel>Flyer / Image</SectionLabel>

          <TextField
            label="Flyer URL"
            value={form.flyer}
            onChange={(e) => set("flyer", e.target.value)}
            error={!!errors.flyer}
            helperText={
              errors.flyer ?? "Upload your image to imgur.com, then paste the direct link here"
            }
            fullWidth
            placeholder="https://i.imgur.com/abc123.png"
          />

          {/* Live preview */}
          {flyerPreviewUrl && (
            <Box
              sx={{
                borderRadius: "16px",
                overflow: "hidden",
                border: `1.5px solid ${tokens.border}`,
                maxHeight: 280,
              }}
            >
              <Box
                component="img"
                src={flyerPreviewUrl}
                alt="Flyer preview"
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </Box>
          )}

          {/* Separate thumbnail URL — optional if different from flyer */}
          <TextField
            label="Thumbnail URL (optional)"
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
            error={!!errors.image}
            helperText={errors.image ?? "Leave blank to use the flyer image as the thumbnail too"}
            fullWidth
            placeholder="https://i.imgur.com/abc123.png"
          />

          <Divider sx={{ my: 0.5 }} />

          {/* ── Options ── */}
          <SectionLabel>Options</SectionLabel>

          <Box
            sx={{
              background: "#fff",
              border: `1.5px solid ${tokens.border}`,
              borderRadius: "16px",
              p: "8px 20px",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <FormControlLabel
              control={
                <Switch
                  checked={form.isFeatured}
                  onChange={(e) => set("isFeatured", e.target.checked)}
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
                  <Typography variant="caption">
                    Shows this event prominently on the homepage
                  </Typography>
                </Box>
              }
              sx={{ py: 1 }}
            />

            <Divider />

            <FormControlLabel
              control={
                <Switch
                  checked={form.isGuestOnly}
                  onChange={(e) => set("isGuestOnly", e.target.checked)}
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
                  <Typography variant="caption">
                    Hides food/drink sections — only shows the guest list
                  </Typography>
                </Box>
              }
              sx={{ py: 1 }}
            />
          </Box>

          {/* ── Submit ── */}
          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ flex: 1 }}
            >
              {submitting ? "Creating…" : "Create Event →"}
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Box>
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
        mt: 0.5,
      }}
    >
      {children}
    </Typography>
  );
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { adminGuard } = await import("../../src/lib/auth");
  const redirect = await adminGuard(context);
  if (redirect) return redirect;
  return { props: {} };
};

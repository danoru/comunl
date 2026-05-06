import React, { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { getSiteConfig } from "../../src/models";
import CoHostPicker, { type HostUser } from "../../src/components/events/CoHostPicker";

import { tokens } from "../../src/styles/theme";

type AnonRsvpMode = "default" | "yes" | "no";

interface FormState {
  title: string;
  description: string;
  location: string;
  date: Dayjs | null;
  flyer: string;
  image: string;
  isFeatured: boolean;
  isGuestOnly: boolean;
  isPrivate: boolean;
  allowAnonymousGuests: AnonRsvpMode;
  hosts: HostUser[];
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
  isPrivate: false,
  allowAnonymousGuests: "default",
  hosts: [],
};

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: session } = useSession();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
      const allowAnonymous: boolean | null =
        form.allowAnonymousGuests === "default" ? null : form.allowAnonymousGuests === "yes";

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
          isPrivate: form.isPrivate,
          hosts: form.hosts.map((h) => h.userId),
          allowAnonymousGuests: allowAnonymous,
          createdBy: (session as any)?.userId,
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

  const flyerPreviewUrl = IMGUR_RE.test(form.flyer) ? form.flyer : null;

  return (
    <>
      <Head>
        <title>Create Event — Comunl</title>
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
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

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Privacy & RSVPs</SectionLabel>

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
                  checked={form.isPrivate}
                  onChange={(e) => set("isPrivate", e.target.checked)}
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
                    Private event
                  </Typography>
                  <Typography variant="caption">
                    {form.isPrivate
                      ? "An invite code will be generated. Share it with guests so they can unlock the event."
                      : "Anyone with the link can view this event."}
                  </Typography>
                </Box>
              }
              sx={{ py: 1 }}
            />

            <Divider />

            <FormControl sx={{ py: 1.5 }}>
              <FormLabel
                sx={{
                  fontSize: "0.9375rem",
                  fontWeight: 500,
                  color: tokens.navy,
                  mb: 0.5,
                  "&.Mui-focused": { color: tokens.navy },
                }}
              >
                Anonymous RSVPs
              </FormLabel>
              <Typography variant="caption" sx={{ mb: 1 }}>
                Let guests RSVP without signing in?
              </Typography>
              <RadioGroup
                value={form.allowAnonymousGuests}
                onChange={(e) => set("allowAnonymousGuests", e.target.value as AnonRsvpMode)}
              >
                <FormControlLabel
                  value="default"
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={<Typography sx={{ fontSize: "0.875rem" }}>Use site default</Typography>}
                />
                <FormControlLabel
                  value="yes"
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.875rem" }}>Allow anonymous RSVPs</Typography>
                  }
                />
                <FormControlLabel
                  value="no"
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.875rem" }}>Require guests to sign in</Typography>
                  }
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Co-hosts (optional)</SectionLabel>
          <Typography variant="caption" sx={{ mt: -1.5, mb: 0.5 }}>
            Co-hosts can edit the event and manage RSVPs.
          </Typography>
          <CoHostPicker value={form.hosts} onChange={(hosts) => set("hosts", hosts)} />

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
  const session = await getServerSession(context.req, context.res, authOptions);
  const isAdmin = (session as any)?.isAdmin ?? false;
  const site = getSiteConfig();

  if (!session) {
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  if (!site.allowPublicEventCreation && !isAdmin) {
    return { redirect: { destination: "/events", permanent: false } };
  }

  return { props: {} };
};

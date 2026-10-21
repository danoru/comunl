import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs, { Dayjs } from "dayjs";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

import CoHostPicker, { type HostUser } from "../../src/components/events/CoHostPicker";
import { getSiteConfig } from "../../src/models";
import { tokens } from "../../src/styles/theme";
import { authOptions } from "../api/auth/[...nextauth]";

type AnonRsvpMode = "default" | "yes" | "no";

interface FormState {
  title: string;
  description: string;
  location: string;
  date: Dayjs | null;
  pollDates: boolean;
  proposedDates: (Dayjs | null)[];
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
  pollDates: false,
  proposedDates: [
    dayjs().add(7, "day").hour(17).minute(0).second(0),
    dayjs().add(8, "day").hour(17).minute(0).second(0),
  ],
  flyer: "",
  image: "",
  isFeatured: false,
  isGuestOnly: false,
  isPrivate: false,
  allowAnonymousGuests: "default",
  hosts: [],
};

const MAX_POLL_OPTIONS = 10;

const IMGUR_RE = /^https?:\/\/(i\.)?imgur\.com\/.+/i;

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;

  // Pre-fill from a converted intent (/events/new?intentId=…&title=…).
  const prefilledRef = React.useRef(false);
  React.useEffect(() => {
    if (!router.isReady || prefilledRef.current) return;
    prefilledRef.current = true;
    const { title, description, location, intentId } = router.query;
    if (typeof title !== "string" && typeof intentId !== "string") return;
    setForm((prev) => ({
      ...prev,
      title: typeof title === "string" ? title : prev.title,
      description: typeof description === "string" ? description : prev.description,
      location: typeof location === "string" ? location : prev.location,
      // An idea without a settled date defaults to polling mode.
      pollDates: typeof intentId === "string" ? true : prev.pollDates,
    }));
  }, [router.isReady, router.query]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function setProposedDate(index: number, value: Dayjs | null) {
    setForm((prev) => {
      const proposedDates = [...prev.proposedDates];
      proposedDates[index] = value;
      return { ...prev, proposedDates };
    });
    if (errors.proposedDates) setErrors((prev) => ({ ...prev, proposedDates: undefined }));
  }

  function removeProposedDate(index: number) {
    setForm((prev) => ({
      ...prev,
      proposedDates: prev.proposedDates.filter((_, i) => i !== index),
    }));
  }

  function validate(): boolean {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!form.title.trim()) e.title = "Title is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (form.pollDates) {
      const valid = form.proposedDates.filter((d) => d?.isValid());
      if (valid.length < 2) e.proposedDates = "Propose at least two times to vote on";
    } else if (!form.date || !form.date.isValid()) {
      e.date = "A valid date is required";
    }
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

      const proposed = form.pollDates
        ? form.proposedDates.filter((d): d is Dayjs => !!d?.isValid())
        : [];
      // While polling, the provisional event date is the furthest-out option so
      // the event never sorts into "past" before the poll resolves.
      const eventDate = form.pollDates
        ? proposed.reduce((max, d) => (d.isAfter(max) ? d : max), proposed[0])
        : form.date!;

      const intentId = typeof router.query.intentId === "string" ? router.query.intentId : null;

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          location: form.location.trim(),
          date: eventDate.toISOString(),
          dateStatus: form.pollDates ? "polling" : "confirmed",
          flyer: form.flyer.trim() || "",
          image: form.image.trim() || form.flyer.trim() || "",
          isFeatured: form.isFeatured,
          isGuestOnly: form.isGuestOnly,
          isPrivate: form.isPrivate,
          hosts: form.hosts.map((h) => h.userId),
          allowAnonymousGuests: allowAnonymous,
          createdBy: (session as any)?.userId,
          ...(intentId ? { intentId } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setServerError(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      const event = await res.json();

      if (form.pollDates) {
        const pollRes = await fetch(`/api/${event.id}/poll`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            options: proposed.map((d) => ({ start: d.toISOString() })),
          }),
        });
        if (!pollRes.ok) {
          const data = await pollRes.json();
          setServerError(data.message ?? "Event created, but the date poll failed.");
          return;
        }
      }

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
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              letterSpacing: "0.25em",
              color: tokens.orange,
              display: "block",
              mb: 0.5,
            }}
            variant="caption"
          >
            NEW EVENT
          </Typography>
          <Typography sx={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 1 }} variant="h1">
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
            autoFocus
            fullWidth
            error={!!errors.title}
            helperText={errors.title}
            label="Event title *"
            placeholder="e.g. Halloween Party!"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />

          <TextField
            fullWidth
            multiline
            label="Description"
            minRows={3}
            placeholder="Tell guests what to expect, what to bring, dress code…"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />

          <TextField
            fullWidth
            error={!!errors.location}
            helperText={errors.location}
            label="Location *"
            placeholder="e.g. Maya's backyard"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.pollDates}
                sx={{
                  "& .MuiSwitch-switchBase.Mui-checked": {
                    color: tokens.orange,
                  },
                  "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                    backgroundColor: tokens.orange,
                  },
                }}
                onChange={(e) => set("pollDates", e.target.checked)}
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500 }}>
                  Let people vote on the date
                </Typography>
                <Typography variant="caption">Propose a few times — lock one in later</Typography>
              </Box>
            }
            sx={{ mx: 0 }}
          />

          {!form.pollDates && (
            <DateTimePicker
              label="Date & time *"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.date,
                  helperText: errors.date,
                },
              }}
              value={form.date}
              onChange={(val) => set("date", val)}
            />
          )}

          {form.pollDates && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {form.proposedDates.map((d, i) => (
                <Box key={i} sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                  <DateTimePicker
                    label={`Proposed time ${i + 1}`}
                    slotProps={{ textField: { fullWidth: true } }}
                    value={d}
                    onChange={(val) => setProposedDate(i, val)}
                  />
                  {form.proposedDates.length > 2 && (
                    <Button
                      sx={{ color: tokens.muted, minWidth: 44 }}
                      onClick={() => removeProposedDate(i)}
                    >
                      ✕
                    </Button>
                  )}
                </Box>
              ))}
              {errors.proposedDates && (
                <Typography sx={{ color: "#d32f2f" }} variant="caption">
                  {errors.proposedDates}
                </Typography>
              )}
              {form.proposedDates.length < MAX_POLL_OPTIONS && (
                <Button
                  sx={{ borderStyle: "dashed" }}
                  variant="outlined"
                  onClick={() =>
                    set("proposedDates", [
                      ...form.proposedDates,
                      (form.proposedDates[form.proposedDates.length - 1] ?? dayjs()).add(1, "day"),
                    ])
                  }
                >
                  + Add another time
                </Button>
              )}
            </Box>
          )}

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Flyer / Image</SectionLabel>

          <TextField
            fullWidth
            error={!!errors.flyer}
            helperText={
              errors.flyer ?? "Upload your image to imgur.com, then paste the direct link here"
            }
            label="Flyer URL"
            placeholder="https://i.imgur.com/abc123.png"
            value={form.flyer}
            onChange={(e) => set("flyer", e.target.value)}
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
                alt="Flyer preview"
                component="img"
                src={flyerPreviewUrl}
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
            fullWidth
            error={!!errors.image}
            helperText={errors.image ?? "Leave blank to use the flyer image as the thumbnail too"}
            label="Thumbnail URL (optional)"
            placeholder="https://i.imgur.com/abc123.png"
            value={form.image}
            onChange={(e) => set("image", e.target.value)}
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
            {isAdmin && (
              <>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.isFeatured}
                      sx={{
                        "& .MuiSwitch-switchBase.Mui-checked": {
                          color: tokens.orange,
                        },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                          backgroundColor: tokens.orange,
                        },
                      }}
                      onChange={(e) => set("isFeatured", e.target.checked)}
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
              </>
            )}

            <FormControlLabel
              control={
                <Switch
                  checked={form.isGuestOnly}
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: tokens.orange,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: tokens.orange,
                    },
                  }}
                  onChange={(e) => set("isGuestOnly", e.target.checked)}
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
                  sx={{
                    "& .MuiSwitch-switchBase.Mui-checked": {
                      color: tokens.orange,
                    },
                    "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                      backgroundColor: tokens.orange,
                    },
                  }}
                  onChange={(e) => set("isPrivate", e.target.checked)}
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
              <Typography sx={{ mb: 1 }} variant="caption">
                Let guests RSVP without signing in?
              </Typography>
              <RadioGroup
                value={form.allowAnonymousGuests}
                onChange={(e) => set("allowAnonymousGuests", e.target.value as AnonRsvpMode)}
              >
                <FormControlLabel
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={<Typography sx={{ fontSize: "0.875rem" }}>Use site default</Typography>}
                  value="default"
                />
                <FormControlLabel
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.875rem" }}>Allow anonymous RSVPs</Typography>
                  }
                  value="yes"
                />
                <FormControlLabel
                  control={
                    <Radio size="small" sx={{ "&.Mui-checked": { color: tokens.orange } }} />
                  }
                  label={
                    <Typography sx={{ fontSize: "0.875rem" }}>Require guests to sign in</Typography>
                  }
                  value="no"
                />
              </RadioGroup>
            </FormControl>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          <SectionLabel>Co-hosts (optional)</SectionLabel>
          <Typography sx={{ mt: -1.5, mb: 0.5 }} variant="caption">
            Co-hosts can edit the event and manage RSVPs.
          </Typography>
          <CoHostPicker value={form.hosts} onChange={(hosts) => set("hosts", hosts)} />

          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Button
              disabled={submitting}
              size="large"
              sx={{ flex: 1 }}
              variant="contained"
              onClick={handleSubmit}
            >
              {submitting ? "Creating…" : "Create Event →"}
            </Button>
            <Button
              disabled={submitting}
              size="large"
              variant="outlined"
              onClick={() => router.back()}
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
      sx={{
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: "0.8125rem",
        letterSpacing: "0.2em",
        color: tokens.muted,
        display: "block",
        mt: 0.5,
      }}
      variant="caption"
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

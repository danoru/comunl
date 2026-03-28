import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import type { GetServerSideProps } from "next";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Avatar from "@mui/material/Avatar";
import Alert from "@mui/material/Alert";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";

import EditRoundedIcon from "@mui/icons-material/EditRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";

import { tokens } from "../../src/styles/theme";
import type { SerializedUser, SerializedGuest } from "../../src/models";
import { Chip } from "@mui/material";
import { DIETARY_OPTIONS } from "@/lib/dietary";

// ─── Profile fields config ────────────────────────────────────────────────────

const FIELDS: {
  key: keyof Pick<SerializedUser, "name" | "phone" | "city" | "state" | "dietaryPreferences">;
  label: string;
  placeholder: string;
  type?: string;
}[] = [
  { key: "name", label: "Display name", placeholder: "How you appear on RSVPs" },
  { key: "phone", label: "Phone number", placeholder: "Optional — for event updates", type: "tel" },
  { key: "city", label: "City", placeholder: "e.g. Los Angeles" },
  { key: "state", label: "State / Region", placeholder: "e.g. CA" },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState<SerializedUser | null>(null);
  const [rsvps, setRsvps] = useState<SerializedGuest[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<SerializedUser>>({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherDiet, setOtherDiet] = useState("");

  // Fetch profile + RSVP history on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/user/profile").then((r) => r.json()),
      fetch("/api/user/rsvps").then((r) => r.json()),
    ])
      .then(([profileData, rsvpData]) => {
        setProfile(profileData);
        setForm(profileData);
        setRsvps(Array.isArray(rsvpData) ? rsvpData : []);
      })
      .finally(() => setLoading(false));
  }, [status]);

  async function handleSave() {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          city: form.city,
          state: form.state,
          dietaryPreferences: form.dietaryPreferences,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSaveMsg("Profile updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  }

  // Not signed in
  if (status === "unauthenticated") {
    return (
      <>
        <Head>
          <title>Profile — Comunl</title>
        </Head>
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
          <Typography sx={{ fontSize: "3rem" }}>👤</Typography>
          <Typography variant="h2" sx={{ fontSize: "clamp(28px, 6vw, 40px)" }}>
            Your Profile
          </Typography>
          <Typography sx={{ color: tokens.muted, maxWidth: 320 }}>
            Sign in to manage your profile, track your RSVPs, and more.
          </Typography>
          <Button variant="contained" size="large" onClick={() => signIn("google")}>
            Sign in with Google
          </Button>
        </Box>
      </>
    );
  }

  const userImage = session?.user?.image ?? undefined;
  const userName = profile?.name ?? session?.user?.name ?? "You";

  return (
    <>
      <Head>
        <title>Profile — Comunl</title>
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mb: 4 }}>
          <Avatar
            src={userImage}
            sx={{ width: 72, height: 72, fontSize: "1.75rem", background: tokens.orange }}
          >
            {userName[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h2" sx={{ fontSize: "clamp(24px, 6vw, 36px)", lineHeight: 1.1 }}>
              {loading ? <Skeleton width={200} /> : userName}
            </Typography>
            <Typography variant="caption" sx={{ color: tokens.muted }}>
              {session?.user?.email}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutRoundedIcon />}
            onClick={() => signOut({ callbackUrl: "/" })}
            sx={{
              borderRadius: 100,
              borderColor: tokens.border,
              color: tokens.muted,
              flexShrink: 0,
            }}
          >
            Sign out
          </Button>
        </Box>

        {saveMsg && (
          <Alert
            severity={saveMsg.includes("failed") ? "error" : "success"}
            sx={{ mb: 3, borderRadius: "12px" }}
          >
            {saveMsg}
          </Alert>
        )}

        {/* Profile fields */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <SectionLabel>Profile Info</SectionLabel>
          {!editing && (
            <Button
              size="small"
              startIcon={<EditRoundedIcon />}
              onClick={() => setEditing(true)}
              sx={{ borderRadius: 100, color: tokens.muted, fontSize: "0.8125rem" }}
            >
              Edit
            </Button>
          )}
        </Box>

        <Box
          sx={{
            background: "#fff",
            border: `1.5px solid ${tokens.border}`,
            borderRadius: "16px",
            overflow: "hidden",
            mb: 4,
          }}
        >
          {FIELDS.map((field, i) => (
            <Box key={field.key}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 2.5, py: 1.75 }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: tokens.muted,
                    display: "block",
                    mb: 0.5,
                  }}
                >
                  {field.label}
                </Typography>
                {editing ? (
                  <TextField
                    size="small"
                    value={(form as any)[field.key] ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    type={field.type ?? "text"}
                    fullWidth
                    variant="standard"
                    InputProps={{ disableUnderline: false }}
                  />
                ) : loading ? (
                  <Skeleton width={160} height={20} />
                ) : (
                  <Typography
                    sx={{
                      fontSize: "0.9375rem",
                      color: (profile as any)?.[field.key] ? tokens.navy : tokens.mutedLight,
                      fontStyle: (profile as any)?.[field.key] ? "normal" : "italic",
                    }}
                  >
                    {(profile as any)?.[field.key] || field.placeholder}
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
        <Box sx={{ mb: editing ? 0 : 4 }}>
          <Box
            sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}
          >
            <SectionLabel>Dietary Preferences</SectionLabel>
          </Box>

          {editing ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {DIETARY_OPTIONS.map((opt) => {
                  const selected = (form.dietaryPreferences ?? []).includes(opt);
                  return (
                    <Chip
                      key={opt}
                      label={opt}
                      onClick={() =>
                        setForm((prev) => {
                          const current = prev.dietaryPreferences ?? [];
                          return {
                            ...prev,
                            dietaryPreferences: selected
                              ? current.filter((v) => v !== opt)
                              : [...current, opt],
                          };
                        })
                      }
                      sx={{
                        cursor: "pointer",
                        background: selected ? tokens.orangeGlow : "#fff",
                        border: `1.5px solid ${selected ? tokens.orange : tokens.border}`,
                        color: selected ? tokens.orange : tokens.navy,
                        fontWeight: selected ? 600 : 400,
                        "&:hover": { borderColor: tokens.orange },
                      }}
                    />
                  );
                })}
              </Box>

              {/* Custom / other */}
              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  size="small"
                  placeholder="Other (e.g. no cilantro)"
                  value={otherDiet}
                  onChange={(e) => setOtherDiet(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && otherDiet.trim()) {
                      const val = otherDiet.trim();
                      setForm((prev) => ({
                        ...prev,
                        dietaryPreferences: [...new Set([...(prev.dietaryPreferences ?? []), val])],
                      }));
                      setOtherDiet("");
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!otherDiet.trim()}
                  onClick={() => {
                    const val = otherDiet.trim();
                    if (!val) return;
                    setForm((prev) => ({
                      ...prev,
                      dietaryPreferences: [...new Set([...(prev.dietaryPreferences ?? []), val])],
                    }));
                    setOtherDiet("");
                  }}
                  sx={{ borderRadius: 100, borderColor: tokens.border, color: tokens.muted }}
                >
                  Add
                </Button>
              </Box>

              {/* Show custom (non-predefined) values as removable chips */}
              {(form.dietaryPreferences ?? [])
                .filter((v) => !(DIETARY_OPTIONS as readonly string[]).includes(v))
                .map((custom) => (
                  <Chip
                    key={custom}
                    label={custom}
                    onDelete={() =>
                      setForm((prev) => ({
                        ...prev,
                        dietaryPreferences: (prev.dietaryPreferences ?? []).filter(
                          (v) => v !== custom
                        ),
                      }))
                    }
                    sx={{
                      alignSelf: "flex-start",
                      background: tokens.creamDark,
                      border: `1.5px solid ${tokens.border}`,
                      fontWeight: 500,
                    }}
                  />
                ))}
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {(profile?.dietaryPreferences ?? []).length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: tokens.mutedLight, fontStyle: "italic" }}
                >
                  None set
                </Typography>
              ) : (
                (profile?.dietaryPreferences ?? []).map((pref) => (
                  <Chip
                    key={pref}
                    label={pref}
                    size="small"
                    sx={{
                      background: tokens.orangeGlow,
                      border: `1.5px solid ${tokens.orange}`,
                      color: tokens.orange,
                      fontWeight: 600,
                      fontSize: "0.8125rem",
                    }}
                  />
                ))
              )}
            </Box>
          )}
        </Box>

        {editing && (
          <Box sx={{ display: "flex", gap: 1.5, mb: 4 }}>
            <Button variant="contained" onClick={handleSave} disabled={saving} sx={{ flex: 1 }}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setEditing(false);
                setForm(profile ?? {});
              }}
              sx={{ borderRadius: 100, borderColor: tokens.border, color: tokens.muted }}
            >
              Cancel
            </Button>
          </Box>
        )}

        <Divider sx={{ mb: 4 }} />

        {/* Event history */}
        <SectionLabel>Events I've Attended</SectionLabel>

        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={72} sx={{ borderRadius: "12px" }} />
            ))}
          </Box>
        ) : rsvps.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: tokens.muted }}>
            <CelebrationRoundedIcon sx={{ fontSize: 40, mb: 1.5, opacity: 0.3 }} />
            <Typography>No events yet — RSVP to one!</Typography>
            <Link href="/events" style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ mt: 2, borderRadius: 100, borderColor: tokens.border, color: tokens.muted }}
              >
                Browse Events
              </Button>
            </Link>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {rsvps.map((rsvp) => (
              <Box
                key={rsvp._id}
                sx={{
                  background: "#fff",
                  border: `1.5px solid ${tokens.border}`,
                  borderRadius: "14px",
                  p: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CelebrationRoundedIcon sx={{ color: tokens.orange, flexShrink: 0 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      fontSize: "0.9375rem",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {/* eventTitle would be joined from the events collection — see rsvps API below */}
                    {(rsvp as any).eventTitle ?? rsvp.eventId}
                  </Typography>
                  <Typography variant="caption" sx={{ color: tokens.muted }}>
                    RSVP'd {dayjs(rsvp.createdAt).format("MMM D, YYYY")}
                    {rsvp.totalCount > 1 && ` · +${rsvp.totalCount - 1} guests`}
                  </Typography>
                </Box>
                <Link href={`/events/${rsvp.eventId}`} style={{ textDecoration: "none" }}>
                  <Button
                    size="small"
                    sx={{
                      borderRadius: 100,
                      color: tokens.muted,
                      fontSize: "0.75rem",
                      flexShrink: 0,
                    }}
                  >
                    View →
                  </Button>
                </Link>
              </Box>
            ))}
          </Box>
        )}
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
        mb: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}

// Profile page is client-rendered — session loaded client-side
export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

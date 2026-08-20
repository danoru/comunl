import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

import { getIntents, getMutualIds } from "../../src/lib/db";
import { getSiteConfig, isMainSite } from "../../src/models";
import type { SerializedIntent } from "../../src/models";
import { tokens } from "../../src/styles/theme";
import { authOptions } from "../api/auth/[...nextauth]";

const YELLOW_BG = "rgba(255,209,102,0.28)";
const YELLOW_INK = "#8A6400";
const GREEN_INK = "#047A5B";

interface RallyPageProps {
  initialIntents: SerializedIntent[];
}

export default function RallyPage({ initialIntents }: RallyPageProps) {
  const [intents, setIntents] = useState(initialIntents);
  const [error, setError] = useState("");
  const { data: session } = useSession();
  const sessionUserId = ((session as any)?.userId as string | undefined) ?? null;
  const isAdmin = (session as any)?.isAdmin ?? false;

  function replaceIntent(updated: SerializedIntent) {
    setIntents((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  return (
    <>
      <Head>
        <title>Rally — Comunl</title>
        <meta content="What your friends are dreaming up" name="description" />
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 1 }} variant="h1">
            Rally
          </Typography>
          <Typography sx={{ mt: 0.5 }} variant="body2">
            What your friends are dreaming up — jump on anything that sounds fun
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ borderRadius: "12px", mb: 2 }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        <Composer
          onCreated={(intent) => setIntents((prev) => [intent, ...prev])}
          onError={setError}
        />

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.75, mt: 2.5 }}>
          {intents.length === 0 && (
            <Box sx={{ color: tokens.muted, py: 8, textAlign: "center" }}>
              <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>💭</Typography>
              <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Nothing brewing yet</Typography>
              <Typography variant="body2">
                Been meaning to try that new ramen spot? Say so — someone&apos;s probably in.
              </Typography>
            </Box>
          )}
          {intents.map((intent) => (
            <RallyCard
              key={intent.id}
              intent={intent}
              isAdmin={isAdmin}
              sessionUserId={sessionUserId}
              onError={setError}
              onRemove={(id) => setIntents((prev) => prev.filter((i) => i.id !== id))}
              onUpdate={replaceIntent}
            />
          ))}
        </Box>
      </Box>
    </>
  );
}

function Composer({
  onCreated,
  onError,
}: {
  onCreated: (intent: SerializedIntent) => void;
  onError: (message: string) => void;
}) {
  const [activity, setActivity] = useState("");
  const [place, setPlace] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const [friendsOnly, setFriendsOnly] = useState(false);
  const [showPlace, setShowPlace] = useState(false);
  const [showTimeframe, setShowTimeframe] = useState(false);
  const [posting, setPosting] = useState(false);

  async function post() {
    if (!activity.trim()) return;
    setPosting(true);
    onError("");
    try {
      const res = await fetch("/api/intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activity: activity.trim(),
          place: place.trim() || null,
          timeframe: timeframe.trim() ? { label: timeframe.trim() } : null,
          visibility: friendsOnly ? "friends" : "public",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message ?? "Couldn't post that — try again");
        return;
      }
      onCreated(data);
      setActivity("");
      setPlace("");
      setTimeframe("");
      setShowPlace(false);
      setShowTimeframe(false);
    } catch {
      onError("Network error — please try again");
    } finally {
      setPosting(false);
    }
  }

  return (
    <Box
      sx={{
        background: "#fff",
        border: `1.5px solid ${tokens.border}`,
        borderRadius: "20px",
        boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 1.25,
        p: "14px 16px",
      }}
    >
      <TextField
        fullWidth
        inputProps={{ maxLength: 200 }}
        placeholder="What do you want to do? (e.g. go to the Getty)"
        size="small"
        value={activity}
        onChange={(e) => setActivity(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post();
        }}
      />
      {showPlace && (
        <TextField
          fullWidth
          inputProps={{ maxLength: 200 }}
          placeholder="Where? (optional)"
          size="small"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
        />
      )}
      {showTimeframe && (
        <TextField
          fullWidth
          inputProps={{ maxLength: 60 }}
          placeholder={'When-ish? (e.g. "this weekend", "sometime in October")'}
          size="small"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
        />
      )}
      <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
        {!showPlace && (
          <Chip
            label="+ Place"
            size="small"
            sx={{ borderStyle: "dashed", color: tokens.muted }}
            variant="outlined"
            onClick={() => setShowPlace(true)}
          />
        )}
        {!showTimeframe && (
          <Chip
            label="+ When-ish"
            size="small"
            sx={{ borderStyle: "dashed", color: tokens.muted }}
            variant="outlined"
            onClick={() => setShowTimeframe(true)}
          />
        )}
        <Chip
          label={friendsOnly ? "Friends only" : "Everyone"}
          size="small"
          sx={
            friendsOnly
              ? { background: "rgba(244,99,30,0.12)", color: tokens.orange, fontWeight: 600 }
              : { color: tokens.muted }
          }
          variant={friendsOnly ? "filled" : "outlined"}
          onClick={() => setFriendsOnly((prev) => !prev)}
        />
        <Button
          disabled={posting || !activity.trim()}
          size="small"
          sx={{ ml: "auto" }}
          variant="contained"
          onClick={post}
        >
          {posting ? "Posting…" : "Post it"}
        </Button>
      </Box>
    </Box>
  );
}

function RallyCard({
  intent,
  sessionUserId,
  isAdmin,
  onUpdate,
  onRemove,
  onError,
}: {
  intent: SerializedIntent;
  sessionUserId: string | null;
  isAdmin: boolean;
  onUpdate: (intent: SerializedIntent) => void;
  onRemove: (id: string) => void;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const isAuthor = !!sessionUserId && intent.userId === sessionUserId;
  const isIn = !!sessionUserId && intent.interested.some((i) => i.userId === sessionUserId);
  const isConverted = intent.status === "converted";
  const count = intent.interested.length;

  async function toggleInterest() {
    setBusy(true);
    onError("");
    try {
      const res = await fetch(`/api/intents/${intent.id}/interest`, {
        method: isIn ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.message ?? "Couldn't update — try again");
        return;
      }
      onUpdate(data);
    } catch {
      onError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  async function closeRally() {
    setBusy(true);
    onError("");
    try {
      const res = await fetch(`/api/intents/${intent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "closed" }),
      });
      if (!res.ok) {
        const data = await res.json();
        onError(data.message ?? "Couldn't close this rally");
        return;
      }
      onRemove(intent.id);
    } catch {
      onError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  }

  const makeItHappenHref = {
    pathname: "/events/new",
    query: {
      intentId: intent.id,
      title: intent.activity.charAt(0).toUpperCase() + intent.activity.slice(1),
      ...(intent.place ? { location: intent.place } : {}),
      description:
        (intent.details ? `${intent.details}\n\n` : "") +
        `Started from a rally — ${count} ${count === 1 ? "person is" : "people are"} in.`,
    },
  };

  return (
    <Box
      sx={{
        background: "#fff",
        border: `1.5px solid ${tokens.border}`,
        borderRadius: "20px",
        boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
        opacity: isConverted ? 0.92 : 1,
        p: "16px",
      }}
    >
      <Box sx={{ alignItems: "flex-start", display: "flex", gap: 1.5 }}>
        {intent.authorHandle ? (
          <Link href={`/profile/${intent.authorHandle}`} style={{ textDecoration: "none" }}>
            <Avatar src={intent.authorImage ?? undefined} sx={{ height: 40, width: 40 }}>
              {intent.authorName[0]?.toUpperCase()}
            </Avatar>
          </Link>
        ) : (
          <Avatar src={intent.authorImage ?? undefined} sx={{ height: 40, width: 40 }}>
            {intent.authorName[0]?.toUpperCase()}
          </Avatar>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: "0.95rem", lineHeight: 1.4 }}>
            {intent.authorHandle ? (
              <Link
                href={`/profile/${intent.authorHandle}`}
                style={{ color: "inherit", textDecoration: "none" }}
              >
                <strong>{intent.authorName}</strong>
              </Link>
            ) : (
              <strong>{intent.authorName}</strong>
            )}{" "}
            {isConverted ? "wanted to" : "wants to"} {intent.activity}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
            {intent.visibility === "friends" && (
              <Chip
                label="FRIENDS"
                size="small"
                sx={{
                  background: "rgba(244,99,30,0.12)",
                  color: tokens.orange,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              />
            )}
            {intent.timeframe && (
              <Chip
                label={intent.timeframe.label.toUpperCase()}
                size="small"
                sx={{
                  background: YELLOW_BG,
                  color: YELLOW_INK,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                }}
              />
            )}
            {intent.place && (
              <Chip
                label={intent.place}
                size="small"
                sx={{
                  background: "rgba(26,31,58,0.05)",
                  color: tokens.muted,
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              />
            )}
          </Box>
          {intent.details && (
            <Typography sx={{ mt: 0.75 }} variant="body2">
              {intent.details}
            </Typography>
          )}
        </Box>
      </Box>

      {isConverted ? (
        <Box
          sx={{
            alignItems: "center",
            background: tokens.greenBg,
            borderRadius: "14px",
            display: "flex",
            justifyContent: "space-between",
            gap: 1,
            p: "10px 14px",
          }}
        >
          <Typography sx={{ color: GREEN_INK, fontSize: "0.8125rem", fontWeight: 700 }}>
            This is happening 🎉
          </Typography>
          {intent.convertedEventId && (
            <Link href={`/events/${intent.convertedEventId}`} style={{ textDecoration: "none" }}>
              <Typography sx={{ color: tokens.orange, fontSize: "0.8125rem", fontWeight: 600 }}>
                View event →
              </Typography>
            </Link>
          )}
        </Box>
      ) : (
        <Box sx={{ alignItems: "center", display: "flex", gap: 1.25 }}>
          <Box sx={{ display: "flex" }}>
            {intent.interested.slice(0, 4).map((person, i) => (
              <Avatar
                key={person.userId}
                src={person.image ?? undefined}
                sx={{
                  border: "2px solid #fff",
                  fontSize: "0.65rem",
                  height: 26,
                  ml: i === 0 ? 0 : "-8px",
                  width: 26,
                }}
              >
                {person.displayName[0]?.toUpperCase()}
              </Avatar>
            ))}
            {count > 4 && (
              <Avatar
                sx={{
                  background: "rgba(26,31,58,0.08)",
                  border: "2px solid #fff",
                  color: tokens.muted,
                  fontSize: "0.6rem",
                  height: 26,
                  ml: "-8px",
                  width: 26,
                }}
              >
                +{count - 4}
              </Avatar>
            )}
          </Box>
          <Typography sx={{ fontWeight: 600 }} variant="caption">
            {count === 0 ? "Be the first in" : `${count} ${count === 1 ? "is" : "are"} in`}
          </Typography>

          <Box sx={{ alignItems: "center", display: "flex", gap: 1, ml: "auto" }}>
            {isAuthor ? (
              <>
                <Button
                  disabled={busy}
                  size="small"
                  sx={{ color: tokens.muted }}
                  onClick={closeRally}
                >
                  Close
                </Button>
                <Link href={makeItHappenHref} style={{ textDecoration: "none" }}>
                  <Button size="small" variant="contained">
                    Make it happen →
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {isAdmin && (
                  <Button
                    size="small"
                    sx={{ color: tokens.muted }}
                    onClick={async () => {
                      await fetch(`/api/intents/${intent.id}`, { method: "DELETE" });
                      onRemove(intent.id);
                    }}
                  >
                    Remove
                  </Button>
                )}
                <Button
                  disabled={busy}
                  size="small"
                  sx={
                    isIn
                      ? { background: tokens.greenBg, color: GREEN_INK, fontWeight: 600 }
                      : undefined
                  }
                  variant={isIn ? "text" : "outlined"}
                  onClick={toggleInterest}
                >
                  {isIn ? "You're in ✓" : "I'm in"}
                </Button>
              </>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const site = getSiteConfig();
  if (!isMainSite(site)) return { notFound: true };

  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session) {
    return {
      redirect: {
        destination: `/auth/signin?callbackUrl=${encodeURIComponent(context.resolvedUrl)}`,
        permanent: false,
      },
    };
  }

  const userId = ((session as any)?.userId as string | undefined) ?? "";
  const mutualIds = await getMutualIds(site.tenantId, userId);
  const initialIntents = await getIntents(site.tenantId, userId, 50, mutualIds);

  return { props: { initialIntents } };
};

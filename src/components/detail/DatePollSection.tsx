import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import React from "react";

import type { SerializedDatePoll, SerializedDatePollVote, VoteResponse } from "../../models";
import { tokens } from "../../styles/theme";

const YELLOW_BG = "rgba(255,209,102,0.28)";
const YELLOW_INK = "#8A6400";

interface DatePollSectionProps {
  eventId: string;
  poll: SerializedDatePoll;
  initialVotes: SerializedDatePollVote[];
  allowAnonymous: boolean;
  canLock: boolean;
  isSignedIn: boolean;
  sessionName: string | null;
  sessionUserId: string | null;
}

function readParticipantCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)poll_participant=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function DatePollSection({
  eventId,
  poll,
  initialVotes,
  allowAnonymous,
  canLock,
  isSignedIn,
  sessionName,
  sessionUserId,
}: DatePollSectionProps) {
  const router = useRouter();
  const [votes, setVotes] = React.useState(initialVotes);
  const [saving, setSaving] = React.useState(false);
  const [locking, setLocking] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const myVote = React.useMemo(() => {
    if (sessionUserId) return votes.find((v) => v.userId === sessionUserId) ?? null;
    const key = readParticipantCookie();
    return key ? (votes.find((v) => v.participantKey === key) ?? null) : null;
  }, [votes, sessionUserId]);

  const [myResponses, setMyResponses] = React.useState<Record<string, VoteResponse>>(
    () => myVote?.responses ?? {}
  );
  const [displayName, setDisplayName] = React.useState(myVote?.displayName ?? sessionName ?? "");
  const [dirty, setDirty] = React.useState(false);

  const voterCount = votes.length;

  const tallies = poll.options.map((option) => {
    const yes = votes.filter((v) => v.responses[option.optionId] === "yes").length;
    const ifneedbe = votes.filter((v) => v.responses[option.optionId] === "ifneedbe").length;
    return { option, yes, ifneedbe };
  });
  const leadingId =
    voterCount > 0
      ? [...tallies].sort((a, b) => b.yes - a.yes || b.ifneedbe - a.ifneedbe)[0]?.option.optionId
      : null;

  function toggle(optionId: string, response: VoteResponse) {
    setMyResponses((prev) => {
      const next = { ...prev };
      if (next[optionId] === response) delete next[optionId];
      else next[optionId] = response;
      return next;
    });
    setDirty(true);
    setSaved(false);
  }

  async function saveVotes() {
    if (!isSignedIn && !allowAnonymous) {
      signIn("google");
      return;
    }
    if (!displayName.trim()) {
      setError("Add your name so friends know who voted");
      return;
    }
    if (Object.keys(myResponses).length === 0) {
      setError("Mark at least one time");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/${eventId}/poll/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: displayName.trim(), responses: myResponses }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Couldn't save your votes — try again");
        return;
      }
      setVotes((prev) => [...prev.filter((v) => v.participantKey !== data.participantKey), data]);
      setDirty(false);
      setSaved(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  async function lockOption(optionId: string) {
    setLocking(true);
    setError("");
    try {
      const res = await fetch(`/api/${eventId}/poll`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lock", optionId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? "Couldn't lock the date — try again");
        return;
      }
      // The event date just changed server-side — refresh the whole page.
      router.replace(router.asPath);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLocking(false);
    }
  }

  const leading = tallies.find((t) => t.option.optionId === leadingId);

  return (
    <Box
      sx={{
        background: "#fff",
        border: `1.5px solid ${tokens.border}`,
        borderRadius: "20px",
        boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
        p: "16px 18px",
        mb: 2.5,
      }}
    >
      <Box
        sx={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", mb: 1.5 }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: "1.05rem" }}>When works?</Typography>
        <Typography variant="caption">
          {voterCount === 0
            ? "No votes yet — be the first"
            : `${voterCount} ${voterCount === 1 ? "friend" : "friends"} voted`}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {tallies.map(({ option, yes, ifneedbe }) => {
          const isLeading = option.optionId === leadingId && voterCount > 0;
          const start = dayjs(option.start);
          const mine = myResponses[option.optionId];
          return (
            <Box
              key={option.optionId}
              sx={{
                alignItems: "center",
                border: `1.5px solid ${isLeading ? tokens.orange : tokens.border}`,
                background: isLeading ? "rgba(244,99,30,0.04)" : "transparent",
                borderRadius: "16px",
                display: "flex",
                gap: 1.5,
                p: "10px 12px",
              }}
            >
              <Box sx={{ width: 56, flexShrink: 0, textAlign: "center" }}>
                <Typography
                  sx={{
                    fontFamily: '"Bebas Neue", sans-serif',
                    fontSize: "0.8rem",
                    letterSpacing: "0.08em",
                    color: isLeading ? tokens.orange : tokens.muted,
                  }}
                >
                  {start.format("ddd").toUpperCase()}
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", lineHeight: 1.1 }}>
                  {start.format("MMM D")}
                </Typography>
                <Typography variant="caption">{start.format("h A")}</Typography>
              </Box>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ alignItems: "center", display: "flex", gap: 0.75, mb: 0.5 }}>
                  {isLeading && (
                    <Chip
                      label="LEADING"
                      size="small"
                      sx={{
                        background: "rgba(244,99,30,0.12)",
                        color: tokens.orange,
                        fontWeight: 700,
                        fontSize: "0.6rem",
                        height: 18,
                        letterSpacing: "0.06em",
                      }}
                    />
                  )}
                  <Typography sx={{ fontWeight: 600 }} variant="caption">
                    {yes} yes{ifneedbe > 0 ? ` · ${ifneedbe} if need be` : ""}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    background: "rgba(26,31,58,0.06)",
                    borderRadius: 100,
                    display: "flex",
                    height: 6,
                    overflow: "hidden",
                  }}
                >
                  <Box
                    sx={{
                      background: tokens.green,
                      width: voterCount ? `${(yes / voterCount) * 100}%` : 0,
                    }}
                  />
                  <Box
                    sx={{
                      background: tokens.yellow,
                      width: voterCount ? `${(ifneedbe / voterCount) * 100}%` : 0,
                    }}
                  />
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexShrink: 0, gap: 0.75 }}>
                <VoteButton
                  active={mine === "yes"}
                  activeBg={tokens.green}
                  label="✓"
                  onClick={() => toggle(option.optionId, "yes")}
                />
                {poll.allowMaybe && (
                  <VoteButton
                    active={mine === "ifneedbe"}
                    activeBg={tokens.yellow}
                    activeColor={tokens.navy}
                    label="~"
                    onClick={() => toggle(option.optionId, "ifneedbe")}
                  />
                )}
                <VoteButton
                  active={mine === "no"}
                  activeBg="rgba(26,31,58,0.12)"
                  activeColor={tokens.muted}
                  label="✕"
                  onClick={() => toggle(option.optionId, "no")}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      <Typography
        sx={{ color: tokens.mutedLight, display: "block", mt: 1.25, textAlign: "center" }}
        variant="caption"
      >
        tap to vote — ✓ works · ~ if need be · ✕ can&apos;t
      </Typography>

      {!isSignedIn && allowAnonymous && (
        <TextField
          fullWidth
          helperText="No account needed — friends can vote with just a name"
          label="Your name"
          size="small"
          sx={{ mt: 1.5 }}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      )}

      {error && (
        <Typography sx={{ color: "#d32f2f", display: "block", mt: 1 }} variant="caption">
          {error}
        </Typography>
      )}

      <Box sx={{ alignItems: "center", display: "flex", gap: 1.5, mt: 1.5 }}>
        <Button
          disabled={saving || !dirty}
          sx={{ flex: 1 }}
          variant="contained"
          onClick={saveVotes}
        >
          {saving ? "Saving…" : saved && !dirty ? "Votes saved ✓" : "Save my votes"}
        </Button>
      </Box>

      {!isSignedIn && !allowAnonymous && (
        <Typography sx={{ display: "block", mt: 1, textAlign: "center" }} variant="caption">
          This event requires sign-in to vote.
        </Typography>
      )}

      {canLock && leading && (
        <Box
          sx={{
            alignItems: "center",
            background: tokens.creamDark,
            borderRadius: "16px",
            display: "flex",
            gap: 1.5,
            mt: 2,
            p: "12px 16px",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700 }}>
              You&apos;re hosting
            </Typography>
            <Typography variant="caption">
              Lock a date when you&apos;re ready — voting closes and guests can RSVP
            </Typography>
          </Box>
          <Button
            disabled={locking}
            size="small"
            sx={{ flexShrink: 0, ml: "auto", whiteSpace: "nowrap" }}
            variant="contained"
            onClick={() => lockOption(leading.option.optionId)}
          >
            {locking ? "Locking…" : `Lock ${dayjs(leading.option.start).format("MMM D")}`}
          </Button>
        </Box>
      )}

      {voterCount > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
          {votes.map((v) => (
            <Chip
              key={v.participantKey}
              label={v.displayName}
              size="small"
              sx={{ background: YELLOW_BG, color: YELLOW_INK, fontSize: "0.7rem" }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function VoteButton({
  label,
  active,
  activeBg,
  activeColor = "#fff",
  onClick,
}: {
  label: string;
  active: boolean;
  activeBg: string;
  activeColor?: string;
  onClick: () => void;
}) {
  return (
    <Box
      component="button"
      sx={{
        alignItems: "center",
        background: active ? activeBg : "transparent",
        border: active ? "1.5px solid transparent" : `1.5px solid ${tokens.borderStrong}`,
        borderRadius: "50%",
        color: active ? activeColor : tokens.mutedLight,
        cursor: "pointer",
        display: "flex",
        fontFamily: "inherit",
        fontSize: "0.95rem",
        fontWeight: 700,
        height: 40,
        justifyContent: "center",
        p: 0,
        transition: "background 0.15s, color 0.15s",
        width: 40,
        "&:hover": { borderColor: tokens.navy },
        "&:focus-visible": { outline: `2px solid ${tokens.orange}`, outlineOffset: 2 },
      }}
      type="button"
      onClick={onClick}
    >
      {label}
    </Box>
  );
}

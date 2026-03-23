import React from "react";
import Link from "next/link";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

import type { SerializedEvent } from "../../models";
import { tokens } from "../../styles/theme";

// ─── EventCard ────────────────────────────────────────────────────────────────

interface EventCardProps {
  event: SerializedEvent;
}

export function EventCard({ event }: EventCardProps) {
  const isPast = dayjs(event.date).isBefore(dayjs());
  const daysUntil = dayjs(event.date).diff(dayjs(), "day");
  const countdownLabel = isPast
    ? `${Math.abs(daysUntil)}d ago`
    : daysUntil === 0
      ? "Today!"
      : `${daysUntil}d away`;

  return (
    <Link
      href={`/events/${event.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <Card
        sx={{
          display: "flex",
          overflow: "hidden",
          opacity: isPast ? 0.65 : 1,
          cursor: "pointer",
        }}
      >
        <CardActionArea sx={{ display: "flex", alignItems: "stretch" }}>
          {/* Thumbnail */}
          <Box
            sx={{
              width: 100,
              flexShrink: 0,
              background: `linear-gradient(135deg, ${tokens.navy}, ${tokens.orange})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.2rem",
              alignSelf: "stretch",
            }}
          >
            {getEventEmoji(event.title)}
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, p: "14px 16px", minWidth: 0 }}>
            <Box sx={{ display: "flex", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
              <Chip
                label={isPast ? "PAST" : "UPCOMING"}
                size="small"
                sx={{
                  background: isPast ? "rgba(122,127,153,0.1)" : tokens.greenBg,
                  color: isPast ? tokens.muted : tokens.green,
                  fontWeight: 700,
                  fontSize: "0.65rem",
                  letterSpacing: "0.04em",
                }}
              />
              {!isPast && (
                <Chip
                  label={countdownLabel}
                  size="small"
                  sx={{
                    background: tokens.orangeGlow,
                    color: tokens.orange,
                    fontWeight: 600,
                    fontSize: "0.65rem",
                  }}
                />
              )}
            </Box>

            <Typography
              variant="h6"
              sx={{
                fontSize: "1.05rem",
                mb: 0.375,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {event.title}
            </Typography>

            <Typography variant="caption" sx={{ display: "block", mb: 1.25 }}>
              {dayjs(event.date).format("ddd, MMM D · h:mm A")} ·{" "}
              {event.location.replace("--", " / ")}
            </Typography>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="caption"
                sx={{ color: tokens.mutedLight, ml: "auto" }}
              >
                View event →
              </Typography>
            </Box>
          </Box>
        </CardActionArea>
      </Card>
    </Link>
  );
}

// ─── EventList ────────────────────────────────────────────────────────────────

interface EventListProps {
  events: SerializedEvent[];
  showFilters?: boolean;
}

type Filter = "all" | "upcoming" | "past";

export function EventList({ events, showFilters = true }: EventListProps) {
  const [filter, setFilter] = React.useState<Filter>("all");
  const [search, setSearch] = React.useState("");

  const filtered = events
    .filter((e) => {
      if (filter === "upcoming") return dayjs(e.date).isAfter(dayjs());
      if (filter === "past") return dayjs(e.date).isBefore(dayjs());
      return true;
    })
    .filter(
      (e) => !search || e.title.toLowerCase().includes(search.toLowerCase())
    );

  const upcoming = filtered.filter((e) => !dayjs(e.date).isBefore(dayjs()));
  const past = filtered.filter((e) => dayjs(e.date).isBefore(dayjs()));

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "upcoming", label: "🗓 Upcoming" },
    { value: "past", label: "⏪ Past" },
  ];

  return (
    <Box>
      {showFilters && (
        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {FILTERS.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "contained" : "outlined"}
                size="small"
                onClick={() => setFilter(f.value)}
                sx={{
                  borderRadius: 100,
                  px: 2,
                  py: 0.75,
                  fontSize: "0.8125rem",
                  ...(filter !== f.value && {
                    color: tokens.muted,
                    borderColor: tokens.border,
                    "&:hover": { borderColor: tokens.navy },
                  }),
                }}
              >
                {f.label}
              </Button>
            ))}
          </Box>

          <Box
            component="input"
            placeholder="Search events…"
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setSearch(e.target.value)
            }
            sx={{
              width: "100%",
              border: `1.5px solid ${tokens.border}`,
              borderRadius: "10px",
              padding: "10px 16px",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              outline: "none",
              background: "#fff",
              color: tokens.navy,
              "&:focus": { borderColor: tokens.orange },
            }}
          />
        </Box>
      )}

      {upcoming.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {filter === "all" && (
            <SectionDivider label="UPCOMING" count={upcoming.length} />
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </Box>
        </Box>
      )}

      {past.length > 0 && (
        <Box>
          {filter === "all" && (
            <SectionDivider label="PAST EVENTS" count={past.length} />
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {past.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </Box>
        </Box>
      )}

      {filtered.length === 0 && (
        <Box sx={{ textAlign: "center", py: 10, color: tokens.muted }}>
          <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🎈</Typography>
          <Typography>No events found</Typography>
        </Box>
      )}
    </Box>
  );
}

// ─── Section divider ──────────────────────────────────────────────────────────

function SectionDivider({ label, count }: { label: string; count: number }) {
  return (
    <Box
      sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2, mt: 3 }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: "0.875rem",
          letterSpacing: "0.12em",
          color: tokens.muted,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Typography>
      <Chip
        label={count}
        size="small"
        sx={{
          background: tokens.creamDark,
          color: tokens.muted,
          height: 20,
          fontSize: "0.7rem",
        }}
      />
      <Box sx={{ flex: 1, height: "1px", background: tokens.border }} />
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventEmoji(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("halloween") || t.includes("costume")) return "🎃";
  if (t.includes("bbq") || t.includes("barbecue") || t.includes("grill"))
    return "🍖";
  if (t.includes("new year")) return "🥂";
  if (t.includes("christmas") || t.includes("xmas")) return "🎄";
  if (t.includes("birthday")) return "🎂";
  if (t.includes("crawfish") || t.includes("boil")) return "🦞";
  if (t.includes("july") || t.includes("independence")) return "🎆";
  if (t.includes("80s") || t.includes("retro")) return "🕹️";
  return "🎉";
}

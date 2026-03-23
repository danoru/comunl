// pages/events/[eventId]/index.tsx
import React, { useState } from "react";
import Head from "next/head";
import type { GetServerSideProps } from "next";
import dayjs from "dayjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";

import FoodSection from "../../../src/components/detail/FoodSection";
import { GuestList, RSVPBar } from "../../../src/components/detail/GuestList";
import { getEvent, getItems } from "../../../src/lib/db";
import { getSiteConfig } from "../../../src/models";
import type {
  SerializedEvent,
  SerializedItem,
  ItemType,
} from "../../../src/models";
import { tokens } from "../../../src/styles/theme";

const FOOD_CATEGORIES: ItemType[] = [
  "main",
  "side",
  "snack",
  "dessert",
  "drink",
  "supply",
];

const CATEGORY_LABELS: Record<ItemType, string> = {
  main: "Mains",
  side: "Sides",
  snack: "Snacks",
  dessert: "Desserts",
  drink: "Drinks",
  supply: "Supplies",
  guest: "Guests",
  "host-rec": "Host Recommendations",
};

const CATEGORY_ICONS: Record<ItemType, string> = {
  main: "🍖",
  side: "🥗",
  snack: "🍿",
  dessert: "🍰",
  drink: "🍺",
  supply: "🛒",
  guest: "👤",
  "host-rec": "⭐",
};

interface EventDetailPageProps {
  event: SerializedEvent;
  initialItems: SerializedItem[];
}

export default function EventDetailPage({
  event,
  initialItems,
}: EventDetailPageProps) {
  const [items, setItems] = useState<SerializedItem[]>(initialItems);

  const eventDate = dayjs(event.date);
  const now = dayjs();
  const isPast = eventDate.isBefore(now);
  const daysUntil = eventDate.diff(now, "day");

  const humanDate = eventDate.format("dddd, MMMM D, YYYY");
  const timeRange = eventDate.format("h:mm A");
  const shortDate = eventDate.format("MMM D · h:mm A");

  const guests = items.filter((i) => i.itemType === "guest");
  const hostRecs = items.filter((i) => i.itemType === "host-rec");

  const [expandedCats, setExpandedCats] = useState<Set<ItemType>>(
    new Set(
      FOOD_CATEGORIES.filter((cat) => items.some((i) => i.itemType === cat))
    )
  );

  const visibleCats = FOOD_CATEGORIES.filter(
    (cat) => expandedCats.has(cat) || items.some((i) => i.itemType === cat)
  );
  const hiddenCats = FOOD_CATEGORIES.filter(
    (cat) => !expandedCats.has(cat) && !items.some((i) => i.itemType === cat)
  );

  return (
    <>
      <Head>
        <title>{event.title} — Comunl</title>
        <meta name="description" content={event.description || event.title} />
      </Head>

      {/* ── Hero ── */}
      <Box
        sx={{
          height: { xs: 300, sm: 380 },
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          overflow: "hidden",
          background: `linear-gradient(135deg, ${tokens.navy} 0%, #2D1B4E 50%, ${tokens.orange} 100%)`,
        }}
      >
        {/* Flyer as background image */}
        {event.flyer && (
          <Box
            component="img"
            src={event.flyer}
            alt={event.title}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center top",
              opacity: 0.45,
            }}
          />
        )}

        {/* Gradient overlay */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(26,31,58,0.95) 0%, rgba(26,31,58,0.4) 50%, rgba(26,31,58,0.1) 100%)",
          }}
        />

        {/* Back button */}
        <Button
          href="/events"
          component="a"
          size="small"
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            color: "rgba(255,255,255,0.9)",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(8px)",
            borderRadius: 100,
            zIndex: 2,
            "&:hover": { background: "rgba(0,0,0,0.55)" },
          }}
        >
          ← Events
        </Button>

        {/* Title */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            p: { xs: "0 20px 24px", sm: "0 32px 32px" },
          }}
        >
          <Typography
            variant="h1"
            sx={{
              fontSize: "clamp(28px, 7vw, 52px)",
              color: "#fff",
              mb: 0.75,
              lineHeight: 1,
            }}
          >
            {event.title}
          </Typography>
          <Typography
            sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9375rem" }}
          >
            {event.location.replace("--", " / ")}
          </Typography>
        </Box>
      </Box>

      {/* ── Body ── */}
      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2.5, sm: 3 }, pb: 8 }}>
        {/* Info bar */}
        <Box
          sx={{
            background: "#fff",
            borderRadius: "20px",
            p: "16px 20px",
            my: 2.5,
            border: `1.5px solid ${tokens.border}`,
            boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
            display: "flex",
            flexWrap: "wrap",
            gap: "14px 32px",
          }}
        >
          <InfoCell icon="📅" label="Date" value={humanDate} />
          <InfoCell icon="🕔" label="Time" value={timeRange} />
          <InfoCell
            icon="📍"
            label="Location"
            value={event.location.replace("--", " / ")}
            href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
          />
          {!isPast && (
            <InfoCell
              icon="⏰"
              label="Countdown"
              value={daysUntil <= 0 ? "Today!" : `${daysUntil} days away`}
              accent
            />
          )}
          {isPast && (
            <InfoCell
              icon="✅"
              label="Status"
              value={`${Math.abs(daysUntil)} days ago`}
            />
          )}
        </Box>

        {/* Description */}
        {event.description && (
          <Box
            sx={{
              background: tokens.creamDark,
              borderRadius: "16px",
              p: "14px 18px",
              mb: 2.5,
              border: `1.5px solid ${tokens.border}`,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontStyle: "italic",
                fontSize: "0.9375rem",
                lineHeight: 1.7,
              }}
            >
              {event.description}
            </Typography>
          </Box>
        )}

        {/* RSVP bar — upcoming only */}
        {!isPast && (
          <RSVPBar
            eventId={event.id}
            guestCount={guests.length}
            eventTitle={event.title}
            eventDate={shortDate}
            onRSVP={(item) => setItems((prev) => [...prev, item])}
          />
        )}

        {/* Guest list */}
        <SectionTitle>Guest List ({guests.length})</SectionTitle>
        <GuestList guests={guests} />

        {/* Food & drinks */}
        {!event.isGuestOnly && (
          <>
            <SectionTitle>Food & Drinks</SectionTitle>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              {visibleCats.map((cat) => (
                <Grid item xs={12} sm={6} key={cat}>
                  <FoodSection
                    category={cat}
                    items={items}
                    eventId={event.id}
                    onItemAdded={(item) => setItems((prev) => [...prev, item])}
                  />
                </Grid>
              ))}
            </Grid>

            {hiddenCats.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  mb: 1,
                  mt: 0.5,
                }}
              >
                <Typography
                  variant="caption"
                  sx={{ alignSelf: "center", color: tokens.muted }}
                >
                  Add a category:
                </Typography>
                {hiddenCats.map((cat) => (
                  <Button
                    key={cat}
                    variant="outlined"
                    size="small"
                    onClick={() =>
                      setExpandedCats((prev) => new Set([...prev, cat]))
                    }
                    sx={{
                      borderStyle: "dashed",
                      borderRadius: "10px",
                      color: tokens.muted,
                      borderColor: tokens.border,
                      fontSize: "0.8125rem",
                      "&:hover": {
                        borderColor: tokens.orange,
                        color: tokens.orange,
                      },
                    }}
                  >
                    {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                  </Button>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Host recommendations — now actually renders data! */}
        {hostRecs.length > 0 && (
          <>
            <SectionTitle>Host Recommendations</SectionTitle>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              {hostRecs.map((rec) => (
                <Chip
                  key={rec._id}
                  label={rec.item}
                  sx={{
                    background: "#fff",
                    border: `1.5px solid ${tokens.border}`,
                    borderRadius: "100px",
                    fontWeight: 500,
                    fontSize: "0.875rem",
                    height: 36,
                    px: 0.5,
                  }}
                />
              ))}
            </Box>
          </>
        )}
      </Box>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="h3"
      sx={{
        fontSize: "1.375rem",
        letterSpacing: "0.04em",
        color: tokens.navy,
        mt: 3.5,
        mb: 1.75,
      }}
    >
      {children}
    </Typography>
  );
}

function InfoCell({
  icon,
  label,
  value,
  href,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
  accent?: boolean;
}) {
  const content = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box sx={{ fontSize: "1.25rem", flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography
          variant="caption"
          sx={{
            display: "block",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            mb: 0.125,
          }}
        >
          {label}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: accent ? tokens.orange : tokens.navy,
          }}
        >
          {value}
        </Typography>
      </Box>
    </Box>
  );

  return href ? (
    <Box
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      sx={{ textDecoration: "none", "&:hover": { opacity: 0.8 } }}
    >
      {content}
    </Box>
  ) : (
    content
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async ({ params }) => {
  const eventId = params?.eventId as string;
  const site = getSiteConfig();

  const [event, initialItems] = await Promise.all([
    getEvent(site.tenantId, eventId),
    getItems(site.tenantId, eventId),
  ]);

  if (!event) return { notFound: true };

  return { props: { event, initialItems } };
};

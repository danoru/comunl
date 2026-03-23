import React from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";

import { EventList } from "../src/components/events/EventCard";
import { getEvents, getFeaturedEvents } from "../src/lib/db";
import { getSiteConfig } from "../src/models";
import type { SerializedEvent } from "../src/models";
import { tokens } from "../src/styles/theme";

interface HomePageProps {
  featuredEvents: SerializedEvent[];
  allEvents: SerializedEvent[];
  isInstance: boolean;
  siteName: string;
}

export default function HomePage({
  featuredEvents,
  allEvents,
  isInstance,
  siteName,
}: HomePageProps) {
  const featured = featuredEvents[0] ?? null;

  return (
    <>
      <Head>
        <title>{isInstance ? siteName : "Comunl"}</title>
        <meta
          name="description"
          content={
            isInstance
              ? `Events hosted by ${siteName}`
              : "Plan parties, track RSVPs, coordinate who's bringing what."
          }
        />
      </Head>

      {isInstance ? (
        <InstanceHero featured={featured} siteName={siteName} />
      ) : (
        <ProductHero />
      )}

      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        {isInstance && (
          <Box sx={{ mb: 3 }}>
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
              {siteName.toUpperCase()}
            </Typography>
            <Typography
              variant="h2"
              sx={{ fontSize: "clamp(32px, 7vw, 48px)" }}
            >
              All Events
            </Typography>
          </Box>
        )}
        <EventList events={allEvents} />
      </Box>

      {!isInstance && <FeaturesSection />}
    </>
  );
}

// ─── Instance hero ────────────────────────────────────────────────────────────

function InstanceHero({
  featured,
  siteName,
}: {
  featured: SerializedEvent | null;
  siteName: string;
}) {
  const now = new Date();
  const eventDate = featured ? new Date(featured.date) : null;
  const isPast = eventDate ? eventDate < now : false;
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Box
      component="section"
      sx={{
        background: tokens.navy,
        minHeight: { xs: "80svh", sm: "70svh" },
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        px: 3,
        py: { xs: 8, sm: 10 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 55% 45% at 15% 60%, rgba(244,99,30,0.22), transparent 70%),
                       radial-gradient(ellipse 40% 50% at 85% 25%, rgba(255,107,157,0.16), transparent 60%)`,
        }}
      />

      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: "0.3em",
            color: tokens.orange,
            display: "block",
            mb: 2,
          }}
        >
          ✦ {siteName.toUpperCase()} ✦
        </Typography>

        <Typography
          variant="h1"
          sx={{ fontSize: "clamp(52px, 14vw, 100px)", color: "#fff", mb: 0.5 }}
        >
          {featured?.title ?? "No Upcoming Events"}
        </Typography>

        {featured && (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "center",
                flexWrap: "wrap",
                mb: 3.5,
                mt: 2,
              }}
            >
              <Chip
                label={`📅 ${new Date(featured.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
                sx={{
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                }}
              />
              <Chip
                label={`📍 ${featured.location.replace("--", " / ")}`}
                sx={{
                  background: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                }}
              />
              {!isPast && (
                <Chip
                  label={`⏰ ${daysUntil === 0 ? "Today!" : `${daysUntil} days away`}`}
                  sx={{
                    background: "rgba(244,99,30,0.25)",
                    color: tokens.orangeLight,
                  }}
                />
              )}
            </Box>

            <Box
              sx={{
                display: "flex",
                gap: 1.5,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <Link
                href={`/events/${featured.id}`}
                style={{ textDecoration: "none" }}
              >
                <Button variant="contained" size="large">
                  RSVP Now →
                </Button>
              </Link>
              <Link href="/events" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{
                    color: "#fff",
                    borderColor: "rgba(255,255,255,0.3)",
                    "&:hover": { borderColor: "#fff" },
                  }}
                >
                  All Events
                </Button>
              </Link>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// ─── Product hero ─────────────────────────────────────────────────────────────

function ProductHero() {
  return (
    <Box
      component="section"
      sx={{
        background: tokens.navy,
        minHeight: "100svh",
        display: "flex",
        alignItems: "flex-end",
        px: { xs: 3, sm: 6 },
        py: { xs: 8, sm: 10 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background: `radial-gradient(ellipse 55% 45% at 15% 60%, rgba(244,99,30,0.22), transparent 70%),
                       radial-gradient(ellipse 40% 50% at 85% 25%, rgba(255,107,157,0.16), transparent 60%)`,
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1, maxWidth: 480 }}>
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            letterSpacing: "0.3em",
            color: tokens.orange,
            display: "block",
            mb: 2,
          }}
        >
          ✦ COMMUNITY EVENT PLANNING ✦
        </Typography>
        <Typography
          variant="h1"
          sx={{ fontSize: "clamp(64px, 14vw, 120px)", color: "#fff", mb: 2 }}
        >
          BRING{" "}
          <Box component="span" sx={{ color: tokens.yellow }}>
            PEOPLE TOGETHER
          </Box>
        </Typography>
        <Typography
          sx={{
            fontFamily: '"Playfair Display", serif',
            fontStyle: "italic",
            fontSize: "1.125rem",
            color: "rgba(255,255,255,0.55)",
            lineHeight: 1.7,
            mb: 4,
          }}
        >
          Plan parties. Track RSVPs. Coordinate who's bringing what. No accounts
          required for guests.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Link href="/events/new" style={{ textDecoration: "none" }}>
            <Button variant="contained" size="large">
              Create an Event →
            </Button>
          </Link>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <Button
              variant="outlined"
              size="large"
              sx={{
                color: "#fff",
                borderColor: "rgba(255,255,255,0.3)",
                "&:hover": { borderColor: "#fff" },
              }}
            >
              See Demo
            </Button>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🎟️",
    bg: "#FFF0E8",
    title: "One-tap RSVPs",
    desc: "Guests confirm with a single tap. No app required.",
  },
  {
    icon: "🥘",
    bg: "#E8FFF6",
    title: "Potluck Coordination",
    desc: "Everyone claims what they're bringing. No duplicates.",
  },
  {
    icon: "📣",
    bg: "#FFF8E0",
    title: "Event Updates",
    desc: "Notify guests of changes instantly.",
  },
  {
    icon: "🗓️",
    bg: "#F0EEFF",
    title: "Event History",
    desc: "All your past parties in one place.",
  },
  {
    icon: "🔗",
    bg: "#E8F4FF",
    title: "Shareable Link",
    desc: "One URL is all guests need.",
  },
  {
    icon: "🏷️",
    bg: "#FFE8F5",
    title: "Your Own Domain",
    desc: "Host on a custom domain like cody.party.",
  },
];

function FeaturesSection() {
  return (
    <Box
      sx={{
        maxWidth: 1040,
        mx: "auto",
        px: { xs: 2.5, sm: 4 },
        py: { xs: 7, sm: 10 },
      }}
    >
      <Typography
        variant="caption"
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          letterSpacing: "0.25em",
          color: tokens.orange,
          display: "block",
          mb: 1.5,
        }}
      >
        WHY COMUNL
      </Typography>
      <Typography
        variant="h2"
        sx={{ fontSize: "clamp(36px, 7vw, 56px)", mb: 6 }}
      >
        Everything your
        <br />
        party needs.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 2.25,
        }}
      >
        {FEATURES.map((f) => (
          <Box
            key={f.title}
            sx={{
              background: "#fff",
              borderRadius: "20px",
              p: 3.5,
              border: `1.5px solid ${tokens.border}`,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: "0 12px 40px rgba(26,31,58,0.12)",
              },
            }}
          >
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                background: f.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.375rem",
                mb: 2,
              }}
            >
              {f.icon}
            </Box>
            <Typography variant="h6" sx={{ mb: 0.75 }}>
              {f.title}
            </Typography>
            <Typography variant="body2">{f.desc}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Data fetching ────────────────────────────────────────────────────────────

export const getServerSideProps: GetServerSideProps = async () => {
  const site = getSiteConfig();

  const [featuredEvents, allEvents] = await Promise.all([
    getFeaturedEvents(site.tenantId),
    getEvents(site.tenantId),
  ]);

  return {
    props: {
      featuredEvents,
      allEvents,
      isInstance: site.isInstance,
      siteName: site.name,
    },
  };
};

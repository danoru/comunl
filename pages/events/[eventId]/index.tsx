import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import { parse as parseCookies } from "cookie";
import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { useSession } from "next-auth/react";
import dayjs from "dayjs";

import OpenGraph from "../../../src/components/OpenGraph";
import EnvelopeOverlay from "../../../src/components/events/EnvelopeOverlay";
import FoodSection from "../../../src/components/detail/FoodSection";
import { GuestList, RSVPBar } from "../../../src/components/detail/GuestList";
import ShareButton from "../../../src/components/detail/ShareButton";
import CommentSection from "../../../src/components/detail/CommentSection";
import PhotoAlbum from "../../../src/components/detail/PhotoAlbum";
import EventLocked from "../../../src/components/detail/EventLocked";
import HostRecsWishlist from "../../../src/components/detail/HostRecsWishlist";

import {
  getDietaryAlerts,
  getEvent,
  getItems,
  getGuests,
  getGuestCount,
  getComments,
  getTenant,
  getPhotos,
} from "../../../src/lib/db";
import { getSiteConfig, resolveAnonymousGuests } from "../../../src/models";
import type {
  SerializedEvent,
  SerializedItem,
  SerializedGuest,
  SerializedComment,
  ItemType,
} from "../../../src/models";
import { tokens } from "../../../src/styles/theme";

const FOOD_CATEGORIES: ItemType[] = ["main", "side", "snack", "dessert", "drink", "supply"];
const CATEGORY_LABELS: Record<ItemType, string> = {
  main: "Mains",
  side: "Sides",
  snack: "Snacks",
  dessert: "Desserts",
  drink: "Drinks",
  supply: "Supplies",
  "host-rec": "Host Recs",
};
const CATEGORY_ICONS: Record<ItemType, string> = {
  main: "🍖",
  side: "🥗",
  snack: "🍿",
  dessert: "🍰",
  drink: "🍺",
  supply: "🛒",
  "host-rec": "⭐",
};

type EventDetailPageProps =
  | {
      isLocked: true;
      event: { id: string; title: string };
    }
  | {
      isLocked: false;
      event: SerializedEvent;
      initialItems: SerializedItem[];
      initialGuests: SerializedGuest[];
      initialComments: SerializedComment[];
      initialPhotos: SerializedComment[];
      guestCount: number;
      allowAnonymous: boolean;
      showInvite: boolean;
      dietaryAlerts: string[];
    };

export default function EventDetailPage(props: EventDetailPageProps) {
  if (props.isLocked) {
    return (
      <>
        <Head>
          <title>{props.event.title} — Comunl</title>
        </Head>
        <EventLocked eventId={props.event.id} eventTitle={props.event.title} />
      </>
    );
  }

  const {
    event,
    initialItems,
    initialGuests,
    initialComments,
    initialPhotos,
    guestCount,
    allowAnonymous,
    showInvite,
    dietaryAlerts,
  } = props;
  const [items, setItems] = useState<SerializedItem[]>(initialItems);
  const [guests, setGuests] = useState<SerializedGuest[]>(initialGuests);
  const [inviteVisible, setInviteVisible] = useState(showInvite);
  const [total, setTotal] = useState(guestCount);
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;

  const eventDate = dayjs(event.date);
  const now = dayjs();
  const isPast = eventDate.isBefore(now);
  const daysUntil = eventDate.diff(now, "day");
  const humanDate = eventDate.format("dddd, MMMM D, YYYY");
  const timeRange = eventDate.format("h:mm A");
  const shortDate = eventDate.format("MMM D · h:mm A");

  const hostRecs = items.filter((i) => i.itemType === "host-rec");
  const [expandedCats, setExpandedCats] = useState<Set<ItemType>>(
    new Set(FOOD_CATEGORIES.filter((cat) => items.some((i) => i.itemType === cat)))
  );
  const visibleCats = FOOD_CATEGORIES.filter(
    (cat) => expandedCats.has(cat) || items.some((i) => i.itemType === cat)
  );
  const hiddenCats = FOOD_CATEGORIES.filter(
    (cat) => !expandedCats.has(cat) && !items.some((i) => i.itemType === cat)
  );

  function handleRSVP(guest: SerializedGuest) {
    setGuests((prev) => [...prev, guest]);
    setTotal((prev) => prev + guest.totalCount);
  }

  return (
    <>
      <Head>
        <title>{event.title} — Comunl</title>
        <meta name="description" content={event.description || event.title} />
      </Head>
      <OpenGraph
        description={event.description || `${event.title} · ${event.location}`}
        image={`/api/og/${event.id}`}
        title={event.title}
        type="article"
        url={`/events/${event.id}`}
      />

      {inviteVisible && (
        <EnvelopeOverlay eventTitle={event.title} onReveal={() => setInviteVisible(false)} />
      )}

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
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to top, rgba(26,31,58,0.95) 0%, rgba(26,31,58,0.4) 50%, rgba(26,31,58,0.1) 100%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 16,
            left: 16,
            right: 16,
            display: "flex",
            justifyContent: "space-between",
            zIndex: 2,
          }}
        >
          <Button
            href="/events"
            component="a"
            size="small"
            sx={{
              color: "rgba(255,255,255,0.9)",
              background: "rgba(0,0,0,0.35)",
              backdropFilter: "blur(8px)",
              borderRadius: 100,
            }}
          >
            ← Events
          </Button>
          {isAdmin && (
            <Link href={`/events/${event.id}/admin`} style={{ textDecoration: "none" }}>
              <Button
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  background: "rgba(0,0,0,0.35)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 100,
                }}
              >
                ⚙ Admin
              </Button>
            </Link>
          )}
        </Box>

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
          <Typography sx={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9375rem" }}>
            {event.location.replace("--", " / ")}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2.5, sm: 3 }, pb: 8 }}>
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
            <InfoCell icon="✅" label="Status" value={`${Math.abs(daysUntil)} days ago`} />
          )}
          <Box sx={{ ml: "auto", alignSelf: "center" }}>
            <ShareButton title={event.title} />
          </Box>
        </Box>

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

        {!isPast && (
          <RSVPBar
            eventId={event.id}
            totalCount={total}
            eventTitle={event.title}
            eventDate={shortDate}
            allowAnonymous={allowAnonymous}
            onRSVP={handleRSVP}
          />
        )}

        <SectionTitle>
          Guest List ({total} {total === 1 ? "person" : "people"})
        </SectionTitle>
        <GuestList guests={guests} totalCount={total} />

        {!event.isGuestOnly && (
          <>
            <SectionTitle>Food & Drinks</SectionTitle>
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              {visibleCats.map((cat) => (
                <Grid size={{ xs: 12, sm: 6 }} key={cat}>
                  <FoodSection
                    category={cat}
                    items={items}
                    eventId={event.id}
                    dietaryAlerts={dietaryAlerts}
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
                <Typography variant="caption" sx={{ alignSelf: "center", color: tokens.muted }}>
                  Add a category:
                </Typography>
                {hiddenCats.map((cat) => (
                  <Button
                    key={cat}
                    variant="outlined"
                    size="small"
                    onClick={() => setExpandedCats((prev) => new Set([...prev, cat]))}
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

        {hostRecs.length > 0 && (
          <>
            <SectionTitle>Host Recommendations</SectionTitle>
            <HostRecsWishlist eventId={event.id} items={items} onChange={setItems} />
          </>
        )}
        <Divider sx={{ my: 4 }} />
        {initialPhotos.length > 0 && (
          <>
            <SectionTitle>📸 Photo Album</SectionTitle>
            <PhotoAlbum comments={initialPhotos} />
          </>
        )}

        <Divider sx={{ my: 4 }} />
        <SectionTitle>Comments</SectionTitle>
        <CommentSection eventId={event.id} initialComments={initialComments} />
      </Box>
    </>
  );
}

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

export const getServerSideProps: GetServerSideProps = async ({ params, req, query }) => {
  const eventId = params?.eventId as string;
  const site = getSiteConfig();

  const event = await getEvent(site.tenantId, eventId);
  if (!event) return { notFound: true };

  // ── Private event access check ────────────────────────────────────────────
  if (event.isPrivate && event.inviteCode) {
    const cookies = parseCookies(req.headers.cookie ?? "");
    const cookieName = `invite_${eventId}`;
    const submitted = cookies[cookieName]?.toUpperCase();
    const valid = submitted === event.inviteCode.toUpperCase();

    if (!valid) {
      // Lock screen: return only the title; the page renders <EventLocked/>.
      return {
        props: {
          isLocked: true,
          event: { id: event.id, title: event.title },
        },
      };
    }
  }

  // ── Full data fetch for unlocked events ───────────────────────────────────
  const [
    initialItems,
    initialGuests,
    initialComments,
    initialPhotos,
    guestCount,
    tenant,
    dietaryAlerts,
  ] = await Promise.all([
    getItems(site.tenantId, eventId),
    getGuests(site.tenantId, eventId),
    getComments(site.tenantId, eventId),
    getPhotos(site.tenantId, eventId),
    getGuestCount(site.tenantId, eventId),
    getTenant(site.tenantId),
    event.isGuestOnly ? Promise.resolve([]) : getDietaryAlerts(site.tenantId, eventId),
  ]);

  const tenantDefault = tenant?.allowAnonymousGuests ?? true;
  const allowAnonymous = resolveAnonymousGuests(event, tenantDefault);

  return {
    props: {
      isLocked: false,
      event,
      initialItems,
      initialGuests,
      initialPhotos,
      initialComments,
      guestCount,
      allowAnonymous,
      showInvite: query?.invite === "true",
      dietaryAlerts,
    },
  };
};

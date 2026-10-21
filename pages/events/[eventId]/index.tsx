import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { parse as parseCookies } from "cookie";
import dayjs from "dayjs";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React, { useState } from "react";

import CommentSection from "../../../src/components/detail/CommentSection";
import DatePollSection from "../../../src/components/detail/DatePollSection";
import EventLocked from "../../../src/components/detail/EventLocked";
import FoodSection from "../../../src/components/detail/FoodSection";
import { GuestList, RSVPBar } from "../../../src/components/detail/GuestList";
import HostRecsWishlist from "../../../src/components/detail/HostRecsWishlist";
import PhotoAlbum from "../../../src/components/detail/PhotoAlbum";
import ShareButton from "../../../src/components/detail/ShareButton";
import EnvelopeOverlay from "../../../src/components/events/EnvelopeOverlay";
import OpenGraph from "../../../src/components/OpenGraph";
import {
  getDietaryAlerts,
  getEvent,
  getItems,
  getGuests,
  getGuestCount,
  getComments,
  getTenant,
  getPhotos,
  getDatePoll,
  getDatePollVotes,
} from "../../../src/lib/db";
import { getSiteConfig, resolveAnonymousGuests } from "../../../src/models";
import type {
  SerializedEvent,
  SerializedItem,
  SerializedGuest,
  SerializedComment,
  SerializedDatePoll,
  SerializedDatePollVote,
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
      datePoll: SerializedDatePoll | null;
      datePollVotes: SerializedDatePollVote[];
    };

type UnlockedEventProps = Extract<EventDetailPageProps, { isLocked: false }>;

function pluralDays(n: number): string {
  return `${n} ${n === 1 ? "day" : "days"}`;
}

// The locked and unlocked views are separate components so the unlocked view's
// hooks always run in the same order (no hooks after an early return).
export default function EventDetailPage(props: EventDetailPageProps) {
  if (props.isLocked) {
    return (
      <>
        <Head>
          <title>{`${props.event.title} — ${getSiteConfig().name}`}</title>
        </Head>
        <EventLocked eventId={props.event.id} eventTitle={props.event.title} />
      </>
    );
  }
  return <EventDetail {...props} />;
}

function EventDetail(props: UnlockedEventProps) {
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
    datePoll,
    datePollVotes,
  } = props;
  const [items, setItems] = useState<SerializedItem[]>(initialItems);
  const [guests, setGuests] = useState<SerializedGuest[]>(initialGuests);
  const [inviteVisible, setInviteVisible] = useState(showInvite);
  const [total, setTotal] = useState(guestCount);
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;
  const sessionUserId = ((session as any)?.userId as string | undefined) ?? null;
  const canEditEvent =
    isAdmin ||
    (!!sessionUserId &&
      (event.createdBy === sessionUserId ||
        (event.hosts ?? []).includes(sessionUserId) ||
        (event.hostUserIds ?? []).includes(sessionUserId)));

  const isPolling = event.dateStatus === "polling" && !!datePoll && datePoll.status === "open";
  const eventDate = dayjs(event.date);
  const now = dayjs();
  const isPast = !isPolling && eventDate.isBefore(now);
  // Calendar days, not 24h blocks: tomorrow evening is "1 day away", not "Today!".
  const daysUntil = eventDate.startOf("day").diff(now.startOf("day"), "day");
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
        <title>{`${event.title} — ${getSiteConfig().name}`}</title>
        <meta content={event.description || event.title} name="description" />
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
            alt={event.title}
            component="img"
            src={event.flyer}
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
            component="a"
            href="/events"
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
            sx={{
              fontSize: "clamp(28px, 7vw, 52px)",
              color: "#fff",
              mb: 0.75,
              lineHeight: 1,
            }}
            variant="h1"
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
          {isPolling ? (
            <InfoCell accent icon="🗳️" label="Date" value="TBD — vote below" />
          ) : (
            <>
              <InfoCell icon="📅" label="Date" value={humanDate} />
              <InfoCell icon="🕔" label="Time" value={timeRange} />
            </>
          )}
          <InfoCell
            href={`https://maps.google.com/?q=${encodeURIComponent(event.location)}`}
            icon="📍"
            label="Location"
            value={event.location.replace("--", " / ")}
          />
          {!isPast && !isPolling && (
            <InfoCell
              accent
              icon="⏰"
              label="Countdown"
              value={daysUntil <= 0 ? "Today!" : `${pluralDays(daysUntil)} away`}
            />
          )}
          {isPast && (
            <InfoCell
              icon="✅"
              label="Status"
              value={daysUntil === 0 ? "Earlier today" : `${pluralDays(Math.abs(daysUntil))} ago`}
            />
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

        {isPolling && datePoll && (
          <DatePollSection
            allowAnonymous={allowAnonymous}
            canLock={canEditEvent}
            eventId={event.id}
            initialVotes={datePollVotes}
            isSignedIn={!!session}
            poll={datePoll}
            sessionName={session?.user?.name ?? null}
            sessionUserId={sessionUserId}
          />
        )}

        {!isPast && !isPolling && (
          <RSVPBar
            allowAnonymous={allowAnonymous}
            eventDate={shortDate}
            eventId={event.id}
            eventTitle={event.title}
            totalCount={total}
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
            {dietaryAlerts.length > 0 && (
              <Box
                sx={{
                  background: "rgba(234, 179, 8, 0.08)",
                  border: "1.5px solid rgba(234, 179, 8, 0.3)",
                  borderRadius: "10px",
                  p: "8px 12px",
                  mb: 1.5,
                }}
              >
                <Typography sx={{ fontSize: "0.8125rem", lineHeight: 1.5, color: tokens.navy }}>
                  <Box component="span" sx={{ mr: 0.5 }}>
                    ⚠️
                  </Box>
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    Dietary heads-up:{" "}
                  </Box>
                  {dietaryAlerts.join(", ")}
                </Typography>
              </Box>
            )}
            <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
              {visibleCats.map((cat) => (
                <Grid key={cat} size={{ xs: 12, sm: 6 }}>
                  <FoodSection
                    category={cat}
                    eventId={event.id}
                    items={items}
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
                <Typography sx={{ alignSelf: "center", color: tokens.muted }} variant="caption">
                  Add a category:
                </Typography>
                {hiddenCats.map((cat) => (
                  <Button
                    key={cat}
                    size="small"
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
                    variant="outlined"
                    onClick={() => setExpandedCats((prev) => new Set([...prev, cat]))}
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
        {initialPhotos.length > 0 && (
          <>
            <Divider sx={{ my: 4 }} />
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
      sx={{
        fontSize: "1.375rem",
        letterSpacing: "0.04em",
        color: tokens.navy,
        mt: 3.5,
        mb: 1.75,
      }}
      variant="h3"
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
          sx={{
            display: "block",
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            mb: 0.125,
          }}
          variant="caption"
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
      rel="noopener noreferrer"
      sx={{ textDecoration: "none", "&:hover": { opacity: 0.8 } }}
      target="_blank"
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

  const isPolling = event.dateStatus === "polling";
  const [datePoll, datePollVotes] = await Promise.all([
    isPolling ? getDatePoll(site.tenantId, eventId) : Promise.resolve(null),
    isPolling ? getDatePollVotes(site.tenantId, eventId) : Promise.resolve([]),
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
      datePoll,
      datePollVotes,
    },
  };
};

import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import { getServerSession } from "next-auth/next";
import React, { useState } from "react";

import { EventCard } from "../../src/components/events/EventCard";
import { getUserByHandle, getFollowState, getVisibleEvents, getIntents } from "../../src/lib/db";
import { getSiteConfig, isFriend, isMainSite } from "../../src/models";
import type { FollowState, SerializedEvent, SerializedIntent } from "../../src/models";
import { tokens } from "../../src/styles/theme";
import { authOptions } from "../api/auth/[...nextauth]";

interface ProfilePageProps {
  profile: {
    handle: string;
    name: string;
    image: string | null;
    isSelf: boolean;
    limited: boolean;
    city: string | null;
    state: string | null;
  };
  initialFollowState: FollowState;
  hosting: SerializedEvent[];
  rallies: SerializedIntent[];
}

export default function PublicProfilePage({
  profile,
  initialFollowState,
  hosting,
  rallies,
}: ProfilePageProps) {
  const [followState, setFollowState] = useState(initialFollowState);
  const [busy, setBusy] = useState(false);
  const friend = isFriend(followState);

  async function toggleFollow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/users/${profile.handle}/follow`, {
        method: followState.following ? "DELETE" : "POST",
      });
      const data = await res.json();
      if (res.ok) setFollowState(data.followState);
    } catch {
      // leave state as-is; the button stays actionable
    } finally {
      setBusy(false);
    }
  }

  const followLabel = friend
    ? "Friends ✓"
    : followState.following
      ? "Following"
      : followState.followedBy
        ? "Follow back"
        : "Follow";

  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  return (
    <>
      <Head>
        <title>{`${profile.name} (@${profile.handle}) — Comunl`}</title>
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        <Box sx={{ alignItems: "center", display: "flex", gap: 2.5, mb: 3 }}>
          <Avatar
            src={profile.image ?? undefined}
            sx={{ fontSize: "1.5rem", height: 72, width: 72 }}
          >
            {profile.name[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: "clamp(28px, 6vw, 40px)", lineHeight: 1 }} variant="h2">
              {profile.name}
            </Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              @{profile.handle}
              {location ? ` · ${location}` : ""}
            </Typography>
          </Box>
          {!profile.isSelf && (
            <Button
              disabled={busy}
              size="small"
              sx={{ flexShrink: 0, ml: "auto" }}
              variant={followState.following ? "outlined" : "contained"}
              onClick={toggleFollow}
            >
              {followLabel}
            </Button>
          )}
        </Box>

        {friend && (
          <Chip
            label="You're friends — you see each other's friends-only rallies"
            size="small"
            sx={{ background: tokens.greenBg, color: "#047A5B", fontWeight: 600, mb: 3 }}
          />
        )}

        {profile.limited ? (
          <Box
            sx={{
              background: tokens.creamDark,
              borderRadius: "16px",
              color: tokens.muted,
              p: "20px",
              textAlign: "center",
            }}
          >
            <Typography variant="body2">
              {profile.name.split(" ")[0]}&apos;s full profile is visible to friends — follow each
              other to unlock it.
            </Typography>
          </Box>
        ) : (
          <>
            {rallies.length > 0 && (
              <>
                <SectionLabel count={rallies.length} label="OPEN RALLIES" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25, mb: 3 }}>
                  {rallies.map((rally) => (
                    <Box
                      key={rally.id}
                      sx={{
                        background: "#fff",
                        border: `1.5px solid ${tokens.border}`,
                        borderRadius: "16px",
                        p: "12px 16px",
                      }}
                    >
                      <Typography sx={{ fontSize: "0.9375rem" }}>
                        wants to <strong>{rally.activity}</strong>
                      </Typography>
                      <Typography variant="caption">
                        {rally.interested.length === 0
                          ? "No one's in yet"
                          : `${rally.interested.length} ${rally.interested.length === 1 ? "person is" : "people are"} in`}
                        {rally.timeframe ? ` · ${rally.timeframe.label}` : ""}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}

            {hosting.length > 0 && (
              <>
                <SectionLabel count={hosting.length} label="HOSTING" />
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {hosting.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </Box>
              </>
            )}

            {rallies.length === 0 && hosting.length === 0 && (
              <Typography sx={{ color: tokens.muted, py: 4, textAlign: "center" }} variant="body2">
                Nothing public here yet.
              </Typography>
            )}
          </>
        )}
      </Box>
    </>
  );
}

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, mb: 1.5, mt: 1 }}>
      <Typography
        sx={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: "0.875rem",
          letterSpacing: "0.12em",
          color: tokens.muted,
          whiteSpace: "nowrap",
        }}
        variant="caption"
      >
        {label}
      </Typography>
      <Chip
        label={count}
        size="small"
        sx={{ background: tokens.creamDark, color: tokens.muted, fontSize: "0.7rem", height: 20 }}
      />
      <Box sx={{ background: tokens.border, flex: 1, height: "1px" }} />
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

  const viewerId = ((session as any)?.userId as string | undefined) ?? "";
  const handle = context.params?.handle as string;
  const user = await getUserByHandle(site.tenantId, handle);
  if (!user || !user.handle) return { notFound: true };

  const isSelf = user.userId === viewerId;
  const followState = isSelf
    ? { following: false, followedBy: false }
    : await getFollowState(site.tenantId, viewerId, user.userId);

  const visibility = user.profileVisibility ?? "mutual";
  if (visibility === "private" && !isSelf) return { notFound: true };
  const limited = !isSelf && visibility === "mutual" && !isFriend(followState);

  const [hosting, allIntents] = limited
    ? [[], []]
    : await Promise.all([
        getVisibleEvents(site.tenantId, undefined, {
          $or: [{ createdBy: user.userId }, { hosts: user.userId }, { hostUserIds: user.userId }],
          date: { $gte: new Date() },
        }),
        getIntents(site.tenantId, user.userId),
      ]);

  return {
    props: {
      profile: {
        handle: user.handle,
        name: user.name,
        image: user.image ?? null,
        isSelf,
        limited,
        city: limited ? null : (user.city ?? null),
        state: limited ? null : (user.state ?? null),
      },
      initialFollowState: followState,
      hosting,
      rallies: allIntents.filter((i) => i.userId === user.userId && i.status === "open"),
    },
  };
};

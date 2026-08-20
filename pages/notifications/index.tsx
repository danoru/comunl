import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import React from "react";

import { getNotifications, markNotificationsRead } from "../../src/lib/db";
import {
  pushSupported,
  getPushSubscription,
  enablePush,
  disablePush,
} from "../../src/lib/pushClient";
import { getSiteConfig } from "../../src/models";
import type { SerializedNotification } from "../../src/models";
import { tokens } from "../../src/styles/theme";
import { authOptions } from "../api/auth/[...nextauth]";

dayjs.extend(relativeTime);

function subjectHref(subject: SerializedNotification["subject"]): string {
  if (subject.kind === "event") return `/events/${subject.id}`;
  if (subject.kind === "user") return `/profile/${subject.id}`;
  return "/intents";
}

interface NotificationsPageProps {
  notifications: SerializedNotification[];
}

export default function NotificationsPage({ notifications }: NotificationsPageProps) {
  const [pushState, setPushState] = React.useState<"unsupported" | "off" | "on" | "busy">(
    "unsupported"
  );

  React.useEffect(() => {
    if (!pushSupported()) return;
    getPushSubscription()
      .then((sub) => setPushState(sub ? "on" : "off"))
      .catch(() => setPushState("off"));
  }, []);

  async function togglePush() {
    if (pushState === "busy" || pushState === "unsupported") return;
    const was = pushState;
    setPushState("busy");
    if (was === "on") {
      await disablePush();
      setPushState("off");
    } else {
      const result = await enablePush();
      setPushState(result === "enabled" ? "on" : "off");
    }
  }

  return (
    <>
      <Head>
        <title>Notifications — Comunl</title>
      </Head>

      <Box sx={{ maxWidth: 600, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: "clamp(36px, 8vw, 52px)", lineHeight: 1 }} variant="h1">
            Notifications
          </Typography>
        </Box>

        {pushState !== "unsupported" && (
          <Box
            sx={{
              alignItems: "center",
              background: "#fff",
              border: `1.5px solid ${tokens.border}`,
              borderRadius: "16px",
              boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
              display: "flex",
              gap: 1.5,
              mb: 2.5,
              p: "12px 16px",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
                {pushState === "on" ? "Device alerts are on" : "Get alerts on this device"}
              </Typography>
              <Typography variant="caption">
                {pushState === "on"
                  ? "You'll hear about votes, rallies, and locked dates even with the tab closed."
                  : "On iPhone, first add Comunl to your Home Screen (Share → Add to Home Screen)."}
              </Typography>
            </Box>
            <Button
              disabled={pushState === "busy"}
              size="small"
              sx={{ flexShrink: 0, ml: "auto" }}
              variant={pushState === "on" ? "outlined" : "contained"}
              onClick={togglePush}
            >
              {pushState === "busy" ? "…" : pushState === "on" ? "Turn off" : "Enable"}
            </Button>
          </Box>
        )}

        {notifications.length === 0 ? (
          <Box sx={{ color: tokens.muted, py: 8, textAlign: "center" }}>
            <Typography sx={{ fontSize: "3rem", mb: 1.5 }}>🔔</Typography>
            <Typography sx={{ fontWeight: 600, mb: 0.5 }}>Nothing yet</Typography>
            <Typography variant="body2">
              Rally some friends or start a date poll — this is where you&apos;ll hear back.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              background: "#fff",
              border: `1.5px solid ${tokens.border}`,
              borderRadius: "20px",
              boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
              overflow: "hidden",
            }}
          >
            {notifications.map((n, i) => (
              <Link key={n._id} href={subjectHref(n.subject)} style={{ textDecoration: "none" }}>
                <Box
                  sx={{
                    alignItems: "flex-start",
                    background: n.readAt === null ? "rgba(244,99,30,0.04)" : "transparent",
                    borderBottom:
                      i === notifications.length - 1 ? "none" : `1px solid rgba(26,31,58,0.06)`,
                    display: "flex",
                    gap: 1.5,
                    px: 2,
                    py: 1.75,
                    "&:hover": { background: tokens.creamDark },
                  }}
                >
                  <Avatar src={n.actorImage ?? undefined} sx={{ height: 38, width: 38 }}>
                    {n.actorName[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ color: tokens.navy, fontSize: "0.9rem", lineHeight: 1.45 }}>
                      {n.message}
                    </Typography>
                    <Typography sx={{ color: tokens.mutedLight }} variant="caption">
                      {dayjs(n.createdAt).fromNow()}
                    </Typography>
                  </Box>
                  {n.readAt === null && (
                    <Box
                      sx={{
                        background: tokens.orange,
                        borderRadius: "50%",
                        flexShrink: 0,
                        height: 8,
                        ml: "auto",
                        mt: 1,
                        width: 8,
                      }}
                    />
                  )}
                </Box>
              </Link>
            ))}
          </Box>
        )}
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const site = getSiteConfig();
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
  const notifications = await getNotifications(site.tenantId, userId, 100);
  // Visiting the center marks everything read; the page still renders this
  // load's unread state so new items stand out once.
  await markNotificationsRead(site.tenantId, userId);

  return { props: { notifications } };
};

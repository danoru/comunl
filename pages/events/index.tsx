import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { EventList } from "../../src/components/events/EventCard";
import { getSession } from "../../src/lib/auth";
import { getVisibleEvents } from "../../src/lib/db";
import { getSiteConfig } from "../../src/models";
import type { SerializedEvent } from "../../src/models";
import { tokens } from "../../src/styles/theme";

interface EventsPageProps {
  events: SerializedEvent[];
  siteName: string;
  isInstance: boolean;
}

export default function EventsPage({ events, siteName, isInstance }: EventsPageProps) {
  return (
    <>
      <Head>
        <title>{isInstance ? `Events — ${siteName}` : "All Events — Comunl"}</title>
        <meta content={`Browse all events hosted by ${siteName}`} name="description" />
      </Head>

      <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", sans-serif',
                letterSpacing: "0.25em",
                color: tokens.orange,
                display: "block",
                mb: 0.5,
              }}
              variant="caption"
            >
              {isInstance ? siteName.toUpperCase() : "COMUNL"}
            </Typography>
            <Typography sx={{ fontSize: "clamp(36px, 8vw, 56px)", lineHeight: 1 }} variant="h1">
              All Events
            </Typography>
          </Box>

          <Link href="/events/new" style={{ textDecoration: "none" }}>
            <Button sx={{ whiteSpace: "nowrap" }} variant="contained">
              + New Event
            </Button>
          </Link>
        </Box>

        {/* Event list with built-in filtering + search */}
        <EventList events={events} />
      </Box>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const site = getSiteConfig();
  const session = await getSession(context);
  const events = await getVisibleEvents(site.tenantId, {
    userId: (session as any)?.userId as string | undefined,
    isAdmin: (session as any)?.isAdmin ?? false,
  });

  return {
    props: {
      events,
      siteName: site.name,
      isInstance: site.isInstance,
    },
  };
};

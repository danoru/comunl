import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { Card, StatTile, FunnelBars, SimpleTable } from "../../src/components/admin/panels";
import TrafficChart from "../../src/components/admin/TrafficChart";
import VisitorMap from "../../src/components/admin/VisitorMap";
import { adminGuard } from "../../src/lib/auth";
import { getAdminDashboard, getKnownTenants } from "../../src/lib/db";
import { getSiteConfig, MAIN_TENANT_ID } from "../../src/models";
import type { AdminDashboard } from "../../src/models";
import { tokens } from "../../src/styles/theme";

interface AdminPageProps {
  data: AdminDashboard;
  siteName: string;
  tenantId: string;
  tenants: { tenantId: string; events: number }[];
}

function pct(part: number, whole: number): string {
  if (whole === 0) return "—";
  return `${Math.round((part / whole) * 100)}%`;
}

export default function AdminDashboardPage({ data, siteName, tenantId, tenants }: AdminPageProps) {
  const { totals, traffic, trafficSummary, funnel } = data;
  // Rally is exclusive to the Comunl community, so its panels follow the
  // tenant being viewed — not the deploy the admin happens to be signed into.
  const rallyEnabled = tenantId === MAIN_TENANT_ID;

  return (
    <>
      <Head>
        <title>Admin — Comunl</title>
        <meta content="noindex" name="robots" />
      </Head>

      <Box sx={{ maxWidth: 1100, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 5 }}>
        <Box sx={{ alignItems: "baseline", display: "flex", flexWrap: "wrap", gap: 1.5, mb: 3 }}>
          <Typography sx={{ fontSize: "clamp(36px, 7vw, 52px)", lineHeight: 1 }} variant="h1">
            Admin
          </Typography>
          <Chip
            label={siteName}
            size="small"
            sx={{ background: tokens.creamDark, color: tokens.muted, fontWeight: 600 }}
          />
          <Typography sx={{ color: tokens.muted, ml: { sm: "auto" } }} variant="caption">
            last {data.windowDays} days
          </Typography>
        </Box>

        {/* Tenant switcher — this database holds more than one community. */}
        {tenants.length > 1 && (
          <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Typography sx={{ color: tokens.muted, fontWeight: 700 }} variant="caption">
              TENANT
            </Typography>
            {tenants.map((t) => {
              const selected = t.tenantId === tenantId;
              return (
                <Link
                  key={t.tenantId}
                  href={`/admin?tenant=${encodeURIComponent(t.tenantId)}&days=${data.windowDays}`}
                  style={{ textDecoration: "none" }}
                >
                  <Chip
                    label={`${t.tenantId} · ${t.events}`}
                    size="small"
                    sx={{
                      background: selected ? tokens.orange : "#fff",
                      border: `1.5px solid ${selected ? tokens.orange : tokens.border}`,
                      color: selected ? "#fff" : tokens.muted,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  />
                </Link>
              );
            })}
          </Box>
        )}

        {/* ── Community ─────────────────────────────────────────────── */}
        <SectionLabel>Community</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "repeat(2, 1fr)",
              sm: "repeat(3, 1fr)",
              md: "repeat(5, 1fr)",
            },
            mb: 3,
          }}
        >
          <StatTile
            accent
            label="Members"
            sub={`+${totals.newUsers7d} this week`}
            value={totals.users}
          />
          <StatTile
            label="Events"
            sub={`${totals.upcomingEvents} upcoming`}
            value={totals.events}
          />
          <StatTile label="People going" sub="all RSVPs" value={totals.rsvpHeadcount} />
          {rallyEnabled && (
            <StatTile label="Rallies" sub={`${totals.openRallies} open`} value={totals.rallies} />
          )}
          <StatTile label="Date polls" sub="awaiting a date" value={totals.pollingEvents} />
        </Box>

        {/* ── Traffic ───────────────────────────────────────────────── */}
        <SectionLabel>Traffic</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" },
            mb: 2,
          }}
        >
          <StatTile
            label="Page views"
            sub={`last ${data.windowDays}d`}
            value={trafficSummary.views}
          />
          <StatTile
            label="Unique visitors"
            sub="daily-hashed"
            value={trafficSummary.uniqueVisitors}
          />
          <StatTile
            label="Signed-in views"
            sub={pct(trafficSummary.accountViews, trafficSummary.views) + " of traffic"}
            value={trafficSummary.accountViews}
          />
          <StatTile
            label="App-mode views"
            sub="installed to home screen"
            value={trafficSummary.standaloneViews}
          />
        </Box>

        <Box sx={{ mb: 2 }}>
          <Card hint="stacked: members + guests" title="Views per day">
            <TrafficChart data={traffic} />
          </Card>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Card hint="dot size = visits" title="Where visitors are">
            <VisitorMap locations={data.locations} />
          </Card>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            mb: 3,
          }}
        >
          <Card title="Top locations">
            <SimpleTable
              columns={[
                { key: "place", label: "Place" },
                { key: "members", label: "Members", align: "right" },
                { key: "guests", label: "Guests", align: "right" },
                { key: "total", label: "Views", align: "right" },
              ]}
              empty="No visits recorded yet."
              rows={data.locations.slice(0, 10).map((l) => ({
                place: [l.city, l.region, l.country].filter(Boolean).join(", ") || "Unknown",
                members: l.accounts,
                guests: l.guests,
                total: l.total,
              }))}
            />
          </Card>

          <Card title="Top pages">
            <SimpleTable
              columns={[
                { key: "path", label: "Path" },
                { key: "views", label: "Views", align: "right" },
                { key: "uniques", label: "Uniques", align: "right" },
              ]}
              empty="No visits recorded yet."
              rows={data.topPaths.map((p) => ({
                path: p.path,
                views: p.views,
                uniques: p.uniques,
              }))}
            />
          </Card>
        </Box>

        {/* ── The loop ──────────────────────────────────────────────── */}
        <SectionLabel>The loop</SectionLabel>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: rallyEnabled ? "1fr 1fr" : "1fr" },
            mb: 3,
          }}
        >
          {rallyEnabled && (
            <Card hint="all time" title="Rally → event">
              <FunnelBars
                stages={[
                  { label: "Rallies posted", value: funnel.rallies },
                  {
                    label: "Someone joined",
                    value: funnel.withInterest,
                    note: pct(funnel.withInterest, funnel.rallies),
                  },
                  {
                    label: "Became an event",
                    value: funnel.converted,
                    note: pct(funnel.converted, funnel.rallies),
                  },
                  { label: "People going", value: funnel.rsvpsFromRallies },
                ]}
              />
            </Card>
          )}

          <Card hint="all time" title="Date polls">
            <FunnelBars
              stages={[
                { label: "Polls created", value: funnel.pollsCreated },
                {
                  label: "Got votes",
                  value: funnel.pollsVotedOn,
                  note: pct(funnel.pollsVotedOn, funnel.pollsCreated),
                },
                {
                  label: "Date locked",
                  value: funnel.pollsLocked,
                  note: pct(funnel.pollsLocked, funnel.pollsCreated),
                },
              ]}
            />
          </Card>
        </Box>

        {/* ── People & content ──────────────────────────────────────── */}
        <SectionLabel>People &amp; content</SectionLabel>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Card
            hint={`${totals.users} total · ${totals.pushSubscribers} with alerts on`}
            title="Newest members"
          >
            <SimpleTable
              columns={[
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
                { key: "where", label: "Where" },
                { key: "joined", label: "Joined", align: "right" },
              ]}
              empty="No members yet."
              rows={data.recentUsers.map((u) => ({
                name: u.handle ? (
                  <Link href={`/profile/${u.handle}`} style={{ color: tokens.orange }}>
                    {u.name}
                  </Link>
                ) : (
                  u.name
                ),
                email: u.email,
                where: [u.city, u.state].filter(Boolean).join(", ") || "—",
                joined: u.createdAt ? dayjs(u.createdAt).format("MMM D, YYYY") : "—",
              }))}
            />
          </Card>

          <Card title="Recent events">
            <SimpleTable
              columns={[
                { key: "title", label: "Event" },
                { key: "host", label: "Host" },
                { key: "when", label: "When" },
                { key: "going", label: "Going", align: "right" },
              ]}
              empty="No events yet."
              rows={data.recentEvents.map((e) => ({
                title: (
                  <Link href={`/events/${e.id}`} style={{ color: tokens.orange }}>
                    {e.title}
                  </Link>
                ),
                host: e.hostName ?? "—",
                when: e.dateStatus === "polling" ? "Date TBD" : dayjs(e.date).format("MMM D, YYYY"),
                going: e.headcount,
              }))}
            />
          </Card>

          {rallyEnabled && (
            <Card title="Recent rallies">
              <SimpleTable
                columns={[
                  { key: "activity", label: "Wants to" },
                  { key: "author", label: "Who" },
                  { key: "status", label: "Status" },
                  { key: "interested", label: "In", align: "right" },
                ]}
                empty="No rallies yet."
                rows={data.recentRallies.map((r) => ({
                  activity: r.activity,
                  author: r.authorName,
                  status:
                    r.status === "converted"
                      ? "→ event"
                      : r.visibility === "friends"
                        ? "open · friends"
                        : r.status,
                  interested: r.interested,
                }))}
              />
            </Card>
          )}
        </Box>

        <Typography
          sx={{ color: tokens.mutedLight, display: "block", mt: 4, textAlign: "center" }}
          variant="caption"
        >
          Visitor data is anonymous: no IP addresses are stored, only a daily-rotating hash and the
          coarse location Vercel resolves at the edge.
        </Typography>
      </Box>
    </>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      sx={{
        color: tokens.muted,
        display: "block",
        fontFamily: '"Bebas Neue", sans-serif',
        fontSize: "0.875rem",
        letterSpacing: "0.2em",
        mb: 1.5,
        mt: 1,
      }}
      variant="caption"
    >
      {String(children).toUpperCase()}
    </Typography>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const denied = await adminGuard(context);
  if (denied) return denied;

  const site = getSiteConfig();
  const windowParam = parseInt((context.query.days as string) ?? "", 10);
  const windowDays = Number.isFinite(windowParam) ? Math.min(Math.max(windowParam, 7), 90) : 30;

  const tenants = await getKnownTenants();
  // ?tenant= lets one admin deploy inspect any community in the database, but
  // only names that actually exist — never an arbitrary string from the URL.
  const requested = context.query.tenant as string | undefined;
  const tenantId =
    requested && tenants.some((t) => t.tenantId === requested) ? requested : site.tenantId;

  const data = await getAdminDashboard(tenantId, windowDays);

  return {
    props: {
      data,
      siteName: tenantId === site.tenantId ? site.name : tenantId,
      tenantId,
      tenants,
    },
  };
};

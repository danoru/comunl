import fs from "fs";
import path from "path";

import { ImageResponse } from "@vercel/og";
import type { NextApiRequest, NextApiResponse } from "next";

import { getEvent } from "@/lib/db";
import { getSiteConfig } from "@/models";

type FontCache = {
  bebas: ArrayBuffer;
  dmSans: ArrayBuffer;
  dmSansBold: ArrayBuffer;
};

let fontCache: FontCache | null = null;

function loadFonts(): FontCache {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), "public", "fonts");
  const read = (file: string) => {
    const buf = fs.readFileSync(path.join(dir, file));
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
  };
  fontCache = {
    bebas: read("BebasNeue-Regular.ttf"),
    dmSans: read("DMSans-Regular.ttf"),
    dmSansBold: read("DMSans-Bold.ttf"),
  };
  return fontCache;
}

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  const hour = d.getHours();
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${DAYS[d.getDay()]} · ${MONTHS[d.getMonth()]} ${d.getDate()} · ${h12} ${ampm}`;
}

function isEvening(iso: string): boolean {
  return new Date(iso).getHours() >= 17;
}

function pickTitleSize(title: string): number {
  const len = title.length;
  if (len > 36) return 84;
  if (len > 22) return 116;
  return 168;
}

function initialsFor(hosts: string[]): { l: string; bg: string; fg: string }[] {
  const palette = [
    { bg: "#F4631E", fg: "#fff" },
    { bg: "#FFD166", fg: "#1A1F3A" },
    { bg: "#FF6B9D", fg: "#fff" },
    { bg: "#06D6A0", fg: "#0A2A22" },
  ];
  return hosts.slice(0, 3).map((name, i) => ({
    l: (name.trim()[0] || "?").toUpperCase(),
    bg: palette[i % palette.length].bg,
    fg: palette[i % palette.length].fg,
  }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { eventId } = req.query;
    if (typeof eventId !== "string") {
      return res.status(400).json({ error: "eventId required" });
    }

    const site = getSiteConfig();
    const event = await getEvent(site.tenantId, eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const fonts = loadFonts();
    const night = isEvening(event.date);
    const bg = night ? "#1A1F3A" : "#FDF6EC";
    const fg = night ? "#FDF6EC" : "#1A1F3A";
    const avBorder = night ? "#1A1F3A" : "#FDF6EC";
    const primary = site.primaryColor;
    const accent = site.accentColor;
    const mint = "#06D6A0";

    const titleSize = pickTitleSize(event.title);
    const initials = initialsFor(event.hosts);
    const hostLine =
      event.hosts.length === 0
        ? ""
        : event.hosts.length <= 2
          ? `Hosted by ${event.hosts.join(" & ")}`
          : `Hosted by ${event.hosts.slice(0, 2).join(" & ")} +${event.hosts.length - 2}`;

    const radialDay =
      "radial-gradient(900px 600px at 78% 18%, rgba(244,99,30,0.08), transparent 60%), radial-gradient(700px 500px at 12% 95%, rgba(255,209,102,0.10), transparent 65%)";
    const radialNight =
      "radial-gradient(900px 600px at 78% 14%, rgba(255,61,139,0.20), transparent 62%), radial-gradient(700px 520px at 8% 96%, rgba(255,231,76,0.10), transparent 65%)";

    const image = new ImageResponse(
      (
        <div
          style={{
            backgroundColor: bg,
            display: "flex",
            fontFamily: "DM Sans",
            height: "100%",
            position: "relative",
            width: "100%",
          }}
        >
          <div
            style={{
              backgroundImage: night ? radialNight : radialDay,
              display: "flex",
              height: "100%",
              left: 0,
              position: "absolute",
              top: 0,
              width: "100%",
            }}
          />

          <div
            style={{
              bottom: 0,
              display: "flex",
              height: "100%",
              position: "absolute",
              right: 0,
              top: 0,
              width: 430,
            }}
          >
            <div
              style={{
                backgroundColor: primary,
                borderRadius: 36,
                boxShadow: "0 22px 60px rgba(0,0,0,0.18)",
                height: 340,
                position: "absolute",
                right: 60,
                top: 90,
                transform: "rotate(-7deg)",
                width: 280,
              }}
            />
            <div
              style={{
                backgroundColor: accent,
                borderRadius: 999,
                boxShadow: "0 22px 60px rgba(0,0,0,0.18)",
                height: 200,
                position: "absolute",
                right: 240,
                top: 300,
                transform: "rotate(9deg)",
                width: 200,
              }}
            />
            <div
              style={{
                backgroundColor: mint,
                borderRadius: 36,
                boxShadow: "0 22px 60px rgba(0,0,0,0.18)",
                height: 230,
                opacity: 0.92,
                position: "absolute",
                right: 30,
                top: 330,
                transform: "rotate(5deg)",
                width: 160,
              }}
            />
          </div>

          <div
            style={{
              backgroundColor: primary,
              borderRadius: 999,
              height: 14,
              left: 520,
              position: "absolute",
              top: 80,
              width: 14,
            }}
          />
          <div
            style={{
              border: `3px solid ${mint}`,
              borderRadius: 999,
              height: 18,
              left: 880,
              position: "absolute",
              top: 540,
              width: 18,
            }}
          />
          <div
            style={{
              backgroundColor: accent,
              borderRadius: 3,
              height: 14,
              left: 760,
              position: "absolute",
              top: 60,
              transform: "rotate(20deg)",
              width: 14,
            }}
          />
          <div
            style={{
              backgroundColor: mint,
              borderRadius: 999,
              height: 10,
              left: 480,
              position: "absolute",
              top: 540,
              width: 10,
            }}
          />

          <div
            style={{
              bottom: 60,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              left: 64,
              position: "absolute",
              top: 60,
              width: 760,
              zIndex: 3,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex" }}>
                <div
                  style={{
                    alignItems: "center",
                    backgroundColor: primary,
                    borderRadius: 999,
                    boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
                    color: "#fff",
                    display: "flex",
                    fontFamily: "DM Sans",
                    fontSize: 18,
                    fontWeight: 700,
                    gap: 9,
                    letterSpacing: "0.14em",
                    padding: "10px 20px",
                  }}
                >
                  <div
                    style={{
                      backgroundColor: "#fff",
                      borderRadius: 999,
                      height: 8,
                      opacity: 0.85,
                      width: 8,
                    }}
                  />
                  {formatDate(event.date)}
                </div>
              </div>

              <div
                style={{
                  color: fg,
                  display: "flex",
                  fontFamily: "Bebas Neue",
                  fontSize: titleSize,
                  letterSpacing: "0.012em",
                  lineHeight: 0.88,
                  marginTop: 24,
                  maxWidth: 760,
                  textTransform: "uppercase",
                }}
              >
                {event.title}
              </div>

              <div
                style={{
                  alignItems: "center",
                  color: fg,
                  display: "flex",
                  flexWrap: "wrap",
                  fontFamily: "DM Sans",
                  fontSize: 22,
                  fontWeight: 600,
                  gap: 22,
                  marginTop: 24,
                }}
              >
                <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                  <div
                    style={{
                      backgroundColor: primary,
                      borderRadius: 999,
                      height: 12,
                      width: 12,
                    }}
                  />
                  <span>{event.location}</span>
                </div>
                {hostLine && (
                  <>
                    <div
                      style={{
                        backgroundColor: fg,
                        borderRadius: 999,
                        height: 5,
                        opacity: 0.35,
                        width: 5,
                      }}
                    />
                    <div style={{ alignItems: "center", display: "flex", gap: 10 }}>
                      {initials.length > 0 && (
                        <div style={{ display: "flex" }}>
                          {initials.map((a, i) => (
                            <div
                              key={i}
                              style={{
                                alignItems: "center",
                                backgroundColor: a.bg,
                                border: `2px solid ${avBorder}`,
                                borderRadius: 999,
                                color: a.fg,
                                display: "flex",
                                fontFamily: "DM Sans",
                                fontSize: 12,
                                fontWeight: 700,
                                height: 30,
                                justifyContent: "center",
                                marginLeft: i === 0 ? 0 : -8,
                                width: 30,
                              }}
                            >
                              {a.l}
                            </div>
                          ))}
                        </div>
                      )}
                      <span>{hostLine}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              alignItems: "flex-end",
              bottom: 36,
              display: "flex",
              justifyContent: "space-between",
              left: 64,
              position: "absolute",
              right: 64,
              zIndex: 4,
            }}
          >
            <div style={{ display: "flex" }}></div>
            <div
              style={{
                alignItems: "center",
                color: fg,
                display: "flex",
                fontFamily: "Bebas Neue",
                fontSize: 30,
                gap: 9,
                letterSpacing: "0.06em",
                opacity: 0.7,
              }}
            >
              <div
                style={{
                  backgroundColor: primary,
                  borderRadius: 999,
                  height: 11,
                  width: 11,
                }}
              />
              <span>{site.name.toUpperCase()}</span>
            </div>
          </div>
        </div>
      ),
      {
        fonts: [
          { data: fonts.bebas, name: "Bebas Neue", style: "normal", weight: 400 },
          { data: fonts.dmSans, name: "DM Sans", style: "normal", weight: 400 },
          { data: fonts.dmSansBold, name: "DM Sans", style: "normal", weight: 700 },
        ],
        height: 630,
        width: 1200,
      },
    );

    const buffer = Buffer.from(await image.arrayBuffer());
    res.setHeader("Content-Type", "image/png");
    res.setHeader(
      "Cache-Control",
      "public, immutable, no-transform, s-maxage=86400, stale-while-revalidate=604800",
    );
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("[og]", err);
    return res.status(500).json({ error: "Failed to render OG image" });
  }
}

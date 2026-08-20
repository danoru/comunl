import { createHash } from "crypto";

import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { addPageView } from "../../src/lib/db";
import { getSiteConfig, TrackSchema } from "../../src/models";
import type { Device } from "../../src/models";

import { authOptions } from "./auth/[...nextauth]";

// Vercel resolves geo at the edge and passes it on these headers. Absent
// locally and on other hosts — the view is still recorded, just without a map dot.
function header(req: NextApiRequest, name: string): string | null {
  const value = req.headers[name];
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

function parseCoord(value: string | null, limit: number): number | null {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || Math.abs(n) > limit) return null;
  return n;
}

function detectDevice(userAgent: string): Device {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(ua)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "unknown";
}

function clientIp(req: NextApiRequest): string {
  const forwarded = header(req, "x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}

// Daily-rotating salted hash: enough to count repeat visits within a day,
// impossible to reverse to an IP or follow across days.
function visitorHash(req: NextApiRequest): string {
  const secret = process.env.NEXTAUTH_SECRET ?? "comunl-analytics";
  const day = new Date().toISOString().slice(0, 10);
  const ua = (req.headers["user-agent"] as string) ?? "";
  return createHash("sha256")
    .update(`${secret}:${day}:${clientIp(req)}:${ua}`)
    .digest("hex");
}

function referrerHost(referrer: string | undefined, ownHost: string | null): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).host;
    // Same-site navigation isn't a referral worth recording.
    if (!host || host === ownHost) return null;
    return host.slice(0, 255);
  } catch {
    return null;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ message: "Method not allowed" });
  }

  const result = TrackSchema.safeParse(req.body);
  if (!result.success) return res.status(204).end();

  const path = result.data.path;
  // Never track the admin dashboard or API routes — they'd pollute the numbers.
  if (path.startsWith("/admin") || path.startsWith("/api")) return res.status(204).end();

  try {
    const { tenantId } = getSiteConfig();
    const session = await getServerSession(req, res, authOptions);

    await addPageView(tenantId, {
      path,
      referrerHost: referrerHost(result.data.referrer, header(req, "host")),
      userId: ((session as any)?.userId as string | undefined) ?? null,
      visitorHash: visitorHash(req),
      country: header(req, "x-vercel-ip-country")?.slice(0, 2) ?? null,
      region: header(req, "x-vercel-ip-country-region")?.slice(0, 64) ?? null,
      city: header(req, "x-vercel-ip-city")?.slice(0, 128) ?? null,
      lat: parseCoord(header(req, "x-vercel-ip-latitude"), 90),
      lon: parseCoord(header(req, "x-vercel-ip-longitude"), 180),
      device: detectDevice((req.headers["user-agent"] as string) ?? ""),
      standalone: result.data.standalone ?? false,
    });
  } catch (err) {
    // Analytics must never surface an error to the visitor.
    console.warn("[track] failed:", err);
  }

  return res.status(204).end();
}

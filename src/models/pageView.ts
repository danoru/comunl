import { z } from "zod";

// Analytics for the admin dashboard. Deliberately privacy-preserving:
// no raw IP is ever stored — only a daily-rotating salted hash (so repeat
// visits can be counted within a day but a visitor can't be tracked across
// days or identified) plus the coarse geo Vercel already resolves at the edge.
export const DeviceSchema = z.enum(["mobile", "tablet", "desktop", "unknown"]);

export const PageViewSchema = z.object({
  tenantId: z.string(),
  path: z.string().max(512),
  // Host only, never the full referring URL.
  referrerHost: z.string().max(255).nullable().default(null),
  userId: z.string().nullable().default(null),
  visitorHash: z.string(),
  country: z.string().max(2).nullable().default(null),
  region: z.string().max(64).nullable().default(null),
  city: z.string().max(128).nullable().default(null),
  lat: z.number().min(-90).max(90).nullable().default(null),
  lon: z.number().min(-180).max(180).nullable().default(null),
  device: DeviceSchema.default("unknown"),
  // True when opened from the installed PWA rather than a browser tab.
  standalone: z.boolean().default(false),
  createdAt: z.coerce.date().default(() => new Date()),
});

export const TrackSchema = z.object({
  path: z.string().min(1).max(512),
  referrer: z.string().max(2048).optional(),
  standalone: z.boolean().optional(),
});

export type Device = z.infer<typeof DeviceSchema>;
export type PageView = z.infer<typeof PageViewSchema>;
export type Track = z.infer<typeof TrackSchema>;

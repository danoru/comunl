import { z } from "zod";

const HEX_COLOR = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color e.g. #F4631E");

export const TenantSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  primaryColor: HEX_COLOR.default("#F4631E"),
  accentColor: HEX_COLOR.default("#FFD166"),
  allowAnonymousGuests: z.boolean().default(true),
  allowPublicEventCreation: z.boolean().default(false),
});

export type Tenant = z.infer<typeof TenantSchema>;

export const SiteConfigSchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  primaryColor: HEX_COLOR,
  accentColor: HEX_COLOR,
  isInstance: z.boolean(),
  allowAnonymousGuests: z.boolean(),
  allowPublicEventCreation: z.boolean().default(false),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

// The public/main community. Comunl-exclusive features (Rally, the follow
// graph, public profiles) key off this identity — NOT off `isInstance`, so
// that setting NEXT_PUBLIC_TENANT_ID=comunl on the main deploy is harmless.
export const MAIN_TENANT_ID = "comunl";

export function isMainSite(config: Pick<SiteConfig, "tenantId">): boolean {
  return config.tenantId === MAIN_TENANT_ID;
}

export function getSiteConfig(): SiteConfig {
  // Trimmed: a stray space in the deploy's env var would otherwise become a
  // tenant id of its own and silently orphan the site from its data.
  const tenantId = (process.env.NEXT_PUBLIC_TENANT_ID ?? "").trim();
  const isInstance = !!tenantId;
  const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

  return {
    tenantId: tenantId || "comunl",
    name: process.env.NEXT_PUBLIC_SITE_NAME ?? "Comunl",
    primaryColor: HEX_RE.test(process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "")
      ? process.env.NEXT_PUBLIC_PRIMARY_COLOR!
      : "#F4631E",
    accentColor: HEX_RE.test(process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "")
      ? process.env.NEXT_PUBLIC_ACCENT_COLOR!
      : "#FFD166",
    isInstance,
    allowAnonymousGuests: process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS_GUESTS !== "false",
    allowPublicEventCreation:
      process.env.NEXT_PUBLIC_ALLOW_PUBLIC_EVENT_CREATION === "true" || !isInstance,
  };
}

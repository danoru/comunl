import { z } from "zod";

const HEX_COLOR = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color e.g. #F4631E");

export const TenantSchema = z.object({
  tenantId: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  primaryColor: HEX_COLOR.default("#F4631E"),
  accentColor: HEX_COLOR.default("#FFD166"),
});

export type Tenant = z.infer<typeof TenantSchema>;

// Site config resolved from env vars at runtime
export const SiteConfigSchema = z.object({
  tenantId: z.string(),
  name: z.string(),
  primaryColor: HEX_COLOR,
  accentColor: HEX_COLOR,
  isInstance: z.boolean(),
});

export type SiteConfig = z.infer<typeof SiteConfigSchema>;

export function getSiteConfig(): SiteConfig {
  const tenantId = process.env.NEXT_PUBLIC_TENANT_ID ?? "";
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
    isInstance: !!tenantId,
  };
}

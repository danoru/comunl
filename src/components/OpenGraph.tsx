import Head from "next/head";

import { getSiteConfig } from "@/models";

type Props = {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
};

function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  return "http://localhost:3000";
}

function absoluteUrl(pathOrUrl: string, base: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  const cleanBase = base.replace(/\/$/, "");
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${cleanBase}${cleanPath}`;
}

export default function OpenGraph(props: Props) {
  const site = getSiteConfig();
  const base = getSiteUrl();

  const title = props.title ?? site.name;
  const description =
    props.description ??
    (site.isInstance
      ? `Events hosted by ${site.name}`
      : "Plan parties, track RSVPs, coordinate who's bringing what.");
  const image = absoluteUrl(props.image ?? process.env.NEXT_PUBLIC_OG_IMAGE ?? "/og.png", base);
  const url = props.url ? absoluteUrl(props.url, base) : base;

  return (
    <Head>
      <meta key="og:title" content={title} property="og:title" />
      <meta key="og:description" content={description} property="og:description" />
      <meta key="og:image" content={image} property="og:image" />
      <meta key="og:image:width" content="1200" property="og:image:width" />
      <meta key="og:image:height" content="630" property="og:image:height" />
      <meta key="og:image:alt" content={title} property="og:image:alt" />
      <meta key="og:url" content={url} property="og:url" />
      <meta key="og:type" content={props.type ?? "website"} property="og:type" />
      <meta key="og:site_name" content={site.name} property="og:site_name" />
      <meta key="twitter:card" content="summary_large_image" name="twitter:card" />
      <meta key="twitter:title" content={title} name="twitter:title" />
      <meta key="twitter:description" content={description} name="twitter:description" />
      <meta key="twitter:image" content={image} name="twitter:image" />
    </Head>
  );
}

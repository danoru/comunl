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
  const image = absoluteUrl(
    props.image ?? process.env.NEXT_PUBLIC_OG_IMAGE ?? "/og.png",
    base,
  );
  const url = props.url ? absoluteUrl(props.url, base) : base;

  return (
    <Head>
      <meta content={title} key="og:title" property="og:title" />
      <meta content={description} key="og:description" property="og:description" />
      <meta content={image} key="og:image" property="og:image" />
      <meta content="1200" key="og:image:width" property="og:image:width" />
      <meta content="630" key="og:image:height" property="og:image:height" />
      <meta content={title} key="og:image:alt" property="og:image:alt" />
      <meta content={url} key="og:url" property="og:url" />
      <meta content={props.type ?? "website"} key="og:type" property="og:type" />
      <meta content={site.name} key="og:site_name" property="og:site_name" />
      <meta content="summary_large_image" key="twitter:card" name="twitter:card" />
      <meta content={title} key="twitter:title" name="twitter:title" />
      <meta content={description} key="twitter:description" name="twitter:description" />
      <meta content={image} key="twitter:image" name="twitter:image" />
    </Head>
  );
}

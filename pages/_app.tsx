import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { AppProps } from "next/app";
import Head from "next/head";
import { useRouter } from "next/router";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import * as React from "react";

import Layout from "@/components/layout/Layout";
import OpenGraph from "@/components/OpenGraph";
import { getSiteConfig } from "@/models";
import theme from "@/styles/theme";

import "@/styles/global.css";

type AppPropsWithSession = AppProps<{
  session: Session | null;
}>;

export default function MyApp({ Component, pageProps }: AppPropsWithSession) {
  const site = getSiteConfig();

  // PWA: register the service worker (push + installability).
  React.useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  // Analytics beacon: one call per page view, including client-side route changes.
  const router = useRouter();
  React.useEffect(() => {
    function track(path: string) {
      if (path.startsWith("/admin")) return;
      const standalone =
        window.matchMedia?.("(display-mode: standalone)").matches ||
        (window.navigator as { standalone?: boolean }).standalone === true;
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, referrer: document.referrer || undefined, standalone }),
        keepalive: true,
      }).catch(() => undefined);
    }

    track(window.location.pathname);
    router.events.on("routeChangeComplete", track);
    return () => router.events.off("routeChangeComplete", track);
  }, [router.events]);

  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Head>
            <meta charSet="utf-8" />
            <meta content="width=device-width, initial-scale=1" name="viewport" />
            <meta content={theme.palette.secondary.main} name="theme-color" />
            <link href="/favicon.ico" rel="shortcut icon" />
            <link href="/manifest.webmanifest" rel="manifest" />
            <link href="/icons/apple-touch-icon.png" rel="apple-touch-icon" />
            <meta content="yes" name="apple-mobile-web-app-capable" />
            <meta content={site.name} name="apple-mobile-web-app-title" />
            <meta content="black-translucent" name="apple-mobile-web-app-status-bar-style" />
          </Head>
          <OpenGraph />
          <Layout siteConfig={site}>
            <Component {...pageProps} />
          </Layout>
        </LocalizationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

import * as React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import type { Session } from "next-auth";
import { SessionProvider } from "next-auth/react";

import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import Layout from "@/components/layout/Layout";
import theme from "@/styles/theme";
import { getSiteConfig } from "@/models";

import "@/styles/global.css";

type AppPropsWithSession = AppProps<{
  session: Session | null;
}>;

export default function MyApp({ Component, pageProps }: AppPropsWithSession) {
  const site = getSiteConfig();

  return (
    <SessionProvider session={pageProps.session}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Head>
            <meta charSet="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
            <meta name="theme-color" content={theme.palette.secondary.main} />
            <link rel="shortcut icon" href="/favicon.ico" />
          </Head>
          <Layout siteConfig={site}>
            <Component {...pageProps} />
          </Layout>
        </LocalizationProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}

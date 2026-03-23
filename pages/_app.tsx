// pages/_app.tsx
import * as React from "react";
import Head from "next/head";
import type { AppProps } from "next/app";
import { SessionProvider } from "next-auth/react";

import { AppCacheProvider } from "@mui/material-nextjs/v14-pagesRouter";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import Layout from "../src/components/layout/Layout";
import theme from "../src/styles/theme";
import { getSiteConfig } from "../src/models";

import "../src/styles/global.css";

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;
  const site = getSiteConfig();

  return (
    // SessionProvider makes useSession() available in any component
    <SessionProvider session={(pageProps as any).session}>
      <AppCacheProvider {...props}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Head>
              <meta charSet="utf-8" />
              <meta
                name="viewport"
                content="initial-scale=1.0, width=device-width"
              />
              <meta name="theme-color" content={theme.palette.secondary.main} />
              <link rel="shortcut icon" href="/favicon.ico" />
            </Head>
            <Layout siteConfig={site}>
              <Component {...pageProps} />
            </Layout>
          </LocalizationProvider>
        </ThemeProvider>
      </AppCacheProvider>
    </SessionProvider>
  );
}

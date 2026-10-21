import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Head from "next/head";
import { useRouter } from "next/router";
import { signIn } from "next-auth/react";
import React from "react";

import { getSiteConfig } from "../../src/models";
import { tokens } from "../../src/styles/theme";

export default function AuthErrorPage() {
  const router = useRouter();
  const site = getSiteConfig();
  const callback = (router.query.callbackUrl as string) ?? "/";
  const [loading, setLoading] = React.useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: callback });
  }

  const hasError = !!router.query.error;

  return (
    <>
      <Head>
        <title>Sign In — {site.name}</title>
      </Head>

      <Box
        sx={{
          minHeight: "100svh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: tokens.navy,
          position: "relative",
          overflow: "hidden",
          px: 3,
        }}
      >
        {/* Background blobs */}
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background: `
              radial-gradient(ellipse 55% 45% at 15% 60%, rgba(244,99,30,0.2), transparent 70%),
              radial-gradient(ellipse 40% 50% at 85% 25%, rgba(255,107,157,0.15), transparent 60%)
            `,
          }}
        />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            background: "#fff",
            borderRadius: "24px",
            p: { xs: "32px 24px", sm: "44px 40px" },
            width: "100%",
            maxWidth: 420,
            textAlign: "center",
            boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          }}
        >
          {/* Logo */}
          <Typography
            sx={{
              fontSize: "2rem",
              color: tokens.navy,
              letterSpacing: "0.1em",
              mb: 0.5,
            }}
            variant="h2"
          >
            {site.isInstance ? site.name.toUpperCase() : "COMUNL"}
          </Typography>

          <Typography
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontStyle: "italic",
              color: tokens.muted,
              fontSize: "0.9375rem",
              mb: 3.5,
            }}
          >
            Something went wrong signing you in
          </Typography>

          {hasError && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", textAlign: "left" }}>
              We couldn't sign you in. Please try again.
            </Alert>
          )}

          <Button
            fullWidth
            disabled={loading}
            size="large"
            startIcon={
              <Box
                alt=""
                component="img"
                src="https://www.google.com/favicon.ico"
                sx={{ width: 18, height: 18 }}
              />
            }
            sx={{ mb: 2 }}
            variant="contained"
            onClick={handleGoogleSignIn}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>

          <Typography sx={{ color: tokens.muted }} variant="caption">
            We use Google to keep things simple.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

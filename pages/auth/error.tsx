// pages/auth/signin.tsx
import React, { useState } from "react";
import Head from "next/head";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

import { tokens } from "../../src/styles/theme";
import { getSiteConfig } from "../../src/models";

export default function SignInPage() {
  const router = useRouter();
  const site = getSiteConfig();
  const callback = (router.query.callbackUrl as string) ?? "/";
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: callback });
  }

  const isAccessDenied = router.query.error === "AccessDenied";

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
            variant="h2"
            sx={{
              fontSize: "2rem",
              color: tokens.navy,
              letterSpacing: "0.1em",
              mb: 0.5,
            }}
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
            Admin access only
          </Typography>

          {isAccessDenied && (
            <Alert
              severity="error"
              sx={{ mb: 2.5, borderRadius: "12px", textAlign: "left" }}
            >
              Your email isn't on the admin list. Contact the site owner to get
              access.
            </Alert>
          )}

          <Button
            variant="contained"
            size="large"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={
              <Box
                component="img"
                src="https://www.google.com/favicon.ico"
                alt=""
                sx={{ width: 18, height: 18 }}
              />
            }
            sx={{ mb: 2 }}
          >
            {loading ? "Redirecting…" : "Continue with Google"}
          </Button>

          <Typography variant="caption" sx={{ color: tokens.muted }}>
            Only authorised emails can sign in.
          </Typography>
        </Box>
      </Box>
    </>
  );
}

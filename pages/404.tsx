import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Head from "next/head";
import Link from "next/link";
import React from "react";

import { tokens } from "../src/styles/theme";

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>Page Not Found — Comunl</title>
      </Head>

      <Box
        sx={{
          minHeight: "80svh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: "5rem", lineHeight: 1, mb: 1 }}>🎈</Typography>

        <Typography
          sx={{
            fontSize: "clamp(64px, 15vw, 120px)",
            color: tokens.navy,
            lineHeight: 1,
          }}
          variant="h1"
        >
          404
        </Typography>

        <Typography
          sx={{
            fontSize: "1.5rem",
            color: tokens.muted,
            fontFamily: '"Playfair Display", serif',
            fontStyle: "italic",
            fontWeight: 400,
          }}
          variant="h3"
        >
          This party doesn't exist.
        </Typography>

        <Typography sx={{ maxWidth: 340, color: tokens.muted, mt: 0.5 }} variant="body2">
          The event you're looking for may have been removed, or the link might be wrong.
        </Typography>

        <Box
          sx={{
            display: "flex",
            gap: 1.5,
            mt: 2,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <Link href="/" style={{ textDecoration: "none" }}>
            <Button variant="contained">Go Home</Button>
          </Link>
          <Link href="/events" style={{ textDecoration: "none" }}>
            <Button variant="outlined">Browse Events</Button>
          </Link>
        </Box>
      </Box>
    </>
  );
}

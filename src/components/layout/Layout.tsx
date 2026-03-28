import React from "react";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";

import MobileBottomNav from "./MobileBottomNav";
import Navbar from "./Navbar";

import type { SiteConfig } from "../../models";
import { tokens } from "../../styles/theme";

// ─── Powered-by badge ─────────────────────────────────────────────────────────

function PoweredBy() {
  return (
    <Box
      component="a"
      href="https://comunl.app"
      target="_blank"
      rel="noopener noreferrer"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        fontSize: "0.75rem",
        color: tokens.muted,
        textDecoration: "none",
        fontWeight: 500,
        px: 1.25,
        py: 0.5,
        borderRadius: 100,
        border: `1px solid ${tokens.border}`,
        background: "#fff",
        transition: "color 0.15s",
        "&:hover": { color: tokens.orange },
      }}
    >
      <Box
        component="span"
        sx={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: tokens.orange,
          boxShadow: `0 0 6px ${tokens.orange}`,
          flexShrink: 0,
        }}
      />
      Powered by Comunl
    </Box>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

interface LayoutProps {
  siteConfig: SiteConfig;
  children: React.ReactNode;
}

export default function Layout({ siteConfig, children }: LayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100svh",
        display: "flex",
        flexDirection: "column",
        background: tokens.cream,
        pb: { xs: "72px", sm: 0 },
      }}
    >
      <Navbar siteConfig={siteConfig} />

      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>

      <Box
        component="footer"
        sx={{
          display: { xs: "none", sm: "flex" },
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
          py: 4,
          borderTop: `1px solid ${tokens.border}`,
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        {siteConfig.isInstance && <PoweredBy />}
        <Typography variant="caption">
          © {new Date().getFullYear()} {siteConfig.isInstance ? siteConfig.name : "Comunl"}
        </Typography>
      </Box>

      <MobileBottomNav siteConfig={siteConfig} />
    </Box>
  );
}

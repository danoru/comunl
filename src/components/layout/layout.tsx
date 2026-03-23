// src/components/layout/Layout.tsx
import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSession, signOut } from "next-auth/react";

import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Paper from "@mui/material/Paper";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import type { SiteConfig } from "../../models";
import { tokens } from "../../styles/theme";

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar({ siteConfig }: { siteConfig: SiteConfig }) {
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  return (
    <AppBar position="sticky">
      <Toolbar sx={{ justifyContent: "space-between", px: { xs: 2, sm: 3 } }}>
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "1.6rem", sm: "1.9rem" },
              color: tokens.yellow,
              letterSpacing: "0.1em",
              cursor: "pointer",
            }}
          >
            {siteConfig.isInstance ? siteConfig.name : "COMUNL"}
          </Typography>
        </Link>

        {/* Desktop nav */}
        <Box
          sx={{
            display: { xs: "none", sm: "flex" },
            gap: 1.5,
            alignItems: "center",
          }}
        >
          <Link href="/events" style={{ textDecoration: "none" }}>
            <Button
              sx={{
                color: "rgba(255,255,255,0.75)",
                "&:hover": { color: "#fff" },
              }}
            >
              Events
            </Button>
          </Link>

          {isAdmin && (
            <Link href="/events/new" style={{ textDecoration: "none" }}>
              <Button variant="contained" size="small">
                + New Event
              </Button>
            </Link>
          )}

          {/* Auth button */}
          {isAdmin ? (
            <>
              <Avatar
                src={session?.user?.image ?? undefined}
                alt={session?.user?.name ?? "Admin"}
                sx={{
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  border: `2px solid ${tokens.orange}`,
                }}
                onClick={(e) => setAnchorEl(e.currentTarget)}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
                PaperProps={{ sx: { borderRadius: "12px", mt: 1 } }}
              >
                <MenuItem disabled sx={{ fontSize: "0.8125rem", opacity: 0.6 }}>
                  {session?.user?.email}
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setAnchorEl(null);
                    signOut({ callbackUrl: "/" });
                  }}
                >
                  <ListItemIcon>
                    <LogoutRoundedIcon fontSize="small" />
                  </ListItemIcon>
                  Sign out
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Link href="/auth/signin" style={{ textDecoration: "none" }}>
              <Button
                size="small"
                sx={{
                  color: "rgba(255,255,255,0.5)",
                  fontSize: "0.8125rem",
                  "&:hover": { color: "rgba(255,255,255,0.8)" },
                }}
              >
                Admin
              </Button>
            </Link>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

// ─── Mobile bottom nav ────────────────────────────────────────────────────────

function MobileBottomNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;

  const getValue = () => {
    if (router.pathname === "/") return 0;
    if (router.pathname.startsWith("/events")) return 1;
    return false;
  };

  return (
    <Paper
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: { xs: "block", sm: "none" },
        borderRadius: 0,
      }}
      elevation={3}
    >
      <BottomNavigation value={getValue()}>
        <BottomNavigationAction
          label="Home"
          icon={<HomeRoundedIcon />}
          onClick={() => router.push("/")}
        />
        <BottomNavigationAction
          label="Events"
          icon={<CelebrationRoundedIcon />}
          onClick={() => router.push("/events")}
        />
        {isAdmin && (
          <BottomNavigationAction
            label="New Event"
            icon={<AddCircleRoundedIcon />}
            onClick={() => router.push("/events/new")}
          />
        )}
      </BottomNavigation>
    </Paper>
  );
}

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
          © {new Date().getFullYear()}{" "}
          {siteConfig.isInstance ? siteConfig.name : "Comunl"}
        </Typography>
      </Box>

      <MobileBottomNav />
    </Box>
  );
}

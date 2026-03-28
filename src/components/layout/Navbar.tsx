import React from "react";
import Link from "next/link";
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
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import type { SiteConfig } from "../../models";
import { tokens } from "../../styles/theme";

export default function Navbar({ siteConfig }: { siteConfig: SiteConfig }) {
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

import React from "react";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";

import Paper from "@mui/material/Paper";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Avatar from "@mui/material/Avatar";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import type { SiteConfig } from "../../models";

export default function MobileBottomNav({ siteConfig }: { siteConfig: SiteConfig }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;
  const canCreateEvents = isAdmin || siteConfig.allowPublicEventCreation;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const getValue = () => {
    if (router.pathname === "/") return 0;
    if (router.pathname.startsWith("/events")) return 1;
    if (router.pathname === "/profile") return "profile";
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
        {canCreateEvents && session && (
          <BottomNavigationAction
            label="New Event"
            icon={<AddCircleRoundedIcon />}
            onClick={() => router.push("/events/new")}
          />
        )}
        <BottomNavigationAction
          value="profile"
          label={session ? (session.user?.name?.split(" ")[0] ?? "Me") : "Sign In"}
          icon={
            session?.user?.image ? (
              <Avatar src={session.user.image} sx={{ width: 24, height: 24 }} />
            ) : (
              <PersonRoundedIcon />
            )
          }
          onClick={(e) => {
            if (session) setAnchorEl(e.currentTarget);
            else signIn("google");
          }}
        />
      </BottomNavigation>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        PaperProps={{ sx: { borderRadius: "12px", mb: 1 } }}
      >
        <MenuItem disabled sx={{ fontSize: "0.8125rem", opacity: 0.6 }}>
          {session?.user?.email}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/profile");
          }}
        >
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          Profile
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
    </Paper>
  );
}

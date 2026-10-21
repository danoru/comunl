import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import Avatar from "@mui/material/Avatar";
import BottomNavigation from "@mui/material/BottomNavigation";
import BottomNavigationAction from "@mui/material/BottomNavigationAction";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import { useRouter } from "next/router";
import { useSession, signIn, signOut } from "next-auth/react";
import React from "react";

import { isMainSite, type SiteConfig } from "../../models";

export default function MobileBottomNav({ siteConfig }: { siteConfig: SiteConfig }) {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;
  const canCreateEvents = isAdmin || siteConfig.allowPublicEventCreation;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const getValue = () => {
    if (router.pathname === "/") return "home";
    if (router.pathname.startsWith("/events")) return "events";
    if (router.pathname.startsWith("/intents")) return "rally";
    if (router.pathname === "/profile") return "profile";
    return false;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: { xs: "block", sm: "none" },
        borderRadius: 0,
      }}
    >
      <BottomNavigation value={getValue()}>
        <BottomNavigationAction
          icon={<HomeRoundedIcon />}
          label="Home"
          value="home"
          onClick={() => router.push("/")}
        />
        <BottomNavigationAction
          icon={<CelebrationRoundedIcon />}
          label="Events"
          value="events"
          onClick={() => router.push("/events")}
        />
        {isMainSite(siteConfig) && (
          <BottomNavigationAction
            icon={<CampaignRoundedIcon />}
            label="Rally"
            value="rally"
            onClick={() => router.push("/intents")}
          />
        )}
        {canCreateEvents && session && (
          <BottomNavigationAction
            icon={<AddCircleRoundedIcon />}
            label="New Event"
            value="new"
            onClick={() => router.push("/events/new")}
          />
        )}
        <BottomNavigationAction
          icon={
            session?.user?.image ? (
              <Avatar src={session.user.image} sx={{ width: 24, height: 24 }} />
            ) : (
              <PersonRoundedIcon />
            )
          }
          label={session ? (session.user?.name?.split(" ")[0] ?? "Me") : "Sign in"}
          value="profile"
          onClick={(e) => {
            if (session) setAnchorEl(e.currentTarget);
            else signIn("google");
          }}
        />
      </BottomNavigation>

      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        open={Boolean(anchorEl)}
        PaperProps={{ sx: { borderRadius: "12px", mb: 1 } }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
        onClose={() => setAnchorEl(null)}
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

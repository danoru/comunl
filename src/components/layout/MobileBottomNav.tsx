import AddCircleRoundedIcon from "@mui/icons-material/AddCircleRounded";
import CelebrationRoundedIcon from "@mui/icons-material/CelebrationRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import {
  Avatar,
  BottomNavigation,
  BottomNavigationAction,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
} from "@mui/material";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import React from "react";

export default function MobileBottomNav() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = (session as any)?.isAdmin ?? false;
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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
        {/* Auth tab */}
        <BottomNavigationAction
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
            else router.push("/auth/signin");
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

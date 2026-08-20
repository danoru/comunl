import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useRouter } from "next/router";
import { useSession } from "next-auth/react";
import React from "react";

import { pushSupported, getPushSubscription, enablePush, disablePush } from "../../lib/pushClient";
import type { SerializedNotification } from "../../models";
import { tokens } from "../../styles/theme";

dayjs.extend(relativeTime);

function subjectHref(subject: SerializedNotification["subject"]): string {
  if (subject.kind === "event") return `/events/${subject.id}`;
  if (subject.kind === "user") return `/profile/${subject.id}`;
  return "/intents";
}

export default function NotificationsBell() {
  const { data: session } = useSession();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = React.useState<SerializedNotification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [pushState, setPushState] = React.useState<"unsupported" | "off" | "on" | "busy">(
    "unsupported"
  );

  React.useEffect(() => {
    if (!session || !pushSupported()) return;
    getPushSubscription()
      .then((sub) => setPushState(sub ? "on" : "off"))
      .catch(() => setPushState("off"));
  }, [session]);

  async function togglePush() {
    if (pushState === "busy" || pushState === "unsupported") return;
    const was = pushState;
    setPushState("busy");
    if (was === "on") {
      await disablePush();
      setPushState("off");
    } else {
      const result = await enablePush();
      setPushState(result === "enabled" ? "on" : "off");
    }
  }

  const load = React.useCallback(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return;
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => undefined);
  }, []);

  React.useEffect(() => {
    if (session) load();
  }, [session, load]);

  if (!session) return null;

  function open(e: React.MouseEvent<HTMLElement>) {
    setAnchorEl(e.currentTarget);
    load();
    if (unreadCount > 0) {
      fetch("/api/notifications/read", { method: "POST" })
        .then(() => setUnreadCount(0))
        .catch(() => undefined);
    }
  }

  function go(notification: SerializedNotification) {
    setAnchorEl(null);
    router.push(subjectHref(notification.subject));
  }

  return (
    <>
      <IconButton
        aria-label="Notifications"
        sx={{ color: "rgba(255,255,255,0.85)" }}
        onClick={open}
      >
        <Badge
          badgeContent={unreadCount}
          sx={{
            "& .MuiBadge-badge": {
              background: tokens.orange,
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 700,
              minWidth: 16,
              height: 16,
            },
          }}
        >
          <NotificationsRoundedIcon sx={{ fontSize: 22 }} />
        </Badge>
      </IconButton>

      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={Boolean(anchorEl)}
        slotProps={{ paper: { sx: { borderRadius: "16px", mt: 1, width: 340, maxWidth: "92vw" } } }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        onClose={() => setAnchorEl(null)}
      >
        <Box
          sx={{
            alignItems: "center",
            borderBottom: `1px solid ${tokens.border}`,
            display: "flex",
            justifyContent: "space-between",
            px: 2,
            py: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: "1.1rem",
              letterSpacing: "0.04em",
            }}
          >
            NOTIFICATIONS
          </Typography>
          <Typography
            component="button"
            sx={{
              background: "none",
              border: "none",
              color: tokens.orange,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: "0.75rem",
              fontWeight: 600,
              p: 0,
            }}
            onClick={() => {
              setAnchorEl(null);
              router.push("/notifications");
            }}
          >
            See all →
          </Typography>
        </Box>

        {notifications.length === 0 && (
          <Box sx={{ color: tokens.muted, px: 2, py: 4, textAlign: "center" }}>
            <Typography variant="body2">Nothing yet — go rally some friends</Typography>
          </Box>
        )}

        <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
          {notifications.map((n) => (
            <Box
              key={n._id}
              sx={{
                alignItems: "flex-start",
                background: n.readAt === null ? "rgba(244,99,30,0.04)" : "transparent",
                borderBottom: `1px solid rgba(26,31,58,0.06)`,
                cursor: "pointer",
                display: "flex",
                gap: 1.5,
                px: 2,
                py: 1.5,
                "&:hover": { background: tokens.creamDark },
              }}
              onClick={() => go(n)}
            >
              <Avatar src={n.actorImage ?? undefined} sx={{ height: 34, width: 34 }}>
                {n.actorName[0]?.toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: "0.85rem", lineHeight: 1.45 }}>{n.message}</Typography>
                <Typography sx={{ color: tokens.mutedLight }} variant="caption">
                  {dayjs(n.createdAt).fromNow()}
                </Typography>
              </Box>
              {n.readAt === null && (
                <Box
                  sx={{
                    background: tokens.orange,
                    borderRadius: "50%",
                    flexShrink: 0,
                    height: 8,
                    ml: "auto",
                    mt: 0.75,
                    width: 8,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>

        {pushState !== "unsupported" && (
          <Box
            sx={{
              alignItems: "center",
              borderTop: `1px solid ${tokens.border}`,
              display: "flex",
              gap: 1,
              justifyContent: "space-between",
              px: 2,
              py: 1.25,
            }}
          >
            <Typography sx={{ lineHeight: 1.4 }} variant="caption">
              {pushState === "on"
                ? "Alerts are on for this device"
                : "Get alerts on this device, even with the tab closed"}
            </Typography>
            <Typography
              component="button"
              sx={{
                background: pushState === "on" ? "rgba(6,214,160,0.14)" : tokens.orange,
                border: "none",
                borderRadius: 100,
                color: pushState === "on" ? "#047A5B" : "#fff",
                cursor: "pointer",
                flexShrink: 0,
                fontFamily: "inherit",
                fontSize: "0.75rem",
                fontWeight: 600,
                px: 1.75,
                py: 0.75,
              }}
              onClick={togglePush}
            >
              {pushState === "busy" ? "…" : pushState === "on" ? "On ✓" : "Enable"}
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}

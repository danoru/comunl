import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useSession } from "next-auth/react";
import React from "react";

import type { SerializedIntent } from "../../models";
import { tokens } from "../../styles/theme";

const YELLOW_BG = "rgba(255,209,102,0.28)";
const YELLOW_INK = "#8A6400";

// Homepage teaser for the Rally feed — renders nothing for signed-out
// visitors (the feed itself is sign-in-gated).
export default function RallyStrip() {
  const { data: session } = useSession();
  const [intents, setIntents] = React.useState<SerializedIntent[]>([]);

  React.useEffect(() => {
    if (!session) return;
    fetch("/api/intents?limit=6")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) =>
        setIntents(Array.isArray(data) ? data.filter((i) => i.status === "open") : [])
      )
      .catch(() => setIntents([]));
  }, [session]);

  if (!session || intents.length === 0) return null;

  return (
    <Box sx={{ maxWidth: 700, mx: "auto", px: { xs: 2.5, sm: 3 }, py: 3 }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1.25, mb: 2 }}>
        <Typography
          sx={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: "0.875rem",
            letterSpacing: "0.12em",
            color: tokens.muted,
            whiteSpace: "nowrap",
          }}
          variant="caption"
        >
          RALLY
        </Typography>
        <Chip
          label={intents.length}
          size="small"
          sx={{ background: tokens.creamDark, color: tokens.muted, fontSize: "0.7rem", height: 20 }}
        />
        <Box sx={{ background: tokens.border, flex: 1, height: "1px" }} />
        <Link href="/intents" style={{ textDecoration: "none" }}>
          <Typography sx={{ color: tokens.orange, fontSize: "0.75rem", fontWeight: 600 }}>
            See all →
          </Typography>
        </Link>
      </Box>

      <Box sx={{ display: "flex", gap: 1.25, overflowX: "auto", pb: 1 }}>
        {intents.map((intent) => (
          <Link key={intent.id} href="/intents" style={{ textDecoration: "none" }}>
            <Box
              sx={{
                background: "#fff",
                border: `1.5px solid ${tokens.border}`,
                borderRadius: "16px",
                boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 1,
                minWidth: 190,
                maxWidth: 220,
                p: "12px 14px",
              }}
            >
              <Box sx={{ alignItems: "center", display: "flex", gap: 1 }}>
                <Avatar src={intent.authorImage ?? undefined} sx={{ height: 28, width: 28 }}>
                  {intent.authorName[0]?.toUpperCase()}
                </Avatar>
                <Typography sx={{ fontWeight: 600 }} variant="caption">
                  {intent.authorName.split(" ")[0]}
                </Typography>
                {intent.timeframe && (
                  <Chip
                    label={intent.timeframe.label.toUpperCase().slice(0, 12)}
                    size="small"
                    sx={{
                      background: YELLOW_BG,
                      color: YELLOW_INK,
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      height: 18,
                      ml: "auto",
                    }}
                  />
                )}
              </Box>
              <Typography
                sx={{
                  color: tokens.navy,
                  display: "-webkit-box",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  lineHeight: 1.35,
                  overflow: "hidden",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {intent.activity}
              </Typography>
              <Typography sx={{ fontWeight: 600 }} variant="caption">
                {intent.interested.length === 0
                  ? "Be the first in"
                  : `${intent.interested.length} ${intent.interested.length === 1 ? "is" : "are"} in`}
              </Typography>
            </Box>
          </Link>
        ))}
      </Box>
    </Box>
  );
}

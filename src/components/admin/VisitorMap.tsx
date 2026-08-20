import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";

import type { LocationStat } from "../../models";

import { SERIES, SERIES_LABEL, CHART_INK } from "./chartTokens";
import { WORLD_PATH, WORLD_VIEWBOX, WORLD_LAT_RANGE } from "./worldPath";

interface VisitorMapProps {
  locations: LocationStat[];
}

// Equirectangular — must match the projection in scripts/build-world-map.mjs,
// which generated WORLD_PATH.
function project(lon: number, lat: number) {
  const x = ((lon + 180) / 360) * WORLD_VIEWBOX.width;
  const y =
    ((WORLD_LAT_RANGE.max - lat) / (WORLD_LAT_RANGE.max - WORLD_LAT_RANGE.min)) *
    WORLD_VIEWBOX.height;
  return { x, y };
}

function label(loc: LocationStat): string {
  return [loc.city, loc.region, loc.country].filter(Boolean).join(", ") || "Unknown";
}

export default function VisitorMap({ locations }: VisitorMapProps) {
  const [hover, setHover] = React.useState<number | null>(null);

  const plotted = locations.filter((l) => l.lat !== null && l.lon !== null);
  const maxTotal = Math.max(1, ...plotted.map((l) => l.total));
  // Area-proportional radius so a busy city doesn't visually swamp the map.
  const radius = (total: number) => 3 + Math.sqrt(total / maxTotal) * 11;

  return (
    <Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, mb: 1.5 }}>
        {(["accounts", "guests"] as const).map((key) => (
          <Box key={key} sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Box
              sx={{
                background: SERIES[key],
                border: "2px solid #fff",
                borderRadius: "50%",
                height: 12,
                width: 12,
              }}
            />
            <Typography sx={{ color: CHART_INK.muted, fontWeight: 600 }} variant="caption">
              {SERIES_LABEL[key]}
            </Typography>
          </Box>
        ))}
        <Typography sx={{ color: CHART_INK.muted, ml: "auto" }} variant="caption">
          {plotted.length === 0
            ? "No mapped visits yet"
            : `${plotted.length} location${plotted.length === 1 ? "" : "s"}`}
        </Typography>
      </Box>

      <Box sx={{ position: "relative" }}>
        <Box
          component="svg"
          sx={{ display: "block", height: "auto", width: "100%" }}
          viewBox={`0 0 ${WORLD_VIEWBOX.width} ${WORLD_VIEWBOX.height}`}
        >
          <path
            d={WORLD_PATH}
            fill={CHART_INK.land}
            stroke={CHART_INK.landEdge}
            strokeWidth="0.5"
          />

          {plotted.map((loc, i) => {
            const { x, y } = project(loc.lon!, loc.lat!);
            const r = radius(loc.total);
            // One dot per location, colored by who dominates it; the tooltip
            // and the table carry the exact split.
            const fill = loc.accounts >= loc.guests ? SERIES.accounts : SERIES.guests;
            return (
              <circle
                key={`${label(loc)}-${i}`}
                cx={x}
                cy={y}
                fill={fill}
                fillOpacity={hover === null || hover === i ? 0.85 : 0.4}
                r={r}
                stroke="#fff"
                strokeWidth="1.5"
                style={{ cursor: "default" }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            );
          })}
        </Box>

        {hover !== null && plotted[hover] && (
          <Box
            sx={{
              background: CHART_INK.text,
              borderRadius: "8px",
              color: "#fff",
              left: `${(project(plotted[hover].lon!, plotted[hover].lat!).x / WORLD_VIEWBOX.width) * 100}%`,
              p: "6px 10px",
              pointerEvents: "none",
              position: "absolute",
              top: `${(project(plotted[hover].lon!, plotted[hover].lat!).y / WORLD_VIEWBOX.height) * 100}%`,
              transform: "translate(-50%, -140%)",
              whiteSpace: "nowrap",
              zIndex: 2,
            }}
          >
            <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>
              {label(plotted[hover])}
            </Typography>
            <Typography sx={{ fontSize: "0.7rem", opacity: 0.85 }}>
              {plotted[hover].accounts} members · {plotted[hover].guests} guests
            </Typography>
          </Box>
        )}

        {plotted.length === 0 && (
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              inset: 0,
              justifyContent: "center",
              position: "absolute",
            }}
          >
            <Typography
              sx={{
                background: "rgba(255,255,255,0.9)",
                borderRadius: "10px",
                color: CHART_INK.muted,
                p: "8px 14px",
                textAlign: "center",
              }}
              variant="caption"
            >
              Location data comes from Vercel&apos;s edge — dots appear once the site is deployed
              and visited.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}

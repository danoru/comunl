import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import dayjs from "dayjs";
import React from "react";

import type { TrafficDay } from "../../models";

import { SERIES, SERIES_LABEL, CHART_INK } from "./chartTokens";

interface TrafficChartProps {
  data: TrafficDay[];
}

const HEIGHT = 180;
const SEGMENT_GAP = 2;

// Stacked daily bars: total traffic per day, split members vs guests.
// One measure (views), one axis — never a second y-scale.
export default function TrafficChart({ data }: TrafficChartProps) {
  const [hover, setHover] = React.useState<number | null>(null);

  const max = Math.max(1, ...data.map((d) => d.accounts + d.guests));
  const barWidth = 100 / data.length;
  const ticks = [0, Math.round(max / 2), max];

  const active = hover === null ? null : data[hover];

  return (
    <Box>
      <Box sx={{ alignItems: "center", display: "flex", gap: 2, mb: 1.5 }}>
        {(["accounts", "guests"] as const).map((key) => (
          <Box key={key} sx={{ alignItems: "center", display: "flex", gap: 0.75 }}>
            <Box sx={{ background: SERIES[key], borderRadius: "3px", height: 10, width: 10 }} />
            <Typography sx={{ color: CHART_INK.muted, fontWeight: 600 }} variant="caption">
              {SERIES_LABEL[key]}
            </Typography>
          </Box>
        ))}
        <Typography sx={{ color: CHART_INK.muted, ml: "auto" }} variant="caption">
          {active
            ? `${dayjs(active.day).format("MMM D")} · ${active.accounts + active.guests} views`
            : `Last ${data.length} days`}
        </Typography>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        {/* y-axis labels */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column-reverse",
            height: HEIGHT,
            justifyContent: "space-between",
            pb: 2.5,
          }}
        >
          {ticks.map((t) => (
            <Typography
              key={t}
              sx={{
                color: CHART_INK.muted,
                fontVariantNumeric: "tabular-nums",
                lineHeight: 1,
              }}
              variant="caption"
            >
              {t}
            </Typography>
          ))}
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, position: "relative" }}>
          <Box
            component="svg"
            preserveAspectRatio="none"
            sx={{ display: "block", height: HEIGHT, width: "100%" }}
            viewBox={`0 0 100 ${HEIGHT}`}
          >
            {ticks.map((t) => {
              const y = HEIGHT - (t / max) * HEIGHT;
              return (
                <line
                  key={t}
                  stroke={t === 0 ? CHART_INK.axis : CHART_INK.grid}
                  strokeWidth="1"
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={y}
                  y2={y}
                />
              );
            })}

            {data.map((d, i) => {
              const total = d.accounts + d.guests;
              if (total === 0) return null;
              const x = i * barWidth;
              const w = barWidth * 0.68;
              const offset = (barWidth - w) / 2;
              const guestH = (d.guests / max) * HEIGHT;
              const acctH = (d.accounts / max) * HEIGHT;
              const gap = d.guests > 0 && d.accounts > 0 ? SEGMENT_GAP : 0;

              return (
                <g key={d.day} opacity={hover === null || hover === i ? 1 : 0.45}>
                  {d.guests > 0 && (
                    <rect
                      fill={SERIES.guests}
                      height={guestH}
                      rx="1"
                      width={w}
                      x={x + offset}
                      y={HEIGHT - guestH}
                    />
                  )}
                  {d.accounts > 0 && (
                    <rect
                      fill={SERIES.accounts}
                      height={Math.max(0, acctH - gap)}
                      rx="1"
                      width={w}
                      x={x + offset}
                      y={HEIGHT - guestH - acctH - gap}
                    />
                  )}
                </g>
              );
            })}
          </Box>

          {/* hover targets — wider than the marks so short bars stay reachable */}
          <Box sx={{ display: "flex", inset: 0, position: "absolute" }}>
            {data.map((d, i) => (
              <Box
                key={d.day}
                sx={{ cursor: "default", flex: 1 }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </Box>

          {active && (
            <Box
              sx={{
                background: CHART_INK.text,
                borderRadius: "8px",
                color: "#fff",
                left: `${Math.min(Math.max((hover! + 0.5) * barWidth, 12), 88)}%`,
                p: "6px 10px",
                pointerEvents: "none",
                position: "absolute",
                top: -6,
                transform: "translate(-50%, -100%)",
                whiteSpace: "nowrap",
                zIndex: 2,
              }}
            >
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700 }}>
                {dayjs(active.day).format("ddd, MMM D")}
              </Typography>
              <Typography sx={{ fontSize: "0.7rem", opacity: 0.85 }}>
                {active.accounts} members · {active.guests} guests
              </Typography>
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "space-between", pt: 0.75 }}>
            <Typography sx={{ color: CHART_INK.muted }} variant="caption">
              {dayjs(data[0]?.day).format("MMM D")}
            </Typography>
            <Typography sx={{ color: CHART_INK.muted }} variant="caption">
              {dayjs(data[data.length - 1]?.day).format("MMM D")}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

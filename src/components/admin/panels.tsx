import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";

import { tokens } from "../../styles/theme";

import { CHART_INK, ORANGE_RAMP } from "./chartTokens";

export function Card({
  children,
  title,
  hint,
}: {
  children: React.ReactNode;
  title?: string;
  hint?: string;
}) {
  return (
    <Box
      sx={{
        background: "#fff",
        border: `1.5px solid ${tokens.border}`,
        borderRadius: "20px",
        boxShadow: "0 1px 4px rgba(26,31,58,0.06)",
        p: { xs: "16px", sm: "18px 20px" },
      }}
    >
      {title && (
        <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.25, mb: 1.75 }}>
          <Typography
            sx={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: "1.15rem",
              letterSpacing: "0.06em",
            }}
          >
            {title.toUpperCase()}
          </Typography>
          {hint && (
            <Typography sx={{ color: CHART_INK.muted, ml: "auto" }} variant="caption">
              {hint}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}

export function StatTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <Box
      sx={{
        background: accent ? "rgba(244,99,30,0.07)" : "#fff",
        border: `1.5px solid ${accent ? "rgba(244,99,30,0.25)" : tokens.border}`,
        borderRadius: "16px",
        p: "14px 16px",
      }}
    >
      <Typography
        sx={{
          color: CHART_INK.muted,
          display: "block",
          fontWeight: 700,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
        variant="caption"
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: accent ? tokens.orange : tokens.navy,
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: "2rem",
          fontVariantNumeric: "tabular-nums",
          letterSpacing: "0.02em",
          lineHeight: 1.1,
        }}
      >
        {typeof value === "number" ? value.toLocaleString() : value}
      </Typography>
      {sub && (
        <Typography sx={{ color: CHART_INK.muted }} variant="caption">
          {sub}
        </Typography>
      )}
    </Box>
  );
}

// Horizontal magnitude bars on a single-hue sequential ramp — the funnel is one
// measure at successive stages, so it gets one hue, not categorical colors.
export function FunnelBars({
  stages,
}: {
  stages: { label: string; value: number; note?: string }[];
}) {
  const max = Math.max(1, ...stages.map((s) => s.value));
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      {stages.map((stage, i) => {
        const pct = (stage.value / max) * 100;
        return (
          <Box key={stage.label} sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            <Box sx={{ alignItems: "baseline", display: "flex", gap: 1 }}>
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>{stage.label}</Typography>
              <Typography
                sx={{
                  color: CHART_INK.muted,
                  fontSize: "0.75rem",
                  fontVariantNumeric: "tabular-nums",
                  ml: "auto",
                }}
              >
                {stage.value.toLocaleString()}
                {stage.note ? ` · ${stage.note}` : ""}
              </Typography>
            </Box>
            <Box
              sx={{
                background: "rgba(26,31,58,0.06)",
                borderRadius: "6px",
                height: 12,
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  background: ORANGE_RAMP[Math.min(i, ORANGE_RAMP.length - 1)],
                  borderRadius: "6px",
                  height: "100%",
                  width: `${Math.max(pct, stage.value > 0 ? 2 : 0)}%`,
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

export function SimpleTable({
  columns,
  rows,
  empty,
}: {
  columns: { key: string; label: string; align?: "left" | "right"; width?: string }[];
  rows: Record<string, React.ReactNode>[];
  empty: string;
}) {
  if (rows.length === 0) {
    return (
      <Typography sx={{ color: CHART_INK.muted, py: 3, textAlign: "center" }} variant="body2">
        {empty}
      </Typography>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Box component="table" sx={{ borderCollapse: "collapse", minWidth: "100%", width: "100%" }}>
        <Box component="thead">
          <Box component="tr">
            {columns.map((c) => (
              <Box
                key={c.key}
                component="th"
                sx={{
                  borderBottom: `1px solid ${tokens.border}`,
                  color: CHART_INK.muted,
                  fontSize: "0.6875rem",
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  pb: 0.75,
                  pl: c.align === "right" ? 1.5 : 0,
                  pr: c.align === "right" ? 0 : 1.5,
                  textAlign: c.align ?? "left",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  width: c.width,
                }}
              >
                {c.label}
              </Box>
            ))}
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row, i) => (
            <Box key={i} component="tr">
              {columns.map((c) => (
                <Box
                  key={c.key}
                  component="td"
                  sx={{
                    borderBottom: i === rows.length - 1 ? "none" : `1px solid rgba(26,31,58,0.05)`,
                    fontSize: "0.8125rem",
                    fontVariantNumeric: c.align === "right" ? "tabular-nums" : undefined,
                    maxWidth: 260,
                    overflow: "hidden",
                    pl: c.align === "right" ? 1.5 : 0,
                    pr: c.align === "right" ? 0 : 1.5,
                    py: 1,
                    textAlign: c.align ?? "left",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row[c.key]}
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

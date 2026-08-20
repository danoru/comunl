// Chart palette for the admin dashboard.
//
// Validated with the dataviz palette checker against the cream surface
// (#FDF6EC): lightness band PASS, chroma floor PASS, CVD separation ΔE 33.4
// (protan) / 31.2 (tritan) PASS, normal-vision ΔE 38.0 PASS, contrast >= 3:1
// PASS. The deep orange is a step down from brand #F4631E, which sits just
// under 3:1 on cream — keep these values unless you re-run the validator.
export const SERIES = {
  accounts: "#C94D12",
  guests: "#3D5AFE",
} as const;

export const SERIES_LABEL = {
  accounts: "Members",
  guests: "Guests",
} as const;

// Recessive chart furniture — grid and axes must never compete with the marks.
export const CHART_INK = {
  grid: "rgba(26,31,58,0.08)",
  axis: "rgba(26,31,58,0.15)",
  land: "rgba(26,31,58,0.10)",
  landEdge: "rgba(26,31,58,0.18)",
  text: "#1A1F3A",
  muted: "#7A7F99",
  surface: "#FFFFFF",
} as const;

// Sequential ramp (single hue, light → dark) for magnitude-only marks
// like the funnel bars.
export const ORANGE_RAMP = ["#F9C7A8", "#F49A6A", "#EF6D2C", "#C94D12", "#9A3A0D"] as const;

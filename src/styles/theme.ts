// src/styles/theme.ts
// Note: createEmotionCache.tsx is no longer needed and can be deleted.
// @mui/material-nextjs handles the emotion cache automatically.

import { createTheme } from "@mui/material/styles";

// Validate hex format before passing to MUI — an empty string or malformed
// value will throw "unsupported color". Fall back to defaults if not set.
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;
const PRIMARY = HEX_RE.test(process.env.NEXT_PUBLIC_PRIMARY_COLOR ?? "")
  ? process.env.NEXT_PUBLIC_PRIMARY_COLOR!
  : "#F4631E";
const ACCENT = HEX_RE.test(process.env.NEXT_PUBLIC_ACCENT_COLOR ?? "")
  ? process.env.NEXT_PUBLIC_ACCENT_COLOR!
  : "#FFD166";

export const tokens = {
  cream: "#FDF6EC",
  creamDark: "#F5EDE0",
  orange: PRIMARY,
  orangeLight: "#FFB085",
  orangeGlow: "rgba(244, 99, 30, 0.15)",
  navy: "#1A1F3A",
  navyLight: "#252B50",
  pink: "#FF6B9D",
  yellow: ACCENT,
  green: "#06D6A0",
  greenBg: "rgba(6, 214, 160, 0.10)",
  muted: "#7A7F99",
  mutedLight: "#B0B4CC",
  border: "rgba(26, 31, 58, 0.08)",
  borderStrong: "rgba(26, 31, 58, 0.15)",
} as const;

const theme = createTheme({
  palette: {
    primary: { main: tokens.orange, contrastText: "#fff" },
    secondary: { main: tokens.navy, contrastText: "#fff" },
    background: { default: tokens.cream, paper: "#FFFFFF" },
    text: { primary: tokens.navy, secondary: tokens.muted },
    success: { main: tokens.green },
  },

  typography: {
    fontFamily: '"DM Sans", "Helvetica Neue", Arial, sans-serif',
    h1: {
      fontFamily: '"Bebas Neue", sans-serif',
      letterSpacing: "0.02em",
      lineHeight: 0.9,
    },
    h2: {
      fontFamily: '"Bebas Neue", sans-serif',
      letterSpacing: "0.02em",
      lineHeight: 1,
    },
    h3: { fontFamily: '"Bebas Neue", sans-serif', letterSpacing: "0.01em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: "1rem", lineHeight: 1.65 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6, color: tokens.muted },
    caption: {
      fontSize: "0.75rem",
      color: tokens.muted,
      letterSpacing: "0.03em",
    },
    button: { fontWeight: 600, letterSpacing: "0.02em" },
  },

  shape: { borderRadius: 12 },

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 100,
          padding: "10px 24px",
          fontSize: "0.9375rem",
          textTransform: "none",
          fontWeight: 600,
          transition: "transform 0.15s, box-shadow 0.15s",
          "&:hover": { transform: "translateY(-1px)" },
        },
        containedPrimary: {
          boxShadow: "0 4px 16px rgba(244, 99, 30, 0.35)",
          "&:hover": { boxShadow: "0 8px 28px rgba(244, 99, 30, 0.45)" },
        },
        outlinedPrimary: {
          borderWidth: "1.5px",
          "&:hover": { borderWidth: "1.5px" },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: `1.5px solid ${tokens.border}`,
          boxShadow: "0 1px 4px rgba(26, 31, 58, 0.06)",
          transition: "transform 0.2s, box-shadow 0.2s",
          "&:hover": {
            transform: "translateY(-3px)",
            boxShadow: "0 12px 40px rgba(26, 31, 58, 0.12)",
          },
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: "18px 20px",
          "&:last-child": { paddingBottom: 20 },
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: "0.75rem", height: 26 },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: tokens.orange,
            borderWidth: "1.5px",
          },
        },
        notchedOutline: { borderColor: tokens.border },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: tokens.muted,
          "&.Mui-focused": { color: tokens.orange },
        },
      },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundColor: tokens.navy,
          boxShadow: "0 2px 12px rgba(26, 31, 58, 0.25)",
        },
      },
    },

    MuiDivider: {
      styleOverrides: { root: { borderColor: tokens.border } },
    },

    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: "none" },
        rounded: { borderRadius: 20 },
      },
    },

    MuiBottomNavigation: {
      styleOverrides: {
        root: { borderTop: `1px solid ${tokens.border}`, height: 64 },
      },
    },

    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          color: tokens.muted,
          "&.Mui-selected": { color: tokens.orange },
        },
      },
    },
  },
});

export default theme;

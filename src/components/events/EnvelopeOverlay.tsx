import { keyframes } from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import Typography from "@mui/material/Typography";
import React, { useState } from "react";

import { tokens } from "../../styles/theme";

// ─── Choreography ─────────────────────────────────────────────────────────────
// 0.00–0.45s   seal cracks (scale + rotate, fades out)
// 0.25–0.95s   flap folds back in 3D; halfway through it drops behind the letter
// 0.95–1.75s   letter slides up out of the envelope
// 1.75s+       "View Event" CTA fades in

// Envelope geometry, in the SVG's own units. The front pocket and flap are
// drawn against this box and stretched to the envelope's rendered size.
const W = 360;
const H = 250;
const FLAP_TIP = 0.58; // flap point, as a fraction of envelope height

const paper = {
  inside: "#d8c9a6",
  flap: "#ece2cb",
  flapBack: "#e2d5b8",
  side: "#f1e8d4",
  bottom: "#f6efdf",
  edge: "rgba(120,95,55,0.18)",
};

const flapOpen = keyframes`
  0%   { transform: rotateX(0deg);   z-index: 4; }
  50%  { z-index: 4; }
  51%  { z-index: 1; }
  100% { transform: rotateX(180deg); z-index: 1; }
`;

const letterRise = keyframes`
  from { transform: translateY(0); }
  to   { transform: translateY(-66%); }
`;

const sealCrack = keyframes`
  0%   { transform: translate(-50%, -50%) scale(1)    rotate(0deg);  opacity: 1; }
  30%  { transform: translate(-50%, -50%) scale(1.1)  rotate(-4deg); opacity: 1; }
  100% { transform: translate(-50%, -50%) scale(0.5)  rotate(12deg); opacity: 0; }
`;

const sealHint = keyframes`
  0%, 100% { filter: drop-shadow(0 2px 4px rgba(26,31,58,0.25)); }
  50%      { filter: drop-shadow(0 4px 12px rgba(26,31,58,0.55)); }
`;

const idleTilt = keyframes`
  0%, 100% { transform: rotate(-1.2deg); }
  50%      { transform: rotate(1.2deg); }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const hintPulse = keyframes`
  0%, 100% { opacity: 0.55; }
  50%      { opacity: 1; }
`;

interface EnvelopeOverlayProps {
  eventTitle: string;
  onReveal: () => void;
}

function WaxSeal() {
  const wax = tokens.navy;
  return (
    <Box
      component="svg"
      preserveAspectRatio="xMidYMid meet"
      sx={{ width: "52px", height: "52px", display: "block" }}
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse cx="26" cy="10" fill={wax} rx="6" ry="5" />
      <ellipse cx="38" cy="15" fill={wax} rx="5" ry="6" />
      <ellipse cx="42" cy="28" fill={wax} rx="5" ry="5" />
      <ellipse cx="36" cy="40" fill={wax} rx="6" ry="5" />
      <ellipse cx="16" cy="40" fill={wax} rx="5" ry="5" />
      <ellipse cx="10" cy="27" fill={wax} rx="5" ry="5" />
      <ellipse cx="14" cy="14" fill={wax} rx="5" ry="6" />
      <circle cx="26" cy="26" fill={wax} r="20" />
      <circle cx="26" cy="26" fill="none" r="15" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
      <path
        d="M32 20 A9 9 0 1 0 32 32"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    </Box>
  );
}

// The pocket: two side folds meeting in the middle, with the bottom fold
// overlapping them. Only covers the lower part of the envelope, so the letter
// is visible through the mouth once the flap is open.
function FrontPocket() {
  const cx = W / 2;
  return (
    <Box
      aria-hidden
      component="svg"
      preserveAspectRatio="none"
      sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }}
      viewBox={`0 0 ${W} ${H}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon fill={paper.side} points={`0,0 ${cx - 8},${H * 0.56} 0,${H}`} />
      <polygon fill={paper.side} points={`${W},0 ${cx + 8},${H * 0.56} ${W},${H}`} />
      <polygon
        fill={paper.bottom}
        points={`0,${H} ${cx},${H * 0.48} ${W},${H}`}
        stroke={paper.edge}
        strokeLinejoin="round"
        strokeWidth="1"
      />
      <polyline
        fill="none"
        points={`0,0 ${cx - 8},${H * 0.56}`}
        stroke={paper.edge}
        strokeWidth="1"
      />
      <polyline
        fill="none"
        points={`${W},0 ${cx + 8},${H * 0.56}`}
        stroke={paper.edge}
        strokeWidth="1"
      />
    </Box>
  );
}

export default function EnvelopeOverlay({ eventTitle, onReveal }: EnvelopeOverlayProps) {
  const [opened, setOpened] = useState(false);
  const [exiting, setExiting] = useState(false);

  function handleOpen() {
    if (opened) return;
    setOpened(true);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleOpen();
    }
  }

  function handleReveal() {
    setExiting(true);
    setTimeout(onReveal, 600);
  }

  return (
    <Fade in={!exiting} timeout={600}>
      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1400,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          background: "#f5f0e8",
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px)
          `,
          "@media (prefers-reduced-motion: reduce)": {
            "& *": {
              animationDuration: "0.01ms !important",
              animationDelay: "0ms !important",
              animationIterationCount: "1 !important",
            },
          },
        }}
      >
        {/* Headroom so the risen letter stays on screen and the whole
            composition reads as centered once it's out. */}
        <Box sx={{ pt: { xs: "120px", sm: "150px" } }}>
          <Box
            sx={{
              ...(!opened && { animation: `${idleTilt} 5s ease-in-out infinite` }),
            }}
          >
            {/* Envelope */}
            <Box
              aria-label={opened ? undefined : `Open your invitation to ${eventTitle}`}
              role={opened ? undefined : "button"}
              sx={{
                position: "relative",
                width: { xs: 300, sm: 360 },
                height: { xs: 208, sm: 250 },
                cursor: opened ? "default" : "pointer",
                isolation: "isolate",
                perspective: "900px",
                transition: "transform 0.25s ease",
                "&:hover": opened ? {} : { transform: "translateY(-3px)" },
                "&:focus-visible": {
                  outline: `2px solid ${tokens.orange}`,
                  outlineOffset: "6px",
                  borderRadius: "6px",
                },
              }}
              tabIndex={opened ? -1 : 0}
              onClick={handleOpen}
              onKeyDown={handleKeyDown}
            >
              {/* Back of the envelope (the inside you see through the mouth) */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  background: paper.inside,
                  borderRadius: "4px",
                  boxShadow: "0 10px 30px rgba(80,60,30,0.20), 0 2px 6px rgba(80,60,30,0.12)",
                  zIndex: 0,
                }}
              />

              {/* Flap — folds back on its top hinge. Halfway through it drops
                  below the letter so the letter can slide out in front of it. */}
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  transformOrigin: "top center",
                  transformStyle: "preserve-3d",
                  zIndex: 4,
                  filter: "drop-shadow(0 2px 3px rgba(80,60,30,0.18))",
                  ...(opened && {
                    animation: `${flapOpen} 0.7s cubic-bezier(0.45, 0.05, 0.25, 1) 0.25s forwards`,
                  }),
                }}
              >
                <Box
                  sx={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(180deg, ${paper.flap} 0%, ${paper.flapBack} 100%)`,
                    borderRadius: "4px 4px 0 0",
                    clipPath: `polygon(0 0, 100% 0, 50% ${FLAP_TIP * 100}%)`,
                  }}
                />
              </Box>

              {/* Letter — tucked inside, rises out once the flap is back */}
              <Box
                sx={{
                  position: "absolute",
                  top: 8,
                  left: 14,
                  right: 14,
                  bottom: 8,
                  zIndex: 2,
                  background: "#fffdf8",
                  borderRadius: "3px",
                  border: "1px solid #e2d8c2",
                  boxShadow: "0 -2px 10px rgba(80,60,30,0.10)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: 0.75,
                  px: 3,
                  pt: { xs: 2.25, sm: 2.75 },
                  ...(opened && {
                    animation: `${letterRise} 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.95s both`,
                  }),
                }}
              >
                <Typography
                  sx={{
                    fontFamily: '"Bebas Neue", "Helvetica Neue", sans-serif',
                    letterSpacing: "0.28em",
                    color: tokens.orange,
                    fontSize: "0.75rem",
                    lineHeight: 1,
                  }}
                >
                  YOU&apos;RE INVITED
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontStyle: "italic",
                    fontSize: "0.9rem",
                    color: tokens.muted,
                    lineHeight: 1.1,
                  }}
                >
                  to
                </Typography>
                <Typography
                  sx={{
                    fontFamily: '"Bebas Neue", "Helvetica Neue", sans-serif',
                    fontSize: { xs: "1.6rem", sm: "1.9rem" },
                    color: tokens.navy,
                    textAlign: "center",
                    lineHeight: 1.05,
                    letterSpacing: "0.02em",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    wordBreak: "break-word",
                  }}
                >
                  {eventTitle}
                </Typography>
              </Box>

              {/* Front pocket — always in front of the letter */}
              <Box sx={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
                <FrontPocket />
              </Box>

              {/* Wax seal — sits on the flap's point; cracks away on open */}
              <Box
                sx={{
                  position: "absolute",
                  top: `${FLAP_TIP * 100}%`,
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 5,
                  pointerEvents: "none",
                  animation: opened
                    ? `${sealCrack} 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards`
                    : `${sealHint} 2.4s ease-in-out infinite`,
                }}
              >
                <WaxSeal />
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Hint / CTA slot — fixed height so nothing shifts when it swaps */}
        <Box
          sx={{
            mt: { xs: 5, sm: 6 },
            minHeight: 80,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          {opened ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1,
                animation: `${fadeInUp} 0.45s ease 1.75s both`,
              }}
            >
              <Button
                autoFocus
                sx={{
                  background: tokens.navy,
                  color: "#fff",
                  borderRadius: 100,
                  px: 4,
                  py: 1.25,
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  boxShadow: "0 4px 16px rgba(26,31,58,0.22)",
                  "&:hover": {
                    background: tokens.orange,
                    transform: "scale(1.03)",
                  },
                  transition: "all 0.2s",
                }}
                onClick={handleReveal}
              >
                View Event
              </Button>
            </Box>
          ) : (
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: "rgba(100,85,60,0.7)",
                animation: `${hintPulse} 2.4s ease-in-out infinite`,
              }}
            >
              Tap the envelope to open
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
}

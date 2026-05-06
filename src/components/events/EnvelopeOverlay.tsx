import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import { keyframes } from "@mui/material";
import { tokens } from "../../styles/theme";

// ─── Choreography ─────────────────────────────────────────────────────────────
// 0.00–0.50s   seal cracks (scale + rotate, fades out)
// 0.20–0.90s   flap rotates open + fades to invisible
// 0.70–1.40s   envelope body + front pocket fade out, revealing the letter
// 1.30s+       "View Event" CTA fades in

const flapOpen = keyframes`
  0%   { transform: rotateX(0deg);   opacity: 1; }
  60%  { opacity: 0.85; }
  100% { transform: rotateX(180deg); opacity: 0; }
`;

const envelopeFade = keyframes`
  from { opacity: 1; }
  to   { opacity: 0; }
`;

const sealCrack = keyframes`
  0%   { transform: translateX(-50%) scale(1)    rotate(0deg);  opacity: 1; }
  25%  { transform: translateX(-50%) scale(1.08) rotate(-3deg); opacity: 1; }
  100% { transform: translateX(-50%) scale(0.6)  rotate(10deg); opacity: 0; }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(8px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

const idleTilt = keyframes`
  0%, 100% { transform: rotate(-1.2deg); }
  50%      { transform: rotate(1.2deg); }
`;

const sealHint = keyframes`
  0%, 100% { filter: drop-shadow(0 2px 4px rgba(26,31,58,0.25)); }
  50%      { filter: drop-shadow(0 4px 12px rgba(26,31,58,0.55)); }
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
      viewBox="0 0 52 52"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      sx={{ width: "52px", height: "52px", display: "block" }}
    >
      <ellipse cx="26" cy="10" rx="6" ry="5" fill={wax} />
      <ellipse cx="38" cy="15" rx="5" ry="6" fill={wax} />
      <ellipse cx="42" cy="28" rx="5" ry="5" fill={wax} />
      <ellipse cx="36" cy="40" rx="6" ry="5" fill={wax} />
      <ellipse cx="16" cy="40" rx="5" ry="5" fill={wax} />
      <ellipse cx="10" cy="27" rx="5" ry="5" fill={wax} />
      <ellipse cx="14" cy="14" rx="5" ry="6" fill={wax} />
      <circle cx="26" cy="26" r="20" fill={wax} />
      <circle
        cx="26"
        cy="26"
        r="15"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <path
        d="M32 20 A9 9 0 1 0 32 32"
        fill="none"
        stroke="rgba(255,255,255,0.85)"
        strokeWidth="2.5"
        strokeLinecap="round"
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
          background: "#f5f0e8",
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px),
            repeating-linear-gradient(90deg, transparent, transparent 24px, rgba(180,160,120,0.07) 24px, rgba(180,160,120,0.07) 25px)
          `,
        }}
      >
        {/* Envelope wrapper */}
        <Box
          onClick={handleOpen}
          sx={{
            position: "relative",
            width: { xs: 300, sm: 360 },
            height: { xs: 210, sm: 250 },
            cursor: opened ? "default" : "pointer",
            isolation: "isolate",
            ...(!opened && {
              animation: `${idleTilt} 5s ease-in-out infinite`,
            }),
            transition: "transform 0.2s",
            "&:hover": opened
              ? {}
              : {
                  transform: "scale(1.02)",
                  animation: "none",
                },
          }}
        >
          {/* Letter card — centered inside the envelope's footprint. The
              card stays put; the envelope around it dissolves to reveal it.
              z-index 5 keeps it behind the body / front pocket while they
              are still opaque, so the closed envelope reads correctly. */}
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: 24,
              right: 24,
              height: { xs: "172px", sm: "200px" },
              transform: "translateY(-50%)",
              background: "#fffdf8",
              borderRadius: "3px",
              border: "1px solid #d4c9b0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1.25,
              px: 3,
              py: 2.5,
              zIndex: 5,
              boxShadow: "0 4px 16px rgba(80,60,30,0.10)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontFamily: '"Bebas Neue", "Helvetica Neue", sans-serif',
                letterSpacing: "0.28em",
                color: tokens.orange,
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              YOU'RE INVITED
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontStyle: "italic",
                fontSize: "0.95rem",
                color: tokens.muted,
                textAlign: "center",
                lineHeight: 1.2,
              }}
            >
              to
            </Typography>
            <Typography
              sx={{
                fontFamily: '"Bebas Neue", "Helvetica Neue", sans-serif',
                fontSize: "clamp(1.4rem, 5.5vw, 1.85rem)",
                color: tokens.navy,
                textAlign: "center",
                lineHeight: 1.1,
                letterSpacing: "0.02em",
                px: 1,
              }}
            >
              {eventTitle}
            </Typography>
          </Box>

          {/* Envelope body — fades out after the flap is open */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "#faf6ee",
              borderRadius: "4px",
              border: "1.5px solid #c8b89a",
              boxShadow: "0 8px 32px rgba(80,60,30,0.18), 0 2px 8px rgba(80,60,30,0.10)",
              zIndex: 7,
              overflow: "hidden",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "50%",
                background:
                  "linear-gradient(135deg, #e8dfc8 50%, transparent 50%), linear-gradient(225deg, #e8dfc8 50%, transparent 50%)",
                backgroundSize: "50% 100%",
                backgroundPosition: "0 0, 100% 0",
                backgroundRepeat: "no-repeat",
                borderRadius: "0 0 4px 4px",
                opacity: 0.5,
              },
              ...(opened && {
                animation: `${envelopeFade} 0.7s ease 0.7s forwards`,
              }),
            }}
          />

          {/* Flap — rotates and fades simultaneously */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: { xs: "132px", sm: "152px" },
              background: "#e4d9c2",
              clipPath: "polygon(0 0, 100% 0, 50% 100%)",
              transformOrigin: "top center",
              zIndex: 8,
              filter: "drop-shadow(0 2px 4px rgba(80,60,30,0.12))",
              ...(opened && {
                animation: `${flapOpen} 0.7s cubic-bezier(0.4, 0.05, 0.2, 1) 0.2s forwards`,
              }),
            }}
          />

          {/* Front pocket — also fades, revealing the letter */}
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "100%",
              background:
                "linear-gradient(135deg, transparent 49.5%, #e8dfc8 50%), linear-gradient(225deg, transparent 49.5%, #e8dfc8 50%)",
              backgroundSize: "100%",
              backgroundRepeat: "no-repeat",
              zIndex: 11,
              pointerEvents: "none",
              ...(opened && {
                animation: `${envelopeFade} 0.7s ease 0.7s forwards`,
              }),
            }}
          />

          {/* Wax seal — sits on the flap visually; cracks and fades on click */}
          <Box
            sx={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 12,
              pointerEvents: "none",
              ...(!opened && {
                animation: `${sealHint} 2.4s ease-in-out infinite`,
              }),
              ...(opened && {
                animation: `${sealCrack} 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards`,
              }),
            }}
          >
            <WaxSeal />
          </Box>
        </Box>

        {/* CTA — fades in once the envelope has dissolved */}
        {opened && (
          <Box
            sx={{
              position: "absolute",
              bottom: { xs: "15%", sm: "20%" },
              left: "50%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              animation: `${fadeInUp} 0.45s ease 1.3s both`,
            }}
          >
            <Button
              onClick={handleReveal}
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
            >
              View Event
            </Button>
            <Typography sx={{ fontSize: "0.75rem", color: "rgba(100,85,60,0.7)" }}>
              You've been invited to {eventTitle}
            </Typography>
          </Box>
        )}

        {!opened && (
          <Typography
            sx={{
              position: "absolute",
              bottom: { xs: "15%", sm: "20%" },
              fontSize: "0.8125rem",
              color: "rgba(100,85,60,0.7)",
              animation: `${hintPulse} 2.4s ease-in-out infinite`,
            }}
          >
            Tap the seal to open
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

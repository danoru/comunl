import React, { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import { keyframes } from "@mui/material";
import { tokens } from "../../styles/theme";

const riseUp = keyframes`
  from { transform: translateY(0px); }
  to   { transform: translateY(-170px); }
`;

const flapOpen = keyframes`
  0% {
    transform: rotateX(0deg);
  }
  70% {
    transform: rotateX(185deg);
  }
  100% {
    transform: rotateX(180deg);
  }
`;

const shadowStretch = keyframes`
  from {
    opacity: 0;
    transform: scaleY(0.3);
  }
  to {
    opacity: 1;
    transform: scaleY(1);
  }
`;

const sealPress = keyframes`
  0% {
    transform: translateX(-50%) scale(1);
  }
  50% {
    transform: translateX(-50%) scale(0.92);
  }
  100% {
    transform: translateX(-50%) scale(1);
  }
`;

const fadeInUp = keyframes`
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to   { opacity: 1; transform: translateX(-50%) translateY(0); }
`;

const sealFade = keyframes`
  from { opacity: 1; transform: translateX(-50%) scale(1); }
  to   { opacity: 0; transform: translateX(-50%) scale(0.7); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.5; }
  50%       { opacity: 1; }
`;

interface EnvelopeOverlayProps {
  eventTitle: string;
  onReveal: () => void;
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
            perspective: "800px",
            isolation: "isolate",
          }}
        >
          {/* Letter card — rises out on open */}
          <Box
            sx={{
              position: "absolute",
              left: 28,
              right: 28,
              bottom: 16,
              height: "180px",
              background: "#fffdf8",
              borderRadius: "3px",
              border: "1px solid #d4c9b0",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              px: 2.5,
              py: 2,
              willChange: opened ? "transform" : "auto",
              zIndex: opened ? 8 : 5,
              boxShadow: "0 -2px 12px rgba(80,60,30,0.08)",
              ...(opened && {
                animation: `${riseUp} 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.35s forwards`,
              }),
              "&::after": opened
                ? {
                    content: '""',
                    position: "absolute",
                    bottom: -10,
                    left: "10%",
                    width: "80%",
                    height: "20px",
                    background: "rgba(0,0,0,0.08)",
                    filter: "blur(10px)",
                    transform: "scaleY(0.6)",
                    animation: `${shadowStretch} 0.85s ease forwards`,
                  }
                : {},
            }}
          >
            {/* Decorative letter lines */}
            <Box
              sx={{
                width: "55%",
                height: "3px",
                background: tokens.navy,
                borderRadius: 1,
                mb: 0.5,
              }}
            />
            {[80, 60, 80, 45, 80, 60].map((w, i) => (
              <Box
                key={i}
                sx={{ width: `${w}%`, height: "1.5px", background: "#e0d5c0", borderRadius: 1 }}
              />
            ))}
          </Box>

          {/* Envelope body */}
          <Box
            sx={{
              position: "absolute",
              inset: 0,

              background: "#faf6ee",
              borderRadius: "4px",
              border: "1.5px solid #c8b89a",
              boxShadow: "0 8px 32px rgba(80,60,30,0.18), 0 2px 8px rgba(80,60,30,0.10)",
              zIndex: 7,
              transform: opened ? "translateY(-2px)" : "translateY(0px)",
              transition: "transform 0.4s ease, box-shadow 0.4s ease",
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
            }}
          />

          {/* Flap — rotates open */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              width: 0,
              height: 0,
              borderLeft: { xs: "150px solid transparent", sm: "180px solid transparent" },
              borderRight: { xs: "150px solid transparent", sm: "180px solid transparent" },
              borderTop: "132px solid #e4d9c2",
              transformOrigin: "top center",
              transformStyle: "preserve-3d",
              zIndex: 7,
              filter: "drop-shadow(0 2px 4px rgba(80,60,30,0.12))",
              ...(opened && {
                animation: `${flapOpen} 0.75s cubic-bezier(0.4,0,0.2,1) forwards`,
              }),
            }}
          />
          {/* Front envelope lip (THIS FIXES THE INSIDE EFFECT) */}

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
            }}
          />

          {/* Wax seal */}
          <Box
            component="svg"
            viewBox="0 0 52 52"
            xmlns="http://www.w3.org/2000/svg"
            sx={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              width: "52px",
              height: "52px",
              zIndex: 20,
              ...(opened && {
                animation: `${sealFade} 0.25s ease 0.1s forwards, sealPress 0.2s ease 0s`,
              }),
            }}
          >
            <circle cx="26" cy="26" r="20" fill={tokens.navy} />
            <ellipse cx="26" cy="10" rx="6" ry="5" fill={tokens.navy} />
            <ellipse cx="38" cy="15" rx="5" ry="6" fill={tokens.navy} />
            <ellipse cx="42" cy="28" rx="5" ry="5" fill={tokens.navy} />
            <ellipse cx="36" cy="40" rx="6" ry="5" fill={tokens.navy} />
            <ellipse cx="16" cy="40" rx="5" ry="5" fill={tokens.navy} />
            <ellipse cx="10" cy="27" rx="5" ry="5" fill={tokens.navy} />
            <ellipse cx="14" cy="14" rx="5" ry="6" fill={tokens.navy} />
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
        </Box>

        {/* "View Event" CTA — fades in after letter rises */}
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
              animation: `${fadeInUp} 0.5s ease 0.9s both`,
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

        {/* Idle hint */}
        {!opened && (
          <Typography
            sx={{
              position: "absolute",
              bottom: { xs: "15%", sm: "20%" },
              fontSize: "0.8125rem",
              color: "rgba(100,85,60,0.65)",
              animation: `${pulse} 2s ease-in-out infinite`,
            }}
          >
            Click to open your invitation
          </Typography>
        )}
      </Box>
    </Fade>
  );
}

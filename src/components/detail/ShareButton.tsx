// Uses the Web Share API on mobile (native share sheet)
// Falls back to clipboard copy on desktop

import React, { useState } from "react";

import Button from "@mui/material/Button";
import Snackbar from "@mui/material/Snackbar";
import Tooltip from "@mui/material/Tooltip";

import ShareRoundedIcon from "@mui/icons-material/ShareRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";

import { tokens } from "../../styles/theme";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string; // defaults to window.location.href
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState(false);

  async function handleShare() {
    const baseUrl = url ?? window.location.href;

    const shareUrl = new URL(baseUrl);
    shareUrl.searchParams.set("invite", "true");

    const finalUrl = shareUrl.toString();

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: finalUrl,
        });
      } catch {}
      return;
    }

    try {
      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setSnackbar(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", finalUrl);
    }
  }

  return (
    <>
      <Tooltip title={copied ? "Copied!" : "Share event"}>
        <Button
          variant="outlined"
          size="small"
          onClick={handleShare}
          startIcon={
            copied ? (
              <CheckRoundedIcon sx={{ fontSize: "1rem !important" }} />
            ) : (
              <ShareRoundedIcon sx={{ fontSize: "1rem !important" }} />
            )
          }
          sx={{
            borderRadius: 100,
            borderColor: tokens.border,
            color: copied ? tokens.green : tokens.muted,
            borderWidth: "1.5px",
            fontSize: "0.8125rem",
            px: 2,
            transition: "all 0.2s",
            ...(copied && {
              borderColor: tokens.green,
              background: tokens.greenBg,
            }),
            "&:hover": {
              borderColor: tokens.orange,
              color: tokens.orange,
              background: tokens.orangeGlow,
            },
          }}
        >
          {copied ? "Copied!" : "Share"}
        </Button>
      </Tooltip>

      <Snackbar
        open={snackbar}
        onClose={() => setSnackbar(false)}
        autoHideDuration={2500}
        message="Link copied to clipboard"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: "12px",
            background: tokens.navy,
            fontSize: "0.875rem",
            fontWeight: 500,
          },
        }}
      />
    </>
  );
}

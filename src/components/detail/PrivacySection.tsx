import React from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import TextField from "@mui/material/TextField";
import Collapse from "@mui/material/Collapse";
import Alert from "@mui/material/Alert";

import LockRoundedIcon from "@mui/icons-material/LockRounded";

import { tokens } from "../../styles/theme";

interface PrivacySectionProps {
  isPrivate: boolean;
  inviteCode: string;
  onPrivateChange: (v: boolean) => void;
  onInviteCodeChange: (v: string) => void;
  // Pass a generated code to display when first enabling private mode
  generatedCode?: string;
}

export default function PrivacySection({
  isPrivate,
  inviteCode,
  onPrivateChange,
  onInviteCodeChange,
  generatedCode,
}: PrivacySectionProps) {
  return (
    <Box
      sx={{
        background: "#fff",
        border: `1.5px solid ${tokens.border}`,
        borderRadius: "16px",
        p: "8px 20px",
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isPrivate}
            onChange={(e) => onPrivateChange(e.target.checked)}
            sx={{
              "& .MuiSwitch-switchBase.Mui-checked": { color: tokens.orange },
              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                backgroundColor: tokens.orange,
              },
            }}
          />
        }
        label={
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <LockRoundedIcon
              sx={{ fontSize: 18, color: isPrivate ? tokens.orange : tokens.muted }}
            />
            <Box>
              <Typography sx={{ fontSize: "0.9375rem", fontWeight: 500 }}>Private event</Typography>
              <Typography variant="caption">
                Guests need an invite code to see the details
              </Typography>
            </Box>
          </Box>
        }
        sx={{ py: 1 }}
      />

      <Collapse in={isPrivate}>
        <Box sx={{ pb: 2, pt: 0.5, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <TextField
            label="Invite code"
            value={inviteCode}
            onChange={(e) => onInviteCodeChange(e.target.value.toUpperCase())}
            placeholder="Auto-generated if left blank"
            inputProps={{
              style: { letterSpacing: "0.15em", fontWeight: 700, textTransform: "uppercase" },
              maxLength: 12,
            }}
            helperText="Share this with your guests. Leave blank to auto-generate."
            fullWidth
            size="small"
          />

          {generatedCode && (
            <Alert severity="info" sx={{ borderRadius: "10px" }}>
              Generated code: <strong style={{ letterSpacing: "0.15em" }}>{generatedCode}</strong> —
              share this with your guests.
            </Alert>
          )}
        </Box>
      </Collapse>
    </Box>
  );
}

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import ListItemButton from "@mui/material/ListItemButton";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import React from "react";

import { tokens } from "../../styles/theme";

export interface HostUser {
  userId: string;
  name: string;
  handle: string | null;
  image: string | null;
}

interface CoHostPickerProps {
  value: HostUser[];
  onChange: (hosts: HostUser[]) => void;
  disabled?: boolean;
}

export default function CoHostPicker({ value, onChange, disabled }: CoHostPickerProps) {
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<HostUser[]>([]);

  React.useEffect(() => {
    if (search.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/users/search?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        setResults(
          Array.isArray(data)
            ? data.filter((u: HostUser) => !value.some((h) => h.userId === u.userId))
            : []
        );
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, value]);

  function add(user: HostUser) {
    onChange([...value, user]);
    setSearch("");
    setResults([]);
  }

  function remove(userId: string) {
    onChange(value.filter((h) => h.userId !== userId));
  }

  return (
    <Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
        {value.length === 0 && (
          <Typography sx={{ color: tokens.muted, fontStyle: "italic" }} variant="caption">
            No co-hosts yet
          </Typography>
        )}
        {value.map((host) => (
          <Chip
            key={host.userId}
            avatar={
              <Avatar src={host.image ?? undefined} sx={{ width: 24, height: 24 }}>
                {host.name[0]?.toUpperCase()}
              </Avatar>
            }
            label={
              <Box>
                <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, lineHeight: 1.2 }}>
                  {host.name}
                </Typography>
                {host.handle && (
                  <Typography sx={{ fontSize: "0.6875rem", color: tokens.muted, lineHeight: 1.2 }}>
                    @{host.handle}
                  </Typography>
                )}
              </Box>
            }
            sx={{
              height: "auto",
              py: 0.75,
              background: "#fff",
              border: `1.5px solid ${tokens.border}`,
              "& .MuiChip-label": { px: 1 },
            }}
            onDelete={disabled ? undefined : () => remove(host.userId)}
          />
        ))}
      </Box>

      {!disabled && (
        <Box sx={{ position: "relative" }}>
          <TextField
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon sx={{ fontSize: 18, color: tokens.muted }} />
                </InputAdornment>
              ),
            }}
            placeholder="Search by name or email…"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {results.length > 0 && (
            <Paper
              elevation={4}
              sx={{
                position: "absolute",
                top: "calc(100% + 4px)",
                left: 0,
                right: 0,
                zIndex: 10,
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              <List dense disablePadding>
                {results.map((user) => (
                  <ListItem key={user.userId} disablePadding>
                    <ListItemButton sx={{ gap: 1.5 }} onClick={() => add(user)}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar
                          src={user.image ?? undefined}
                          sx={{ width: 32, height: 32, fontSize: "0.875rem" }}
                        >
                          {user.name[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={user.handle ? `@${user.handle}` : undefined}
                        slotProps={{
                          primary: { fontSize: "0.875rem", fontWeight: 600 },
                          secondary: { fontSize: "0.75rem" },
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Paper>
          )}
        </Box>
      )}
    </Box>
  );
}

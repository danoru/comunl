import Backdrop from "@mui/material/Backdrop";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRouter } from "next/router";
import { useState } from "react";

import AdminItem from "../../../src/components/admin/admin-item";
import EditEvent from "../../../src/components/admin/edit-event";
import FeaturedToggle from "../../../src/components/admin/featured-toggle";
import GuestOnlyToggle from "../../../src/components/admin/guest-only-toggle";

function EventSettings() {
  const router = useRouter();
  const eventId = router.query.eventId;
  const eventLink = "/events/" + eventId;

  const [errorStatus, setErrorStatus] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const passwordError = errorStatus ? "Incorrect password." : "";

  const clickShowPasswordHandler = () => setShowPassword((show) => !show);

  const mouseDownPasswordHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  const passwordHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  function submitFormHandler(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password === "admin23") {
      setLoggedIn(true);
    } else {
      setErrorStatus(true);
      setPassword("");
    }
  }

  if (!loggedIn) {
    return (
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <form onSubmit={submitFormHandler}>
          <FormControl sx={{ m: 1, width: "25ch" }} variant="outlined">
            <InputLabel htmlFor="outlined-adornment-password">
              Password
            </InputLabel>
            <OutlinedInput
              error={errorStatus}
              id="outlined-adornment-password"
              label="Password"
              type={showPassword ? "text" : "password"}
              onChange={passwordHandler}
              value={password}
              endAdornment={
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={clickShowPasswordHandler}
                    onMouseDown={mouseDownPasswordHandler}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              }
            />
            <FormHelperText error id="password-error">
              {passwordError}
            </FormHelperText>
            <Button variant="contained" type="submit">
              Log In
            </Button>
          </FormControl>
        </form>
        <div>
          <Button href={eventLink}>Return to Event</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1>Event Settings for {eventId}</h1>
      <Backdrop
        open={loadingStatus}
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <div>
        <Divider>
          <h2>Host Recommendations</h2>
        </Divider>
        <AdminItem />
      </div>
      <div>
        <Divider>
          <h2>Event Options</h2>
        </Divider>
        <EditEvent setLoadingStatus={setLoadingStatus} />
        {/* <h3>Event Toggles</h3>
        <FeaturedToggle />
        <GuestOnlyToggle setLoadingStatus={setLoadingStatus} /> */}
      </div>
      <div style={{ marginTop: "15px" }}>
        <Button href={eventLink}>Return to Event</Button>
      </div>
    </div>
  );
}

export default EventSettings;

import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Notification from "../ui/notification";
import OutlinedInput from "@mui/material/OutlinedInput";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import moment from "moment";

import { DateTimePicker } from "@mui/x-date-pickers";
import { useState, useEffect } from "react";

async function fetchEventIds(userYear: any) {
  const response = await fetch("/api/events/");
  const data = await response.json();
  const eventIds = data
    .map((item: any) => item.id)
    .filter((id: any) => id.startsWith(userYear));
  return eventIds;
}

function CreateEvent() {
  const [id, setId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [flyer, setFlyer] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);
  const [isGuestOnly, setIsGuestOnly] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationSeverity, setNotificationSeverity] = useState<
    "success" | "error"
  >("success");

  const user = "admin";
  const currentYear = moment().format("YY");
  const userYear = user + currentYear;

  useEffect(() => {
    fetchEventIds(userYear)
      .then((eventIds) => {
        const incrementalNumber = eventIds.length + 1;
        const number = incrementalNumber.toString().padStart(2, "0");
        const newEventId = userYear + number;
        setId(newEventId);
        console.log(id);
      })
      .catch((error) => {
        console.error("Error fetching event IDs:", error);
      });
  }, []);

  const idHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setId(e.target.value);
  };
  const titleHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const descriptionHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);
  };
  const locationHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocation(e.target.value);
  };

  const flyerHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFlyer(e.target.value);
  };

  const featuredHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toggleValue = e.target.checked;
    setIsFeatured(toggleValue);
  };

  const guestOnlyHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toggleValue = e.target.checked;
    setIsGuestOnly(toggleValue);
  };

  const handleNotificationClose = () => {
    setNotificationOpen(false);
  };

  const submitFormHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = document.querySelector("form");

    const reqBody = {
      id: id,
      title: title,
      description: description,
      location: location,
      date: date,
      image: flyer,
      flyer: flyer,
      isFeatured: isFeatured,
      isGuestOnly: isGuestOnly,
    };

    try {
      fetch("/api/" + id, {
        method: "POST",
        body: JSON.stringify(reqBody),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Item creation failed");
          }
          return response.json();
        })
        .then((data) => {
          console.log(data);
          setNotificationOpen(true);
          setNotificationMessage("Item created successfully!");
          setNotificationSeverity("success");
        })
        .catch((error) => {
          console.error("Fetch error:", error);
          setNotificationOpen(true);
          setNotificationMessage("Item creation failed. Please try again.");
          setNotificationSeverity("error");
        });
    } catch (error) {
      console.error("Try-catch error:", error);
      setNotificationOpen(true);
      setNotificationMessage("Item creation failed. Please try again.");
      setNotificationSeverity("error");
    } finally {
      form?.reset();
    }
  };

  return (
    <form onSubmit={submitFormHandler}>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <InputLabel id="input-label">Event ID</InputLabel>
        <OutlinedInput
          id="outlined-adornment"
          onChange={idHandler}
          label="Event ID"
          value={id}
          disabled
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <InputLabel id="input-label">Title</InputLabel>
        <OutlinedInput
          id="outlined-adornment"
          onChange={titleHandler}
          label="Title"
          required
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <InputLabel id="input-label">Description</InputLabel>
        <OutlinedInput
          id="outlined-adornment"
          onChange={descriptionHandler}
          label="Description"
          required
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <InputLabel id="input-label">Location</InputLabel>
        <OutlinedInput
          id="outlined-adornment"
          onChange={locationHandler}
          label="Location"
          required
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <DateTimePicker
          disablePast
          label="Date"
          onChange={(newDate: any) => setDate(newDate)}
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <InputLabel id="input-label">Flyer</InputLabel>
        <OutlinedInput
          id="outlined-adornment"
          onChange={flyerHandler}
          label="Flyer"
          required
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <FormControlLabel
          label="Featured Event"
          labelPlacement="start"
          control={<Switch onChange={featuredHandler} />}
        />
      </FormControl>
      <FormControl
        sx={{
          m: 1,
          width: "25ch",
        }}
      >
        <FormControlLabel
          label="Guest Only"
          labelPlacement="start"
          control={<Switch onChange={guestOnlyHandler} />}
        />
      </FormControl>
      <br />
      <Button variant="contained" type="submit" sx={{ margin: "10px" }}>
        Create New Event
      </Button>
      <Notification
        open={notificationOpen}
        message={notificationMessage}
        severity={notificationSeverity}
        onClose={handleNotificationClose}
      />
    </form>
  );
}

export default CreateEvent;

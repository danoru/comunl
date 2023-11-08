import Grid from "@mui/material/Grid";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import DessertList from "./dessert-list";
import DrinkList from "./drink-list";
import GuestList from "./guest-list";
import MainDishList from "./main-dish-list";
import SideDishList from "./side-dish-list";
import SnackList from "./snack-list";
import SuppliesList from "./supplies-list";

function EventRSVPList(props: any) {
  const router = useRouter();
  const eventId = router.query.eventId;
  const [event] = props.data;
  const items = props.items;
  const setItems = props.setItems;

  const [showItems, setShowItems] = useState(true);
  const rsvp = event.isGuestOnly;

  const checkGuestOnly = () => {
    if (rsvp) {
      return (
        <Grid container spacing={2} justifyContent="center">
          {showItems && <GuestList items={items} />}
        </Grid>
      );
    } else {
      return (
        <Grid container spacing={2} justifyContent="space-around">
          {showItems && <GuestList items={items} />}
          {showItems && <MainDishList items={items} />}
          {showItems && <SideDishList items={items} />}
          {showItems && <SnackList items={items} />}
          {showItems && <DessertList items={items} />}
          {showItems && <DrinkList items={items} />}
          {showItems && <SuppliesList items={items} />}
        </Grid>
      );
    }
  };

  useEffect(() => {
    if (showItems) {
      fetch("/api/" + eventId + "/rsvp")
        .then((response) => response.json())
        .then((data) => {
          setItems(data.attendance);
        });
    }
  }, [showItems]);

  return <div>{checkGuestOnly()}</div>;
}

export default EventRSVPList;

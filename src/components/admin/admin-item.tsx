import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import OutlinedInput from "@mui/material/OutlinedInput";
import { useRouter } from "next/router";
import { useState } from "react";

function AdminItem(props: any) {
  const { eventId } = props;
  const router = useRouter();

  const [itemType, setItemType] = useState("");
  const [item, setItem] = useState("");

  const dynamicItemType = itemType === "guest-name" ? "Guest" : "Item";

  const selectionHandler = (e: SelectChangeEvent) => {
    setItemType(e.target.value);
  };

  const itemHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setItem(e.target.value);
  };

  const submitFormHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const enteredEventId = router.query.eventId;
    const enteredItem = item;
    const enteredItemType = itemType;
    const form = document.querySelector("form");

    const reqBody = {
      eventId: enteredEventId,
      item: enteredItem,
      itemType: enteredItemType,
    };

    fetch("/api/" + eventId + "/rsvp", {
      method: "POST",
      body: JSON.stringify(reqBody),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data));

    form?.reset();
  };

  return (
    <div>
      <form onSubmit={submitFormHandler}>
        <FormControl
          sx={{
            m: 1,
            width: "25ch",
          }}
          variant="outlined"
        >
          <InputLabel id="select-label">Type</InputLabel>
          <Select
            id="item-type"
            label="Type"
            onChange={selectionHandler}
            value={itemType}
          >
            <MenuItem value="recommendation" id="recommendation">
              Recommendation
            </MenuItem>
            <MenuItem value="guest-name" id="guest-name">
              Guest Name
            </MenuItem>
            <MenuItem value="main-dish" id="main-dish">
              Main Dish
            </MenuItem>
            <MenuItem value="side-dish" id="side-dish">
              Side Dish
            </MenuItem>
            <MenuItem value="snack" id="snack">
              Snack
            </MenuItem>
            <MenuItem value="dessert" id="dessert">
              Dessert
            </MenuItem>
            <MenuItem value="drink" id="drink">
              Drink
            </MenuItem>
            <MenuItem value="supplies" id="supplies">
              Supplies
            </MenuItem>
          </Select>
        </FormControl>
        <FormControl
          sx={{
            m: 1,
            width: "25ch",
          }}
        >
          <InputLabel id="input-label">{dynamicItemType}</InputLabel>
          <OutlinedInput
            id="outlined-adornment"
            label={dynamicItemType}
            onChange={itemHandler}
          />
        </FormControl>
        <Button
          sx={{
            m: 1,
            width: "25ch",
            height: "7ch",
          }}
          variant="contained"
          type="submit"
        >
          Add {dynamicItemType}
        </Button>
      </form>
    </div>
  );
}

export default AdminItem;

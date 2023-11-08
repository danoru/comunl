import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Switch from "@mui/material/Switch";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";

function FeaturedToggle() {
  const router = useRouter();
  const eventId = router.query.eventId;

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    fetch("/api/" + eventId, { method: "GET" })
      .then((response) => response.json())
      .then((data) => {
        setIsChecked(data?.[0]?.isFeatured);
      });
  }, []);

  const toggleFeaturedEvent = (isChecked: boolean) => {
    fetch("/api/" + eventId + "/toggleValues", {
      method: "PUT",
      body: JSON.stringify({
        id: eventId,
        isFeatured: isChecked,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => console.log(data));
  };

  const switchHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    const toggleValue = e.target.checked;
    setIsChecked(toggleValue);
    toggleFeaturedEvent(toggleValue);
  };

  return (
    <FormGroup>
      <FormControlLabel
        label="Featured Event"
        labelPlacement="start"
        control={
          <Switch disabled checked={isChecked} onChange={switchHandler} />
        }
        sx={{ margin: "auto" }}
      />
    </FormGroup>
  );
}

export default FeaturedToggle;

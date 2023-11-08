import Stack from "@mui/material/Stack";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";

function HostRecommendations() {
  const router = useRouter();
  const eventId = router.query.eventId;

  const [showItems, setShowItems] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (showItems) {
      fetch("/api/" + eventId + "/rsvp")
        .then((response) => response.json())
        .then((data) => {
          setItems(data.attendance);
        });
    }
  }, [showItems]);

  const checkRecommendation = () => {
    if (
      items?.filter(
        (item: any) =>
          item.itemEntry.itemType === "recommendation" &&
          item.itemEntry.eventId === eventId
      ).length === 0
    ) {
      return <div></div>;
    } else {
      return (
        <div>
          <h3>Host Recommendations</h3>
          <Stack
            alignItems="center"
            direction="row"
            flexWrap="wrap"
            justifyContent="center"
            spacing={4}
          >
            {items
              ?.filter(
                (item: any) =>
                  item.itemEntry.itemType === "recommendation" &&
                  item.itemEntry.eventId === eventId
              )
              .map((item: any) => (
                <div key={item._id}>
                  <p>{item.itemEntry.item}</p>
                </div>
              ))}
          </Stack>
        </div>
      );
    }
  };

  return <div>{checkRecommendation()}</div>;
}

export default HostRecommendations;

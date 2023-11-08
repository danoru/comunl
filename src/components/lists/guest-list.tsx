import Grid from "@mui/material/Grid";

import { useRouter } from "next/router";

function GuestList(props: any) {
  const { items } = props;
  const router = useRouter();

  const eventId = router.query.eventId;

  const rsvpList = items
    ?.filter(
      (item: any) =>
        item.itemEntry.itemType === "guest-name" &&
        item.itemEntry.eventId === eventId
    )
    .map((item: any) => (
      <li key={item._id}>
        <p>{item.itemEntry.item}</p>
      </li>
    ));

  const guestCount = rsvpList.length;

  return (
    <Grid item xs={6} sm={4} md={1}>
      <h3>Guest List ({guestCount})</h3>
      <div>
        <ul>{rsvpList}</ul>
      </div>
    </Grid>
  );
}

export default GuestList;

import Grid from "@mui/material/Grid";

import { useRouter } from "next/router";

function SuppliesList(props: any) {
  const { items } = props;
  const router = useRouter();

  const eventId = router.query.eventId;

  return (
    <Grid item xs={6} sm={4} md={1}>
      <h3>Supplies</h3>
      <div>
        <ul>
          {items
            ?.filter(
              (item: any) =>
                item.itemEntry.itemType === "supplies" &&
                item.itemEntry.eventId === eventId
            )
            .map((item: any) => (
              <li key={item._id}>
                <p>{item.itemEntry.item}</p>
              </li>
            ))}
        </ul>
      </div>
    </Grid>
  );
}

export default SuppliesList;

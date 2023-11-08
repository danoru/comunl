import Head from "next/head";
import Image from "next/image";
import moment from "moment";
import { Fragment, useState } from "react";

// import AttendanceRegistration from "../components/input/attendance-registration";
import EventRSVPList from "../../../src/components/lists/event-rsvp-list";
import HostRecommendations from "../../../src/components/admin/host-recommendations";
import NewItem from "../../../src/components/input/new-item";

import { EVENT_DATA_TYPE, ITEM_ENTRY_TYPE } from "../../../src/types/index";

interface Props {
  data: EVENT_DATA_TYPE[];
}

function EventDetailPage(props: Props) {
  const [event] = props.data;
  const [items, setItems]: any = useState([]);

  function updateItems(newItem: ITEM_ENTRY_TYPE) {
    const newItemEntry = { _id: "", itemEntry: newItem };
    setItems([...items, newItemEntry]);
  }

  const pageTitle = "Comunl: " + event.title;
  const formattedAddress = event.location.replace("--", " / ");
  const humanReadableDate = moment(event.date).format(
    "dddd, MMMM Do YYYY [at] h:mm A"
  );

  const timeUntilDate = moment(event.date).startOf("hour").fromNow();

  const checkTense = () => {
    if (moment(event.date).isSameOrAfter()) {
      return "is " + timeUntilDate;
    } else if (moment(event.date).isBefore()) {
      return "was " + timeUntilDate;
    }
  };

  const checkRSVP = () => {
    if (moment(event.date).isSameOrAfter()) {
      return <NewItem updateItems={updateItems} {...props} />;
    } else if (moment(event.date).isBefore()) {
      return;
    }
  };

  if (!event) {
    return (
      <div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Fragment>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={event.description} />
      </Head>
      {/* <AttendanceRegistration /> */}
      <div>
        <h1>{event.title}</h1>
        <h2>{formattedAddress}</h2>
        <h2>{humanReadableDate}</h2>
        <h3>This event {checkTense()}.</h3>
      </div>
      <Image src={event.flyer} width="450" height="450" />
      <HostRecommendations />
      {checkRSVP()}
      <EventRSVPList items={items} setItems={setItems} {...props} />
    </Fragment>
  );
}

export async function getStaticProps({ params }: any) {
  const { eventId } = params;

  const dev = process.env.NODE_ENV !== "production";
  const { DEV_URL, PROD_URL } = process.env;

  const response = await fetch(`${dev ? DEV_URL : PROD_URL}/api/` + eventId);
  const data = await response.json();

  console.log(data);
  console.log(DEV_URL);
  return {
    props: {
      data,
    },
    revalidate: 30,
  };
}

export async function getStaticPaths(props: any) {
  // const eventId = props.eventId;

  // const dev = process.env.NODE_ENV !== "production";
  // const { DEV_URL, PROD_URL } = process.env;

  // const response = await fetch(`${dev ? DEV_URL : PROD_URL}/api/${eventId}`);
  // const data = await response.json();

  // const paths = data.map((event: any) => ({ params: { eventId: event.id } }));

  return {
    paths: [],
    fallback: "blocking",
  };
}

export default EventDetailPage;

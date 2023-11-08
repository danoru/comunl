import { Fragment } from "react";
import Head from "next/head";

import EventList from "../../src/components/events/event-list";

function EventsPage(props: any) {
  const { events } = props;

  return (
    <Fragment>
      <Head>
        <title>Comunl: All Events</title>
        <meta
          name="description"
          content="Find a lot of great events to attend with your friends!"
        />
      </Head>
      <EventList items={events} />
    </Fragment>
  );
}

export async function getServerSideProps() {
  const dev = process.env.NODE_ENV !== "production";
  const { DEV_URL, PROD_URL } = process.env;

  const response = await fetch(`${dev ? DEV_URL : PROD_URL}/api/events`);
  const data = await response.json();

  return {
    props: {
      events: data,
    },
  };
}

export default EventsPage;

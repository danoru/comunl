import { Fragment } from "react";

import Navbar from "./navbar";

function Layout(props: any) {
  return (
    <Fragment>
      <Navbar />
      <main>{props.children}</main>
    </Fragment>
  );
}

export default Layout;

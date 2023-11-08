import React, { useState } from "react";
import classes from "./attendance-registration.module.css";

function AttendanceRegistration() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {showModal ? (
        <div className={classes.modal}>
          <div className={classes.form}>
            <form>
              <h2>If you can see this, things are not working properly.</h2>
              <div>
                <input type="name" id="name" placeholder="Your Name" />
              </div>
              <div>
                <select>
                  <option value="main-dish">Main Dish</option>
                  <option value="side-dish">Side Dish</option>
                  <option value="snack">Snack</option>
                  <option value="dessert">Dessert</option>
                  <option value="drink">Drink</option>
                </select>
                <input type="name" id="name" placeholder="Your Items" />
              </div>
              <button>Submit RSVP</button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </form>
          </div>
        </div>
      ) : null}
      <button type="button" onClick={() => setShowModal(true)}>
        RSVP Here!
      </button>
    </div>
  );
}

export default AttendanceRegistration;

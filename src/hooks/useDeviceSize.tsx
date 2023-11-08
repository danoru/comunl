import * as React from "react";

export const useDeviceSize = (): { height: number; width: number } => {
  const [width, setWidth] = React.useState(0);
  const [height, setHeight] = React.useState(0);

  const handleWindowResize = () => {
    setWidth(window.innerWidth);
    setHeight(window.innerHeight);
  };

  React.useEffect(() => {
    // component is mounted and window is available
    handleWindowResize();
    window.addEventListener("resize", handleWindowResize);
    // unsubscribe from the event on component unmount
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  return { height, width };
};

export default useDeviceSize;

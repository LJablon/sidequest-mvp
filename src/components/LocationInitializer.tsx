"use client";

import { useEffect } from "react";
import { getInitialBrowserLocation } from "@/libs/location";
import useCurrentLocation from "../hooks/useCurrentLocation";

export default function LocationInitializer() {
  const startLocationRequest = useCurrentLocation(
    (state) => state.startLocationRequest
  );
  const resolveLocation = useCurrentLocation((state) => state.resolveLocation);

  useEffect(() => {
    let active = true;

    startLocationRequest();
    void getInitialBrowserLocation().then((resolution) => {
      if (active) {
        resolveLocation(resolution);
      }
    });

    return () => {
      active = false;
    };
  }, [resolveLocation, startLocationRequest]);

  return null;
}

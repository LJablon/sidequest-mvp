"use client";

import { useEffect, useRef, useState } from "react";
import type { HTMLAttributes } from "react";
import { getGoogleMapsLoader, GOOGLE_MAP_ID } from "@/libs/googleMaps";
import type { Location } from "@/libs/location";

type Props = HTMLAttributes<HTMLDivElement> & {
  location: Location;
};

export default function LocationMap({ location, ...divProps }: Props) {
  const mapsDivRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { lat, lng } = location;

  useEffect(() => {
    let active = true;
    let marker: google.maps.marker.AdvancedMarkerElement | null = null;

    async function initializeMap() {
      try {
        setLoadError(null);
        const loader = getGoogleMapsLoader();
        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        if (!active || !mapsDivRef.current) {
          return;
        }

        const center = { lat, lng };
        const map = new Map(mapsDivRef.current, {
          mapId: GOOGLE_MAP_ID,
          center,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
        });

        marker = new AdvancedMarkerElement({ map, position: center });
      } catch (error) {
        if (active) {
          setLoadError(
            error instanceof Error ? error.message : "Unable to load Google Maps."
          );
        }
      }
    }

    void initializeMap();

    return () => {
      active = false;
      if (marker) {
        marker.map = null;
      }
    };
  }, [lat, lng]);

  return (
    <>
      <div {...divProps} ref={mapsDivRef} />
      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}
    </>
  );
}

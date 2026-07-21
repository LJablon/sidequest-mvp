"use client";

import { useEffect, useRef, useState } from "react";
import { getGoogleMapsLoader, GOOGLE_MAP_ID } from "@/libs/googleMaps";
import type { Location } from "@/libs/location";

export type { Location } from "@/libs/location";

export default function LocationPicker({
  defaultLocation,
  onChange,
  gpsCoords,
}: {
  defaultLocation: Location;
  onChange: (location: Location) => void;
  gpsCoords: Location | null;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const center = gpsCoords ?? defaultLocation;
  const { lat, lng } = center;

  useEffect(() => {
    let active = true;
    let clickListener: google.maps.MapsEventListener | null = null;
    let marker: google.maps.marker.AdvancedMarkerElement | null = null;

    async function initializeMap() {
      try {
        setLoadError(null);
        const loader = getGoogleMapsLoader();
        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");

        if (!active || !divRef.current) {
          return;
        }

        const initialPosition = { lat, lng };
        const map = new Map(divRef.current, {
          mapId: GOOGLE_MAP_ID,
          center: initialPosition,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
        });

        marker = new AdvancedMarkerElement({
          map,
          position: initialPosition,
        });

        clickListener = map.addListener(
          "click",
          (event: google.maps.MapMouseEvent) => {
            if (!event.latLng || !marker) {
              return;
            }

            marker.position = event.latLng;
            onChange({ lat: event.latLng.lat(), lng: event.latLng.lng() });
          }
        );
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
      clickListener?.remove();
      if (marker) {
        marker.map = null;
      }
    };
  }, [lat, lng, onChange]);

  return (
    <>
      <div ref={divRef} className="h-[200px] w-full" />
      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}
    </>
  );
}

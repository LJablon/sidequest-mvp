"use client";

import { useEffect, useRef, useState } from "react";
import { getGoogleMapsLoader, GOOGLE_MAP_ID } from "@/libs/googleMaps";
import type { Location } from "@/libs/location";
import useCurrentLocation from "../hooks/useCurrentLocation";

function locationsMatch(
  first: Location | null | undefined,
  second: Location | null | undefined
) {
  return first?.lat === second?.lat && first?.lng === second?.lng;
}

function zoomForRadius(radius: number) {
  if (radius > 1_500_000) return 1;
  if (radius > 800_000) return 2;
  if (radius > 400_000) return 3;
  if (radius > 180_000) return 4;
  if (radius > 100_000) return 5;
  if (radius > 50_000) return 6;
  if (radius > 25_000) return 7;
  if (radius > 11_000) return 8;
  if (radius > 5_000) return 9;
  return 10;
}

export default function DistancePicker({
  onChange,
  defaultRadius,
}: {
  onChange: ({ radius, center }: { radius: number; center: Location }) => void;
  defaultRadius: number;
}) {
  const [radius, setRadius] = useState(defaultRadius);
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const mapsDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const center = useCurrentLocation((state) => state.currLocation);
  const locationStatus = useCurrentLocation((state) => state.locationStatus);
  const locationError = useCurrentLocation((state) => state.locationError);
  const setCenter = useCurrentLocation((state) => state.setCurrLocation);
  const currentCenterRef = useRef(center);
  const hasCenter = center !== null;
  const centerLatitude = center?.lat;
  const centerLongitude = center?.lng;

  useEffect(() => {
    currentCenterRef.current = center;
  }, [center]);

  useEffect(() => {
    const initialCenter = currentCenterRef.current;
    if (!hasCenter || !initialCenter || !mapsDiv.current) {
      setMapReady(false);
      return;
    }

    let active = true;
    let radiusListener: google.maps.MapsEventListener | null = null;
    let centerListener: google.maps.MapsEventListener | null = null;

    async function initializeMap() {
      try {
        setMapError(null);
        const loader = getGoogleMapsLoader();
        const { Map, Circle } = await loader.importLibrary("maps");

        if (!active || !mapsDiv.current) {
          return;
        }

        const map = new Map(mapsDiv.current, {
          mapId: GOOGLE_MAP_ID,
          center: initialCenter,
          zoom: zoomForRadius(defaultRadius),
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: true,
        });
        const circle = new Circle({
          map,
          strokeColor: "#FF0000",
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: "#FF0000",
          fillOpacity: 0.35,
          center: initialCenter,
          radius: defaultRadius,
          editable: true,
        });

        mapRef.current = map;
        circleRef.current = circle;

        radiusListener = circle.addListener("radius_changed", () => {
          const nextRadius = circle.getRadius();
          setRadius(nextRadius);
          map.setZoom(zoomForRadius(nextRadius));
        });

        centerListener = circle.addListener("center_changed", () => {
          const nextCenter = circle.getCenter()?.toJSON();
          const storedCenter = useCurrentLocation.getState().currLocation;

          if (nextCenter && !locationsMatch(nextCenter, storedCenter)) {
            setCenter(nextCenter);
          }
        });

        setMapReady(true);
      } catch (error) {
        if (active) {
          setMapError(
            error instanceof Error ? error.message : "Unable to load Google Maps."
          );
        }
      }
    }

    void initializeMap();

    return () => {
      active = false;
      radiusListener?.remove();
      centerListener?.remove();
      circleRef.current?.setMap(null);
      circleRef.current = null;
      mapRef.current = null;
    };
  }, [defaultRadius, hasCenter, setCenter]);

  useEffect(() => {
    if (
      !mapReady ||
      centerLatitude === undefined ||
      centerLongitude === undefined
    ) {
      return;
    }

    const nextCenter = { lat: centerLatitude, lng: centerLongitude };
    const circle = circleRef.current;
    const map = mapRef.current;

    if (circle && !locationsMatch(circle.getCenter()?.toJSON(), nextCenter)) {
      circle.setCenter(nextCenter);
    }
    map?.setCenter(nextCenter);
  }, [centerLatitude, centerLongitude, mapReady]);

  useEffect(() => {
    if (centerLatitude === undefined || centerLongitude === undefined) {
      return;
    }

    onChange({
      center: { lat: centerLatitude, lng: centerLongitude },
      radius,
    });
  }, [centerLatitude, centerLongitude, onChange, radius]);

  return (
    <>
      <label>Where</label>
      <div ref={mapsDiv} className="h-48 w-full bg-gray-200">
        {!center && (
          <div className="p-4 text-gray-500" aria-live="polite">
            {locationStatus === "loading"
              ? "Finding your location..."
              : "Preparing location..."}
          </div>
        )}
      </div>
      {locationStatus === "fallback" && locationError && (
        <p className="text-sm text-amber-700">
          Using the default search location. {locationError}
        </p>
      )}
      {mapError && (
        <p className="text-sm text-red-600" role="alert">
          {mapError}
        </p>
      )}
    </>
  );
}

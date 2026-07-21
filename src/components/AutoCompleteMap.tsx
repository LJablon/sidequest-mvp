"use client";

import { useEffect, useRef, useState } from "react";
import { getGoogleMapsLoader, GOOGLE_MAP_ID } from "@/libs/googleMaps";
import type { Location } from "@/libs/location";
import type { FormattedAutocompleteLocation } from "@/libs/types";

interface AutoCompleteMapProps {
  defaultLocation?: Location;
  mapHeight?: string;
  onLocationChange: (location: Location) => void;
  onFormattedLocationChange: (location: FormattedAutocompleteLocation) => void;
}

export default function AutoCompleteMap({
  defaultLocation,
  mapHeight = "300px",
  onLocationChange,
  onFormattedLocationChange,
}: AutoCompleteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const placesAutoCompleteRef = useRef<HTMLInputElement>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const latitude = defaultLocation?.lat;
  const longitude = defaultLocation?.lng;

  useEffect(() => {
    if (latitude === undefined || longitude === undefined) {
      return;
    }

    const initialPosition = { lat: latitude, lng: longitude };
    let active = true;
    let placeListener: google.maps.MapsEventListener | null = null;
    let marker: google.maps.marker.AdvancedMarkerElement | null = null;

    async function initializeMap() {
      try {
        setIsLoaded(false);
        setLoadError(null);

        const loader = getGoogleMapsLoader();
        const { Map } = await loader.importLibrary("maps");
        const { AdvancedMarkerElement } = await loader.importLibrary("marker");
        const { Autocomplete } = await loader.importLibrary("places");

        if (!active || !mapRef.current || !placesAutoCompleteRef.current) {
          return;
        }

        const map = new Map(mapRef.current, {
          center: initialPosition,
          zoom: 17,
          mapId: GOOGLE_MAP_ID,
        });

        marker = new AdvancedMarkerElement({
          map,
          position: initialPosition,
          title: "Quest location",
        });

        const autoComplete = new Autocomplete(placesAutoCompleteRef.current, {
          fields: [
            "formatted_address",
            "name",
            "geometry",
            "vicinity",
            "place_id",
          ],
        });

        placeListener = autoComplete.addListener("place_changed", () => {
          const selectedPlace = autoComplete.getPlace();
          const position = selectedPlace.geometry?.location;

          if (!position || !marker) {
            return;
          }

          const location = { lat: position.lat(), lng: position.lng() };
          const formattedLocation: FormattedAutocompleteLocation = {
            formatted_address: selectedPlace.formatted_address ?? "",
            name: selectedPlace.name ?? "",
            location,
            vicinity: selectedPlace.vicinity ?? "",
            place_id: selectedPlace.place_id ?? "",
          };

          setPlace(formattedLocation.formatted_address);
          marker.position = position;
          map.setCenter(position);
          onFormattedLocationChange(formattedLocation);
          onLocationChange(location);
        });

        setIsLoaded(true);
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
      placeListener?.remove();
      if (marker) {
        marker.map = null;
      }
    };
  }, [latitude, longitude, onFormattedLocationChange, onLocationChange]);

  return (
    <div className="flex flex-col space-y-4">
      {!isLoaded && !loadError && (
        <p aria-live="polite">Loading Google Maps...</p>
      )}
      {loadError && (
        <p className="text-sm text-red-600" role="alert">
          {loadError}
        </p>
      )}
      <input
        id="quest-location"
        type="text"
        placeholder="Quest Location"
        ref={placesAutoCompleteRef}
        disabled={!isLoaded}
      />
      {place && <p>{place}</p>}
      <div style={{ height: mapHeight }} ref={mapRef} />
    </div>
  );
}

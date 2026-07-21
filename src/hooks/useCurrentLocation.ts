import { create } from "zustand";
import type { Location, LocationResolution } from "@/libs/location";

export type LocationStatus = "idle" | "loading" | "granted" | "fallback";

interface CurrentLocationStore {
  currLocation: Location | null;
  locationStatus: LocationStatus;
  locationError: string | null;
  setCurrLocation: (location: Location | null) => void;
  startLocationRequest: () => void;
  resolveLocation: (resolution: LocationResolution) => void;
}

const useCurrentLocation = create<CurrentLocationStore>((set) => ({
  currLocation: null,
  locationStatus: "idle",
  locationError: null,
  setCurrLocation: (location) => set({ currLocation: location }),
  startLocationRequest: () =>
    set({ locationStatus: "loading", locationError: null }),
  resolveLocation: ({ location, source, error }) =>
    set({
      currLocation: location,
      locationStatus: source === "geolocation" ? "granted" : "fallback",
      locationError: error,
    }),
}));

export default useCurrentLocation;

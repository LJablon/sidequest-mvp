import { beforeEach, describe, expect, test } from "bun:test";
import useCurrentLocation from "./useCurrentLocation";

describe("useCurrentLocation", () => {
  beforeEach(() => {
    useCurrentLocation.setState({
      currLocation: null,
      locationStatus: "idle",
      locationError: null,
    });
  });

  test("does not treat the fallback as resolved before geolocation runs", () => {
    const state = useCurrentLocation.getState();

    expect(state.currLocation).toBeNull();
    expect(state.locationStatus).toBe("idle");
  });

  test("records whether a resolved location came from the browser", () => {
    const { resolveLocation } = useCurrentLocation.getState();

    resolveLocation({
      location: { lat: 34.1, lng: -118.2 },
      source: "geolocation",
      error: null,
    });

    expect(useCurrentLocation.getState()).toMatchObject({
      currLocation: { lat: 34.1, lng: -118.2 },
      locationStatus: "granted",
      locationError: null,
    });
  });

  test("records fallback state and its user-facing reason", () => {
    const { resolveLocation } = useCurrentLocation.getState();

    resolveLocation({
      location: { lat: 33.5, lng: -117.7 },
      source: "fallback",
      error: "Permission denied",
    });

    expect(useCurrentLocation.getState()).toMatchObject({
      currLocation: { lat: 33.5, lng: -117.7 },
      locationStatus: "fallback",
      locationError: "Permission denied",
    });
  });
});

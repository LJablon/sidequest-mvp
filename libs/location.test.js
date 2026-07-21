import { describe, expect, test } from "bun:test";
import {
  DEFAULT_MAP_LOCATION,
  GEOLOCATION_OPTIONS,
  resolveBrowserLocation,
} from "./location";

describe("resolveBrowserLocation", () => {
  test("uses fresh browser coordinates when geolocation succeeds", async () => {
    let receivedOptions;
    const geolocation = {
      getCurrentPosition(success, _error, options) {
        receivedOptions = options;
        success({
          coords: { latitude: 34.1, longitude: -118.2 },
        });
      },
    };

    const result = await resolveBrowserLocation(geolocation);

    expect(result).toEqual({
      location: { lat: 34.1, lng: -118.2 },
      source: "geolocation",
      error: null,
    });
    expect(receivedOptions).toEqual(GEOLOCATION_OPTIONS);
  });

  test("uses the documented fallback when permission is denied", async () => {
    const geolocation = {
      getCurrentPosition(_success, error) {
        error?.({ message: "Permission denied" });
      },
    };

    const result = await resolveBrowserLocation(geolocation);

    expect(result.location).toBe(DEFAULT_MAP_LOCATION);
    expect(result.source).toBe("fallback");
    expect(result.error).toBe("Permission denied");
  });

  test("uses the documented fallback when geolocation is unavailable", async () => {
    const result = await resolveBrowserLocation(undefined);

    expect(result.location).toBe(DEFAULT_MAP_LOCATION);
    expect(result.source).toBe("fallback");
    expect(result.error).toContain("unavailable");
  });

  test("rejects non-finite coordinates", async () => {
    const geolocation = {
      getCurrentPosition(success) {
        success({
          coords: { latitude: Number.NaN, longitude: -118.2 },
        });
      },
    };

    const result = await resolveBrowserLocation(geolocation);

    expect(result.location).toBe(DEFAULT_MAP_LOCATION);
    expect(result.source).toBe("fallback");
    expect(result.error).toContain("invalid coordinates");
  });
});

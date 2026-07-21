export type Location = {
  lat: number;
  lng: number;
};

function configuredCoordinate(
  value: string | undefined,
  fallback: number,
  minimum: number,
  maximum: number
) {
  if (!value?.trim()) {
    return fallback;
  }

  const coordinate = Number(value);
  return Number.isFinite(coordinate) &&
    coordinate >= minimum &&
    coordinate <= maximum
    ? coordinate
    : fallback;
}

/**
 * Used only when browser geolocation is unavailable, denied, or invalid.
 * Override both coordinates with NEXT_PUBLIC_DEFAULT_MAP_LATITUDE and
 * NEXT_PUBLIC_DEFAULT_MAP_LONGITUDE for a different deployment region.
 */
export const DEFAULT_MAP_LOCATION: Readonly<Location> = Object.freeze({
  lat: configuredCoordinate(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_LATITUDE,
    33.541679,
    -90,
    90
  ),
  lng: configuredCoordinate(
    process.env.NEXT_PUBLIC_DEFAULT_MAP_LONGITUDE,
    -117.777214,
    -180,
    180
  ),
});

export const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  maximumAge: 0,
  timeout: 10_000,
};

export type LocationResolution = {
  location: Location;
  source: "geolocation" | "fallback";
  error: string | null;
};

type GeolocationProvider = Pick<Geolocation, "getCurrentPosition">;

function fallbackResolution(error: string): LocationResolution {
  return {
    location: DEFAULT_MAP_LOCATION,
    source: "fallback",
    error,
  };
}

export function resolveBrowserLocation(
  geolocation: GeolocationProvider | undefined
): Promise<LocationResolution> {
  if (!geolocation) {
    return Promise.resolve(
      fallbackResolution("Geolocation is unavailable in this browser.")
    );
  }

  return new Promise((resolve) => {
    try {
      geolocation.getCurrentPosition(
        ({ coords }) => {
          const location = {
            lat: coords.latitude,
            lng: coords.longitude,
          };

          if (!Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
            resolve(fallbackResolution("Geolocation returned invalid coordinates."));
            return;
          }

          resolve({ location, source: "geolocation", error: null });
        },
        (error) => {
          resolve(
            fallbackResolution(
              error.message || "Unable to determine your current location."
            )
          );
        },
        GEOLOCATION_OPTIONS
      );
    } catch (error) {
      resolve(
        fallbackResolution(
          error instanceof Error
            ? error.message
            : "Unable to determine your current location."
        )
      );
    }
  });
}

let initialLocationRequest: Promise<LocationResolution> | null = null;

/** Deduplicates React Strict Mode mounts and multiple map consumers. */
export function getInitialBrowserLocation(): Promise<LocationResolution> {
  if (!initialLocationRequest) {
    const geolocation =
      typeof navigator === "undefined" ? undefined : navigator.geolocation;
    initialLocationRequest = resolveBrowserLocation(geolocation);
  }

  return initialLocationRequest;
}

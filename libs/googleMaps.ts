import { Loader } from "@googlemaps/js-api-loader";

/**
 * Advanced markers require a map ID. Set NEXT_PUBLIC_GOOGLE_MAP_ID in deployed
 * environments; Google's demo ID keeps local development functional.
 */
export const GOOGLE_MAP_ID =
  process.env.NEXT_PUBLIC_GOOGLE_MAP_ID ?? "DEMO_MAP_ID";

let loader: Loader | null = null;

export function getGoogleMapsLoader(): Loader {
  const apiKey = process.env.NEXT_PUBLIC_MAPS_KEY;

  if (!apiKey) {
    throw new Error("NEXT_PUBLIC_MAPS_KEY is not configured.");
  }

  if (!loader) {
    loader = new Loader({
      apiKey,
      version: "weekly",
    });
  }

  return loader;
}

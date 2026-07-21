"use client";
import AdForm from "@/src/components/AdForm";
import useCurrentLocation from "@/src/hooks/useCurrentLocation";

export default function NewAdPage() {
  const center = useCurrentLocation((state) => state.currLocation);
  const locationStatus = useCurrentLocation((state) => state.locationStatus);

  if (!center) {
    return (
      <main className="mx-auto mt-20 max-w-4xl px-6" aria-live="polite">
        {locationStatus === "loading"
          ? "Finding your current location..."
          : "Preparing the Quest location map..."}
      </main>
    );
  }

  return <AdForm defaultLocation={center} />;
}

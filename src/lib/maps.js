// Opens a branch location in an external maps app via a universal Google Maps URL.
// Works on mobile (opens app/intent) and desktop (opens web). Vimi does not build navigation.
export function openInMaps(lat, lng, label) {
  const q = encodeURIComponent(`${label ? label + " " : ""}${lat},${lng}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
<<<<<<< HEAD
}

function locationQuery(location) {
  if (
    location.latitude !== null &&
    location.latitude !== undefined &&
    location.longitude !== null &&
    location.longitude !== undefined &&
    Number.isFinite(Number(location.latitude)) &&
    Number.isFinite(Number(location.longitude))
  ) {
    return `${Number(location.latitude)},${Number(location.longitude)}`;
  }

  return [location.address, location.city, location.district, location.region, location.country, location.name]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ");
}

export function directionsUrl(origin, destination) {
  const originQuery = locationQuery(origin);
  const destinationQuery = locationQuery(destination);
  if (!originQuery || !destinationQuery) return null;

  const params = new URLSearchParams({
    api: "1",
    origin: originQuery,
    destination: destinationQuery,
    travelmode: "driving",
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
=======
>>>>>>> origin/main
}
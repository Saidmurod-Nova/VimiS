// Opens a branch location in an external maps app via a universal Google Maps URL.
// Works on mobile (opens app/intent) and desktop (opens web). Vimi does not build navigation.
export function openInMaps(lat, lng, label) {
  const q = encodeURIComponent(`${label ? label + " " : ""}${lat},${lng}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function locationUrl(location) {
  const query = locationQuery(location || {});
  if (!query) return null;

  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function locationQuery(location) {
  if (hasValidCoordinates(location)) {
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    return `${latitude},${longitude}`;
  }

  return [location.address, location.city, location.district, location.region, location.country, location.name]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ");
}

export function directionsUrl(origin, destination) {
  return navigationUrl(destination, origin);
}

export function navigationUrl(destination, origin = null) {
  const originQuery = origin ? locationQuery(origin) : "";
  const destinationQuery = locationQuery(destination);
  if (!destinationQuery) return null;
  if (!hasValidCoordinates(destination) && !isUsableAddress(destinationQuery)) return null;

  const params = new URLSearchParams({
    api: "1",
    destination: destinationQuery,
    travelmode: "driving",
  });
  if (originQuery) params.set("origin", originQuery);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function hasValidCoordinates(location) {
  if (!location) return false;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  return (
    location.latitude !== null &&
    location.latitude !== undefined &&
    String(location.latitude).trim() !== "" &&
    location.longitude !== null &&
    location.longitude !== undefined &&
    String(location.longitude).trim() !== "" &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

function isUsableAddress(query) {
  const words = query.trim().split(/\s+/).filter(Boolean);
  return query.trim().length >= 6 && (words.length >= 2 || /\d/.test(query));
}
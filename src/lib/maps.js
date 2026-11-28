// Opens a branch location in an external maps app via a universal Google Maps URL.
// Works on mobile (opens app/intent) and desktop (opens web). Vimi does not build navigation.
export function openInMaps(lat, lng, label) {
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function locationUrl(location) {
  const query = coordinateQuery(location);
  if (!query) return null;

  const params = new URLSearchParams({ api: "1", query });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

export function directionsUrl(origin, destination) {
  return navigationUrl(destination, origin);
}

export function coordinatesNavigationUrl(destination, origin = null) {
  const destinationCoordinates = coordinateQuery(destination);
  if (!destinationCoordinates) return null;

  const params = new URLSearchParams({
    api: "1",
    destination: destinationCoordinates,
    travelmode: "driving",
  });
  const originCoordinates = origin ? coordinateQuery(origin) : null;
  if (originCoordinates) params.set("origin", originCoordinates);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

export function navigationUrl(destination, origin = null) {
  return coordinatesNavigationUrl(destination, origin);
}

export function hasValidCoordinates(location) {
  return Boolean(coordinateQuery(location));
}

function coordinateQuery(location) {
  if (!location) return null;
  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const valid = (
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
  return valid ? `${latitude},${longitude}` : null;
}

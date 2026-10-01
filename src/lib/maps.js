// Opens a branch location in an external maps app via a universal Google Maps URL.
// Works on mobile (opens app/intent) and desktop (opens web). Vimi does not build navigation.
export function openInMaps(lat, lng, label) {
  const q = encodeURIComponent(`${label ? label + " " : ""}${lat},${lng}`);
  window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, "_blank", "noopener,noreferrer");
}

export function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}
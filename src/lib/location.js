import { base44 } from "@/api/base44Client";

// Great-circle distance in km between two {lat, lng} points.
export function haversineKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Automatic location detection without reverse geocoding: finds the nearest
// active branch to the given coordinates and derives the location from it.
// Returns null when no branches with coordinates are available.
export async function detectNearestLocation(coords) {
  const branches = await base44.entities.Branch.filter({ is_active: true }, "-created_date", 200);
  let best = null;
  let bestD = Infinity;
  for (const b of (branches || [])) {
    if (!b.latitude || !b.longitude) continue;
    const d = haversineKm(coords, { lat: b.latitude, lng: b.longitude });
    if (d < bestD) { bestD = d; best = b; }
  }
  if (!best) return null;
  return {
    geo_area_id: best.geo_area_id || null,
    country: best.country || "",
    region: best.region || "",
    city: best.city || "",
    district: best.district || ""
  };
}

// Promisified geolocation; rejects on denial/timeout so the UI can fall back to manual.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation mavjud emas"));
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}
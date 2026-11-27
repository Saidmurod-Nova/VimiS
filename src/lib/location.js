import { base44 } from "@/api/base44Client";
import { isSupabaseMode, requireSupabase } from "@/lib/supabase";

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
  let branches;
  if (isSupabaseMode) {
    const { data, error } = await requireSupabase().from("branches").select("*").eq("is_active", true).limit(200);
    if (error) throw new Error(error.message || "Filiallarni yuklab bo‘lmadi.");
    branches = data;
  } else {
    branches = await base44.entities.Branch.filter({ is_active: true }, "-created_date", 200);
  }
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

function geolocationError(error) {
  const messages = {
    1: "Joylashuvga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering yoki hududni qo‘lda tanlang.",
    2: "Brauzer joylashuv xizmatidan koordinata olib bo‘lmadi. Qurilmada Location/GPS va internetni tekshiring yoki hududni qo‘lda tanlang.",
    3: "Joylashuvni aniqlash vaqti tugadi. Ochiqroq joyda qayta urinib ko‘ring yoki hududni qo‘lda tanlang.",
  };
  const result = new Error(messages[error?.code] || error?.message || "Joylashuvni aniqlab bo‘lmadi.");
  result.code = error?.code;
  result.name = error?.name || "GeolocationPositionError";
  return result;
}

// Promisified geolocation; rejects with actionable errors so the UI can fall back to manual selection.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!globalThis.isSecureContext) {
      reject(new Error("Telefonni WLAN IP manzili orqali ulagan bo‘lsangiz, bu manzil ishonchli HTTPS sertifikatiga ega bo‘lishi kerak. Lokal HTTPS sozlash yo‘riqnomasini bajaring yoki publish qilingan HTTPS manzilidan foydalaning."));
      return;
    }
    if (!navigator.geolocation) {
      reject(new Error("Bu qurilma yoki brauzer joylashuvni aniqlashni qo‘llab-quvvatlamaydi."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (error) => reject(geolocationError(error)),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
    );
  });
}
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

const regionAliases = {
  "xorazm": "Xorazm viloyati",
  "khorezm": "Xorazm viloyati",
  "xorezm": "Xorazm viloyati",
  "toshkent": "Toshkent viloyati",
  "samarqand": "Samarqand viloyati",
  "andijon": "Andijon viloyati",
  "buxoro": "Buxoro viloyati",
  "fargona": "Farg'ona viloyati",
  "fergana": "Farg'ona viloyati",
  "namangan": "Namangan viloyati",
  "qashqadaryo": "Qashqadaryo viloyati",
  "surxondaryo": "Surxondaryo viloyati",
  "sirdaryo": "Sirdaryo viloyati",
  "jizzax": "Jizzax viloyati",
  "navoiy": "Navoiy viloyati",
};

function normalizeName(value) {
  return String(value || "")
    .toLocaleLowerCase("uz")
    .replace(/[ʻ'’]/g, "")
    .replace(/[^a-z\u0400-\u04ff\u0080-\u024f]+/gi, "")
    .replace(/\s+/g, "");
}

async function loadGeoAreas(filters) {
  if (isSupabaseMode) {
    let query = requireSupabase().from("geo_areas").select("*");
    for (const [field, value] of Object.entries(filters)) query = query.eq(field, value);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
  return base44.entities.GeoArea.filter(filters, "name", 100);
}

async function reverseGeocode(coords) {
  const params = new URLSearchParams({
    latitude: String(coords.lat),
    longitude: String(coords.lng),
    localityLanguage: "uz",
  });
  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Location API javob bermadi: ${response.status}`);
  return response.json();
}

async function findGeoArea(countryName, regionName, cityName) {
  const countries = await loadGeoAreas({ type: "country" });
  const country = countries.find((item) => normalizeName(item.name) === normalizeName(countryName)) || countries[0];
  if (!country) return null;

  const regions = await loadGeoAreas({ parent_id: country.id });
  const regionKey = normalizeName(regionName);
  const aliasEntry = Object.entries(regionAliases).find(([alias]) => regionKey.includes(normalizeName(alias)));
  const aliasedRegionName = aliasEntry?.[1];
  const region = regions.find((item) => {
    const name = normalizeName(item.name);
    return name === regionKey
      || (aliasedRegionName && normalizeName(item.name) === normalizeName(aliasedRegionName))
      || normalizeName(regionName).includes(name)
      || name.includes(normalizeName(regionName));
  });
  if (!region) return { country: country.name, region: "", city: "", geo_area_id: country.id };

  const cities = await loadGeoAreas({ parent_id: region.id });
  const city = cities.find((item) => {
    const name = normalizeName(item.name);
    const value = normalizeName(cityName);
    return name === value || value.includes(name) || name.includes(value);
  });
  return {
    country: country.name,
    region: region.name,
    city: city?.name || "",
    geo_area_id: city?.id || region.id,
  };
}

// Reverse geocodes the coordinates through BigDataCloud, then maps the result
// to the application's geo area hierarchy. Falls back to the nearest active
// branch when the API or geo area match is unavailable.
export async function detectNearestLocation(coords) {
  try {
    const geocoded = await reverseGeocode(coords);
    const regionName = geocoded.principalSubdivision
      || geocoded.principalSubdivisionName
      || geocoded.region
      || "";
    const cityName = geocoded.locality
      || geocoded.city
      || geocoded.localityInfo?.administrative?.[0]?.name
      || "";
    const countryName = geocoded.countryName || geocoded.countryCode || "O'zbekiston";
    const area = await findGeoArea(countryName, regionName, cityName);
    if (area?.region) return { ...area, district: area.city };
  } catch (error) {
    console.error("Joylashuv API xatosi.", error);
  }

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
    const lat = Number(b.latitude);
    const lng = Number(b.longitude);
    if (b.latitude == null || b.longitude == null || String(b.latitude).trim() === "" || String(b.longitude).trim() === "" || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
    const d = haversineKm(coords, { lat, lng });
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
    // High accuracy can time out on phones when GPS is unavailable indoors.
    // Retry with network/cached positioning before reporting a failure.
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (highAccuracyError) => {
        if (highAccuracyError?.code === 1) {
          reject(geolocationError(highAccuracyError));
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          (fallbackError) => reject(geolocationError(fallbackError?.code === 1 ? fallbackError : highAccuracyError)),
          { enableHighAccuracy: false, timeout: 20000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  });
}

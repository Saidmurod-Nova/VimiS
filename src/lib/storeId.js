// Generates a unique public Store ID like "ARTEL-1234".
// Prefix is derived from the business name; the suffix is random.
// Uniqueness is checked against existing businesses and retried on collision.
function sanitize(name) {
  const clean = (name || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
  return clean || "STORE";
}

function randomPart(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export async function generateUniqueStoreId(base44, name) {
  const prefix = sanitize(name);
  for (let i = 0; i < 6; i++) {
    const candidate = `${prefix}-${randomPart()}`;
    try {
      const existing = await base44.entities.Business.filter({ store_id: candidate });
      if (!existing || existing.length === 0) return candidate;
    } catch {
      return candidate;
    }
  }
  return `${prefix}-${randomPart(6)}`;
}
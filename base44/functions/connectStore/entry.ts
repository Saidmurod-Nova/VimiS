import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeStoreId, findBusinessByStoreId, upsertSavedStore } from "../../shared/storeAuth.ts";

// Connects a buyer to a business via its public Store ID. Validates the input,
// looks up the business, rejects inactive stores, and creates a SavedStore
// relationship idempotently (no duplicates). Returns the public business.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = (body || {}).store_id;
    if (!raw || typeof raw !== 'string' || !raw.trim()) {
      return Response.json({ error: "Do'kon ID kiritilmagan" }, { status: 400 });
    }

    const storeId = normalizeStoreId(raw);
    const business = await findBusinessByStoreId(base44, storeId);
    if (!business) return Response.json({ error: "Do'kon topilmadi" }, { status: 404 });
    if (!business.is_active) return Response.json({ error: "Bu do'kon hozirda mavjud emas" }, { status: 400 });

    const { saved, created } = await upsertSavedStore(base44, user.id, business.id);

    return Response.json({ business, saved, created });
  } catch (error) {
    return Response.json({ error: error.message || "Ulanib bo'lmadi" }, { status: error.status || 500 });
  }
}
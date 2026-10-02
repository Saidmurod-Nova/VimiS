import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { upsertSavedStore } from "../../shared/storeAuth.ts";

// Marks a business as visited by the current user (upserts a SavedStore with
// last_visited_at = now). Called only when the user actually opens the Store
// Details page. Validates the business exists and is active before recording.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { business_id } = body || {};
    if (!business_id) return Response.json({ error: "Biznes majburiy" }, { status: 400 });

    const business = await base44.asServiceRole.entities.Business.get(business_id);
    if (!business || !business.is_active) return Response.json({ error: "Do'kon topilmadi" }, { status: 404 });

    const now = new Date().toISOString();
    const { saved } = await upsertSavedStore(base44, user.id, business_id, { last_visited_at: now });

    return Response.json({ saved });
  } catch (error) {
    return Response.json({ error: error.message || "Yangilanmadi" }, { status: error.status || 500 });
  }
}
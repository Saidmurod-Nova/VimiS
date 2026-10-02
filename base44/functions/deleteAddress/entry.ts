import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Deletes a saved address owned by the authenticated user. If the deleted
// address was the default, promotes the most recent remaining address to
// default (if any). Historical orders reference snapshots and are unaffected.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { address_id } = body || {};
    if (!address_id) return Response.json({ error: 'address_id majburiy' }, { status: 400 });

    const addr = await base44.asServiceRole.entities.Address.get(address_id).catch(() => null);
    if (!addr || addr.user_id !== user.id) return Response.json({ error: 'Manzil topilmadi' }, { status: 404 });

    const wasDefault = addr.is_default === true;
    await base44.asServiceRole.entities.Address.delete(address_id);

    let newDefaultId = null;
    if (wasDefault) {
      const remaining = await base44.asServiceRole.entities.Address.filter({ user_id: user.id });
      if (remaining && remaining.length > 0) {
        const sorted = remaining.slice().sort((x, y) => new Date(y.created_date).getTime() - new Date(x.created_date).getTime());
        try { await base44.asServiceRole.entities.Address.update(sorted[0].id, { is_default: true }); } catch {}
        newDefaultId = sorted[0].id;
      }
    }
    return Response.json({ ok: true, new_default_id: newDefaultId });
  } catch (error) {
    return Response.json({ error: error.message || "O'chirib bo'lmadi" }, { status: error.status || 500 });
  }
}
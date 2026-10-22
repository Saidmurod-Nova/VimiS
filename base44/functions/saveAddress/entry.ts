import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates or updates a saved delivery address for the authenticated user.
// Enforces one default address per user: when is_default is true, any other
// default for the same user is cleared. Validates coordinates when supplied.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { address_id, title, address, latitude, longitude, is_default } = body || {};
    const t = String(title || '').trim();
    const a = String(address || '').trim();
    if (!t || !a) return Response.json({ error: 'Sarlavha va manzil majburiy' }, { status: 400 });

    let lat = latitude == null ? null : Number(latitude);
    let lng = longitude == null ? null : Number(longitude);
    if (lat != null && (Number.isNaN(lat) || lat < -90 || lat > 90)) return Response.json({ error: "Kenglik noto'g'ri" }, { status: 400 });
    if (lng != null && (Number.isNaN(lng) || lng < -180 || lng > 180)) return Response.json({ error: "Uzunlik noto'g'ri" }, { status: 400 });
    const setDefault = is_default === true;

    let saved;
    if (address_id) {
      const existing = await base44.asServiceRole.entities.Address.get(address_id).catch(() => null);
      if (!existing || existing.user_id !== user.id) return Response.json({ error: 'Manzil topilmadi' }, { status: 404 });
      saved = await base44.asServiceRole.entities.Address.update(address_id, {
        title: t, address: a,
        latitude: lat, longitude: lng,
        is_default: setDefault
      });
    } else {
      saved = await base44.asServiceRole.entities.Address.create({
        user_id: user.id, title: t, address: a,
        latitude: lat, longitude: lng,
        is_default: setDefault
      });
    }

    if (setDefault) {
      const all = await base44.asServiceRole.entities.Address.filter({ user_id: user.id });
      for (const ad of (all || [])) {
        if (ad.id === saved.id) continue;
        if (ad.is_default) { try { await base44.asServiceRole.entities.Address.update(ad.id, { is_default: false }); } catch {} }
      }
    }
    return Response.json({ address: saved });
  } catch (error) {
    return Response.json({ error: error.message || 'Manzil saqlanmadi' }, { status: error.status || 500 });
  }
}
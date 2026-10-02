import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Clears the buyer's active cart (or a specific cart_id if provided and owned).
// Used for "Yangi savat boshlash" and explicit cart clearing.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { cart_id } = body || {};
    let carts;
    if (cart_id) {
      const c = await base44.asServiceRole.entities.Cart.get(cart_id).catch(() => null);
      carts = c ? [c] : [];
    } else {
      carts = await base44.asServiceRole.entities.Cart.filter({ user_id: user.id, status: 'active' });
    }
    for (const c of (carts || [])) {
      if (!c || c.user_id !== user.id) continue;
      const items = await base44.asServiceRole.entities.CartItem.filter({ cart_id: c.id });
      for (const it of (items || [])) { try { await base44.asServiceRole.entities.CartItem.delete(it.id); } catch {} }
      try { await base44.asServiceRole.entities.Cart.delete(c.id); } catch {}
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || "Tozalab bo'lmadi" }, { status: error.status || 500 });
  }
}
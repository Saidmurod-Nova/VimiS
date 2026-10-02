import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Removes a cart item. Verifies the item's cart belongs to the user and is
// active. When the last item is removed the active cart is deleted too, so the
// single-active-cart invariant stays clean and the UI shows the empty state.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { cart_item_id } = body || {};
    if (!cart_item_id) return Response.json({ error: 'cart_item_id majburiy' }, { status: 400 });

    const item = await base44.asServiceRole.entities.CartItem.get(cart_item_id).catch(() => null);
    if (!item) return Response.json({ ok: true });
    const cart = await base44.asServiceRole.entities.Cart.get(item.cart_id).catch(() => null);
    if (!cart || cart.user_id !== user.id || cart.status !== 'active') return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

    await base44.asServiceRole.entities.CartItem.delete(item.id);
    const remaining = await base44.asServiceRole.entities.CartItem.filter({ cart_id: cart.id });
    if (!remaining || remaining.length === 0) {
      try { await base44.asServiceRole.entities.Cart.delete(cart.id); } catch {}
      return Response.json({ ok: true, cart_cleared: true });
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message || "O'chirib bo'lmadi" }, { status: error.status || 500 });
  }
}
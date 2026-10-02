import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Changes a cart item's quantity. Verifies the item's cart belongs to the user
// and is active, the product is still active/available, and stock is sufficient.
// Minimum quantity is 1; removal is a separate action.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { cart_item_id, quantity } = body || {};
    const qty = Math.floor(Number(quantity));
    if (!cart_item_id || !Number.isInteger(qty) || qty < 1) return Response.json({ error: "Noto'g'ri miqdor" }, { status: 400 });

    const item = await base44.asServiceRole.entities.CartItem.get(cart_item_id).catch(() => null);
    if (!item) return Response.json({ error: 'Mahsulot topilmadi' }, { status: 404 });
    const cart = await base44.asServiceRole.entities.Cart.get(item.cart_id).catch(() => null);
    if (!cart || cart.user_id !== user.id || cart.status !== 'active') return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

    const product = await base44.asServiceRole.entities.Product.get(item.product_id).catch(() => null);
    if (!product || !product.is_active) return Response.json({ error: 'Mahsulot endi mavjud emas' }, { status: 400 });
    const invList = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: cart.branch_id, product_id: item.product_id });
    const inv = (invList || []).find(Boolean);
    if (!inv || inv.is_available === false) return Response.json({ error: 'Mahsulot hozirda sotuvda emas' }, { status: 400 });
    const stock = inv.stock || 0;
    if (qty > stock) return Response.json({ error: `Yetarli zaxira yo'q (qoldi: ${stock})`, stock }, { status: 400 });

    await base44.asServiceRole.entities.CartItem.update(item.id, { quantity: qty });
    return Response.json({ ok: true, quantity: qty });
  } catch (error) {
    return Response.json({ error: error.message || 'Yangilab bo\'lmadi' }, { status: error.status || 500 });
  }
}
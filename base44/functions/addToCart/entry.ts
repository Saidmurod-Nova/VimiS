import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getMyActiveCart } from '../../shared/cartAuth.ts';

// Adds a product to the buyer's active cart. Enforces one business + one branch
// per cart: if an active cart exists for a different business/branch, returns a
// conflict (unless force_new) so the client can offer "open current" vs "new cart".
// Never trusts client prices/stock; revalidates product, branch ownership, and
// inventory server-side. Does not decrement stock (that happens at checkout).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { product_id, branch_id, quantity, force_new } = body || {};
    const qty = Math.max(1, Math.floor(Number(quantity) || 1));
    if (!product_id || !branch_id) return Response.json({ error: 'Mahsulot va filial majburiy' }, { status: 400 });

    const product = await base44.asServiceRole.entities.Product.get(product_id).catch(() => null);
    if (!product || !product.is_active) return Response.json({ error: 'Mahsulot mavjud emas' }, { status: 400 });
    const branch = await base44.asServiceRole.entities.Branch.get(branch_id).catch(() => null);
    if (!branch || !branch.is_active) return Response.json({ error: 'Filial hozirda faol emas' }, { status: 400 });
    if (branch.business_id !== product.business_id) return Response.json({ error: 'Filial ushbu biznesga tegishli emas' }, { status: 400 });
    const business = await base44.asServiceRole.entities.Business.get(product.business_id).catch(() => null);
    if (!business || !business.is_active) return Response.json({ error: "Do'kon hozirda faol emas" }, { status: 400 });

    const invList = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id, product_id });
    const inv = (invList || []).find(Boolean);
    if (!inv) return Response.json({ error: 'Mahsulot bu filialda mavjud emas' }, { status: 400 });
    if (inv.is_available === false) return Response.json({ error: 'Mahsulot hozirda sotuvda emas' }, { status: 400 });
    const stock = inv.stock || 0;

    const existing = await getMyActiveCart(base44, user.id);
    let cart = existing;
    if (existing && (existing.business_id !== product.business_id || existing.branch_id !== branch_id)) {
      if (!force_new) {
        return Response.json({
          conflict: true,
          current_cart: { id: existing.id, business_id: existing.business_id, branch_id: existing.branch_id }
        });
      }
      const oldItems = await base44.asServiceRole.entities.CartItem.filter({ cart_id: existing.id });
      for (const it of (oldItems || [])) { try { await base44.asServiceRole.entities.CartItem.delete(it.id); } catch {} }
      try { await base44.asServiceRole.entities.Cart.delete(existing.id); } catch {}
      cart = null;
    }

    if (!cart) {
      cart = await base44.asServiceRole.entities.Cart.create({ user_id: user.id, business_id: product.business_id, branch_id, status: 'active' });
    }

    const lineItems = await base44.asServiceRole.entities.CartItem.filter({ cart_id: cart.id, product_id });
    const item = (lineItems || []).find(Boolean);
    let newQty;
    if (item) {
      newQty = item.quantity + qty;
      if (newQty > stock) return Response.json({ error: `Yetarli zaxira yo'q (qoldi: ${stock})`, stock }, { status: 400 });
      await base44.asServiceRole.entities.CartItem.update(item.id, { quantity: newQty });
    } else {
      newQty = qty;
      if (newQty > stock) return Response.json({ error: `Yetarli zaxira yo'q (qoldi: ${stock})`, stock }, { status: 400 });
      await base44.asServiceRole.entities.CartItem.create({ cart_id: cart.id, product_id, quantity: newQty });
    }
    return Response.json({ ok: true, cart_id: cart.id, quantity: newQty, added: qty });
  } catch (error) {
    return Response.json({ error: error.message || "Savatga qo'shib bo'lmadi" }, { status: error.status || 500 });
  }
}
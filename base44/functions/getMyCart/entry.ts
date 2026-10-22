import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getMyActiveCart } from '../../shared/cartAuth.ts';

// Returns the buyer's active cart with item views computed from trusted
// database values (branch-specific pricing, current stock, availability).
// Cart/CartItem reads are admin-only by RLS, so this runs as service role
// after authenticating the user.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const cart = await getMyActiveCart(base44, user.id);
    if (!cart) return Response.json({ cart: null, items: [], business: null, branch: null, subtotal: 0, total: 0, total_items: 0 });

    const [items, business, branch, products, inventory] = await Promise.all([
      base44.asServiceRole.entities.CartItem.filter({ cart_id: cart.id }),
      base44.asServiceRole.entities.Business.get(cart.business_id).catch(() => null),
      base44.asServiceRole.entities.Branch.get(cart.branch_id).catch(() => null),
      base44.asServiceRole.entities.Product.filter({ business_id: cart.business_id }),
      base44.asServiceRole.entities.BranchInventory.filter({ branch_id: cart.branch_id })
    ]);

    const invByProduct = {};
    for (const inv of (inventory || [])) invByProduct[inv.product_id] = inv;
    const prodById = {};
    for (const p of (products || [])) prodById[p.id] = p;

    const viewItems = (items || []).map((it) => {
      const p = prodById[it.product_id];
      const inv = invByProduct[it.product_id];
      const hasInv = !!inv;
      const stock = hasInv ? (inv.stock || 0) : 0;
      const productActive = !!(p && p.is_active);
      const available = hasInv && inv.is_available === true && stock > 0 && productActive;
      const effectivePrice = hasInv && inv.price_override != null ? inv.price_override : (p ? p.price : 0);
      return {
        cart_item_id: it.id,
        product_id: it.product_id,
        quantity: it.quantity,
        name: p ? p.name : "O'chirilgan mahsulot",
        image_url: p ? p.image_url : null,
        unit_price: effectivePrice,
        subtotal: effectivePrice * it.quantity,
        stock,
        available,
        product_active: productActive,
        is_available_flag: hasInv ? inv.is_available === true : false
      };
    });

    const subtotal = viewItems.reduce((s, i) => s + i.subtotal, 0);
    return Response.json({
      cart: { id: cart.id, business_id: cart.business_id, branch_id: cart.branch_id, status: cart.status },
      business: business ? { id: business.id, name: business.name, store_id: business.store_id, is_active: business.is_active } : null,
      branch: branch ? { id: branch.id, name: branch.name, city: branch.city, region: branch.region, address: branch.address, is_active: branch.is_active } : null,
      items: viewItems,
      subtotal,
      total: subtotal,
      total_items: viewItems.reduce((s, i) => s + i.quantity, 0)
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Savat yuklanmadi' }, { status: error.status || 500 });
  }
}
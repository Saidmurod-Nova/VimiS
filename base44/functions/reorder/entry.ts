import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Validates a past order for reordering and returns each item's current
// availability, stock, and effective price. The frontend then adds eligible
// items via addToCart (which handles cart conflicts and stock checks), so
// reorder never auto-submits a new order and always uses current prices.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { order_id } = body || {};
    if (!order_id) return Response.json({ error: 'order_id majburiy' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order || order.user_id !== user.id) return Response.json({ error: 'Buyurtma topilmadi' }, { status: 404 });

    const [business, branch, items] = await Promise.all([
      base44.asServiceRole.entities.Business.get(order.business_id).catch(() => null),
      base44.asServiceRole.entities.Branch.get(order.branch_id).catch(() => null),
      base44.asServiceRole.entities.OrderItem.filter({ order_id: order.id })
    ]);

    const businessActive = !!(business && business.is_active);
    const branchActive = !!(branch && branch.is_active);

    let products = [];
    let inventory = [];
    if (businessActive && branchActive) {
      [products, inventory] = await Promise.all([
        base44.asServiceRole.entities.Product.filter({ business_id: order.business_id }),
        base44.asServiceRole.entities.BranchInventory.filter({ branch_id: order.branch_id })
      ]);
    }
    const invByProduct = {};
    for (const inv of (inventory || [])) invByProduct[inv.product_id] = inv;
    const prodById = {};
    for (const p of (products || [])) prodById[p.id] = p;

    const lineItems = (items || []).map((it) => {
      const p = prodById[it.product_id];
      const inv = invByProduct[it.product_id];
      const hasInv = !!inv;
      const stock = hasInv ? (inv.stock || 0) : 0;
      const productActive = !!(p && p.is_active);
      const available = businessActive && branchActive && hasInv && inv.is_available === true && stock > 0 && productActive;
      const currentPrice = hasInv && inv.price_override != null ? inv.price_override : (p ? p.price : 0);
      let reason = null;
      if (!businessActive) reason = "Do'kon hozirda faol emas";
      else if (!branchActive) reason = 'Filial hozirda faol emas. Boshqa filial tanlang.';
      else if (!productActive) reason = 'Mahsulot endi mavjud emas';
      else if (!hasInv || inv.is_available === false) reason = 'Mahsulot bu filialda hozirda sotuvda emas';
      else if (stock < it.quantity) reason = `Zaxira yetarli emas (qoldi: ${stock})`;
      return {
        product_id: it.product_id,
        name: it.product_name,
        image_url: it.image_url || null,
        quantity: it.quantity,
        current_price: currentPrice,
        stock,
        available,
        reason
      };
    });

    return Response.json({
      business_id: order.business_id,
      branch_id: order.branch_id,
      business_name: order.business_name,
      branch_name: order.branch_name,
      business_active: businessActive,
      branch_active: branchActive,
      items: lineItems
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Qayta buyurtma tekshirilmadi' }, { status: error.status || 500 });
  }
}
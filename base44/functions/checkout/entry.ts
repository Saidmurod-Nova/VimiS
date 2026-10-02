import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { generateOrderNumber } from '../../shared/orderAuth.ts';
import { notify } from '../../shared/notify.ts';

// Converts the buyer's active cart into a real order. Revalidates everything
// from trusted database values: cart ownership, single business + branch,
// active business/branch, active products, current effective prices, and
// sufficient stock. Creates immutable Order + OrderItem snapshots, decrements
// branch inventory, clears the cart, and notifies the business owner.
//
// Stock policy: stock is DECREMENTED at order creation. If the order is later
// cancelled (while pending or accepted), updateOrderStatus restores it.
// Completed/preparing orders never trigger a second deduction.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { cart_id, address_id, payment_method, notes } = body || {};
    if (!cart_id || !address_id) return Response.json({ error: 'Savat va manzil majburiy' }, { status: 400 });
    const pm = String(payment_method || 'cash_on_delivery');

    const cart = await base44.asServiceRole.entities.Cart.get(cart_id).catch(() => null);
    if (!cart || cart.user_id !== user.id || cart.status !== 'active') {
      return Response.json({ error: 'Savat topilmadi yoki allaqachon tasdiqlangan' }, { status: 400 });
    }
    const items = await base44.asServiceRole.entities.CartItem.filter({ cart_id: cart.id });
    if (!items || items.length === 0) return Response.json({ error: 'Savat bo\'sh' }, { status: 400 });

    const [business, branch, address] = await Promise.all([
      base44.asServiceRole.entities.Business.get(cart.business_id).catch(() => null),
      base44.asServiceRole.entities.Branch.get(cart.branch_id).catch(() => null),
      base44.asServiceRole.entities.Address.get(address_id).catch(() => null)
    ]);
    if (!business || !business.is_active) return Response.json({ error: "Do'kon hozirda faol emas" }, { status: 400 });
    if (!branch || !branch.is_active) return Response.json({ error: 'Filial hozirda faol emas' }, { status: 400 });
    if (!address || address.user_id !== user.id) return Response.json({ error: 'Manzil topilmadi' }, { status: 400 });

    const products = await base44.asServiceRole.entities.Product.filter({ business_id: cart.business_id });
    const inventory = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: cart.branch_id });
    const invByProduct = {};
    for (const inv of (inventory || [])) invByProduct[inv.product_id] = inv;
    const prodById = {};
    for (const p of (products || [])) prodById[p.id] = p;

    let subtotal = 0;
    const orderItems = [];
    for (const it of items) {
      const p = prodById[it.product_id];
      if (!p || !p.is_active) return Response.json({ error: `${it.product_id} endi mavjud emas` }, { status: 400 });
      const inv = invByProduct[it.product_id];
      if (!inv || inv.is_available === false) return Response.json({ error: `${p.name} hozirda sotuvda emas` }, { status: 400 });
      const stock = inv.stock || 0;
      if (it.quantity > stock) return Response.json({ error: `${p.name} uchun zaxira yetarli emas (qoldi: ${stock})` }, { status: 400 });
      const unit = inv.price_override != null ? inv.price_override : p.price;
      const lineSubtotal = unit * it.quantity;
      subtotal += lineSubtotal;
      orderItems.push({ product_id: p.id, product_name: p.name, unit_price: unit, quantity: it.quantity, subtotal: lineSubtotal, image_url: p.image_url || null });
    }

    const deliveryFee = 0;
    const total = subtotal + deliveryFee;
    const orderNumber = await generateOrderNumber(base44);
    const buyerName = user.full_name || '';
    const buyerPhone = (user.data && user.data.phone) || user.phone || '';

    const order = await base44.asServiceRole.entities.Order.create({
      order_number: orderNumber,
      user_id: user.id,
      business_id: cart.business_id,
      branch_id: cart.branch_id,
      business_name: business.name,
      branch_name: branch.name,
      status: 'pending',
      delivery_address: address.address,
      delivery_latitude: address.latitude != null ? Number(address.latitude) : null,
      delivery_longitude: address.longitude != null ? Number(address.longitude) : null,
      buyer_name_snapshot: buyerName,
      buyer_phone_snapshot: buyerPhone,
      payment_method: pm,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      item_count: items.reduce((s, i) => s + i.quantity, 0),
      notes: notes || ''
    });

    for (const oi of orderItems) {
      await base44.asServiceRole.entities.OrderItem.create({ order_id: order.id, ...oi });
    }

    // Decrement stock now (creation-time deduction policy).
    for (const it of items) {
      const inv = invByProduct[it.product_id];
      const newStock = Math.max(0, (inv.stock || 0) - it.quantity);
      try { await base44.asServiceRole.entities.BranchInventory.update(inv.id, { stock: newStock }); } catch {}
    }

    // Clear the cart: remove items and mark cart checked out.
    for (const it of items) { try { await base44.asServiceRole.entities.CartItem.delete(it.id); } catch {} }
    try { await base44.asServiceRole.entities.Cart.update(cart.id, { status: 'checked_out' }); } catch {}

    // Best-effort: notify the business owner a new order arrived.
    if (business.created_by_id) {
      await notify(base44, business.created_by_id, {
        title: 'Yangi buyurtma',
        body: `${orderNumber} · ${order.item_count} ta mahsulot · ${total} so'm`,
        type: 'order',
        related_id: order.id
      });
    }

    return Response.json({ ok: true, order: { id: order.id, order_number: orderNumber, total, item_count: order.item_count, business_name: business.name } });
  } catch (error) {
    return Response.json({ error: error.message || 'Buyurtma yaratilmadi' }, { status: error.status || 500 });
  }
}
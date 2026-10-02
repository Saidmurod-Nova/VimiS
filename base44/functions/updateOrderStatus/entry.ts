import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifySellerOwnsBusiness } from '../../shared/orderAuth.ts';
import { notify } from '../../shared/notify.ts';

// Central, trusted status-transition function for orders. The client sends an
// action, never a raw status; the server re-reads the current status, authorizes
// the actor (buyer owns the order, seller owns the business), validates the
// transition, stamps the timestamp, restores stock on cancellation, and notifies
// the other party. Repeated taps are safe: an invalid transition is rejected.
//
// Stock policy: stock was decremented at checkout. Cancelling a pending or
// accepted order restores it. Preparing/completed orders cannot be cancelled,
// so no restore happens there.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { order_id, action, reason } = body || {};
    if (!order_id || !action) return Response.json({ error: 'order_id va action majburiy' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'Buyurtma topilmadi' }, { status: 404 });

    const isBuyer = order.user_id === user.id;
    let isSeller = false;
    try { await verifySellerOwnsBusiness(base44, order.business_id, user.id); isSeller = true; } catch {}
    if (!isBuyer && !isSeller) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });

    const now = new Date().toISOString();
    const status = order.status;

    // Helper: restore stock for all order items (used on cancellation).
    const restoreStock = async () => {
      const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: order.id });
      for (const it of (items || [])) {
        const invList = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: order.branch_id, product_id: it.product_id });
        const inv = (invList || []).find(Boolean);
        if (inv) {
          const newStock = (inv.stock || 0) + (it.quantity || 0);
          try { await base44.asServiceRole.entities.BranchInventory.update(inv.id, { stock: newStock }); } catch {}
        }
      }
    };

    let newStatus = status;
    let patch = {};
    let buyerMsg = null;
    let sellerMsg = null;

    if (action === 'cancel') {
      // Buyer may cancel pending/accepted; seller may cancel pending/accepted (with reason).
      if (status !== 'pending' && status !== 'accepted') {
        return Response.json({ error: "Bu buyurtmani endi bekor qilib bo'lmadi" }, { status: 400 });
      }
      if (isBuyer && !isSeller) {
        // buyer cancel — allowed for pending/accepted
      } else if (isSeller) {
        // seller cancel — reason optional but recorded when provided
      }
      newStatus = 'cancelled';
      patch = { status: 'cancelled', cancelled_at: now, cancellation_reason: reason || '' };
      await restoreStock();
      sellerMsg = isSeller ? null : { title: 'Buyurtma bekor qilindi', body: `${order.order_number} buyurtma xaridor tomonidan bekor qilindi` };
      buyerMsg = isBuyer ? null : { title: 'Buyurtma bekor qilindi', body: `${order.order_number} buyurtma do'kon tomonidan bekor qilindi` };
    } else if (action === 'accept') {
      if (!isSeller) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
      if (status !== 'pending') return Response.json({ error: 'Faqat kutilayotgan buyurtmani qabul qilish mumkin' }, { status: 400 });
      newStatus = 'accepted';
      patch = { status: 'accepted', accepted_at: now };
      buyerMsg = { title: 'Buyurtma qabul qilindi', body: `${order.order_number} buyurtmangiz qabul qilindi` };
    } else if (action === 'prepare') {
      if (!isSeller) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
      if (status !== 'accepted') return Response.json({ error: 'Faqat qabul qilingan buyurtmani tayyorlash mumkin' }, { status: 400 });
      newStatus = 'preparing';
      patch = { status: 'preparing', preparing_at: now };
      buyerMsg = { title: 'Buyurtma tayyorlanmoqda', body: `${order.order_number} buyurtmangiz tayyorlanmoqda` };
    } else if (action === 'complete') {
      if (!isSeller) return Response.json({ error: "Ruxsat yo'q" }, { status: 403 });
      if (status !== 'preparing') return Response.json({ error: 'Faqat tayyorlanayotgan buyurtmani yakunlash mumkin' }, { status: 400 });
      newStatus = 'completed';
      patch = { status: 'completed', completed_at: now };
      buyerMsg = { title: 'Buyurtma yakunlandi', body: `${order.order_number} buyurtmangiz yakunlandi` };
    } else {
      return Response.json({ error: "Noma'lum amal" }, { status: 400 });
    }

    await base44.asServiceRole.entities.Order.update(order.id, patch);

    // Best-effort notifications to the other party.
    const business = await base44.asServiceRole.entities.Business.get(order.business_id).catch(() => null);
    if (buyerMsg && order.user_id) await notify(base44, order.user_id, { ...buyerMsg, type: 'order', related_id: order.id });
    if (sellerMsg && business && business.created_by_id) await notify(base44, business.created_by_id, { ...sellerMsg, type: 'order', related_id: order.id });

    return Response.json({ ok: true, status: newStatus });
  } catch (error) {
    return Response.json({ error: error.message || 'Yangilab bo\'lmadi' }, { status: error.status || 500 });
  }
}
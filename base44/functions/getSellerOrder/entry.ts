import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifySellerOwnsBusiness } from '../../shared/orderAuth.ts';

// Returns a single order with item snapshots to a seller authorized to manage
// the order's business. Verifies ownership before returning any data.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { order_id } = body || {};
    if (!order_id) return Response.json({ error: 'order_id majburiy' }, { status: 400 });

    const order = await base44.asServiceRole.entities.Order.get(order_id).catch(() => null);
    if (!order) return Response.json({ error: 'Buyurtma topilmadi' }, { status: 404 });
    await verifySellerOwnsBusiness(base44, order.business_id, user.id);

    const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: order.id });
    const branch = await base44.asServiceRole.entities.Branch.get(order.branch_id).catch(() => null);
    return Response.json({ order, items: items || [], branch });
  } catch (error) {
    return Response.json({ error: error.message || 'Buyurtma yuklanmadi' }, { status: error.status || 500 });
  }
}
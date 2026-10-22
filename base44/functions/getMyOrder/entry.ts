import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Returns a single order with its item snapshots for the buyer who owns it.
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
    const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: order.id });
    return Response.json({ order, items: items || [] });
  } catch (error) {
    return Response.json({ error: error.message || 'Buyurtma yuklanmadi' }, { status: error.status || 500 });
  }
}
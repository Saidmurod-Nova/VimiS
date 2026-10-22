import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Returns the buyer's orders with their items (snapshots), newest first.
// OrderItem reads are admin-only by RLS, so this runs as service role after
// authenticating the user and scoping by user_id.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { status } = body || {};
    const filter = { user_id: user.id };
    if (status) filter.status = status;
    const orders = await base44.asServiceRole.entities.Order.filter(filter, '-created_date', 100);

    const result = [];
    for (const o of (orders || [])) {
      const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: o.id });
      result.push({ ...o, items: items || [] });
    }
    return Response.json({ orders: result });
  } catch (error) {
    return Response.json({ error: error.message || 'Buyurtmalar yuklanmadi' }, { status: error.status || 500 });
  }
}
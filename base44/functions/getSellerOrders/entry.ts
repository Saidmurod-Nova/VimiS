import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedBusinessIds, verifySellerOwnsBranch } from '../../shared/orderAuth.ts';

// Returns orders belonging only to businesses the authenticated seller owns,
// with item snapshots and branch info. Optional status and branch_id filters.
// Never exposes orders from businesses the seller does not own.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { status, branch_id } = body || {};

    const ownedIds = await getOwnedBusinessIds(base44, user.id);
    if (!ownedIds || ownedIds.length === 0) return Response.json({ orders: [], branches: [] });

    let branches = await base44.asServiceRole.entities.Branch.filter({ owner_id: user.id });
    branches = (branches || []).filter((b) => b.business_id && ownedIds.includes(b.business_id));

    let allowedBranchIds = branches.map((b) => b.id);
    if (branch_id) {
      await verifySellerOwnsBranch(base44, branch_id, user.id);
      allowedBranchIds = [branch_id];
    }

    // Fetch orders across owned businesses (service role), then filter in-memory
    // by branch when a specific branch is selected.
    let orders = [];
    for (const bizId of ownedIds) {
      const f = { business_id: bizId };
      if (status) f.status = status;
      const list = await base44.asServiceRole.entities.Order.filter(f, '-created_date', 200);
      orders = orders.concat(list || []);
    }
    if (branch_id) orders = orders.filter((o) => o.branch_id === branch_id);
    orders.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

    const result = [];
    for (const o of orders) {
      const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: o.id });
      result.push({ ...o, items: items || [] });
    }
    return Response.json({ orders: result, branches: branches.map((b) => ({ id: b.id, name: b.name, business_id: b.business_id })) });
  } catch (error) {
    return Response.json({ error: error.message || 'Buyurtmalar yuklanmadi' }, { status: error.status || 500 });
  }
}
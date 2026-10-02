import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifySellerOwnsBusiness } from '../../shared/orderAuth.ts';
import { resolveRange, DEFAULT_THRESHOLD } from '../../shared/statsAuth.ts';

// Returns the seller business dashboard for one owned business: header info,
// authorized branches, summary metrics, recent orders, and inventory alerts.
// All metrics are computed from real order/inventory records, scoped to the
// selected branch (or all active branches). Ownership is verified server-side.
//
// Metric definitions:
//   totalSales   — sum of completed order totals completed within the range
//   totalOrders  — distinct orders created within the range (all statuses)
//   pending/preparing/completed/cancelled — CURRENT counts (active workload),
//                                            not period-bound, to surface work.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { business_id, branch_id, range, from, to } = body || {};
    if (!business_id) return Response.json({ error: 'business_id majburiy' }, { status: 400 });

    const business = await verifySellerOwnsBusiness(base44, business_id, user.id);
    const threshold = business.low_stock_threshold != null ? Number(business.low_stock_threshold) : DEFAULT_THRESHOLD;

    let branches = await base44.asServiceRole.entities.Branch.filter({ business_id, owner_id: user.id });
    branches = (branches || []).slice().sort((a, b) => (b.is_active ? 1 : 0) - (a.is_active ? 1 : 0));

    // Resolve target branch scope (null = all active branches).
    let targetBranchIds = null;
    if (branch_id && branch_id !== 'all') {
      const ok = branches.find((b) => b.id === branch_id);
      if (!ok) return Response.json({ error: "Filial topilmadi yoki ruxsat yo'q" }, { status: 403 });
      targetBranchIds = [branch_id];
    }

    const { startMs, endMs, label } = resolveRange(range, from, to);

    // Fetch orders for the business (service role) and filter to branch scope.
    let orders = await base44.asServiceRole.entities.Order.filter({ business_id }, '-created_date', 500);
    orders = orders || [];
    if (targetBranchIds) orders = orders.filter((o) => targetBranchIds.includes(o.branch_id));

    let totalSales = 0;
    let totalOrders = 0;
    let pending = 0, preparing = 0, completed = 0, cancelled = 0;
    for (const o of orders) {
      const created = new Date(o.created_date).getTime();
      if (created >= startMs && created <= endMs) {
        totalOrders++;
      }
      if (o.status === 'completed' && o.completed_at) {
        const ct = new Date(o.completed_at).getTime();
        if (ct >= startMs && ct <= endMs) totalSales += Math.round(o.total || 0);
      }
      if (o.status === 'pending') pending++;
      else if (o.status === 'preparing') preparing++;
      else if (o.status === 'completed') completed++;
      else if (o.status === 'cancelled') cancelled++;
    }

    // Recent orders (newest first), with item_count already denormalized.
    const recentOrders = orders.slice(0, 6).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      buyer_name_snapshot: o.buyer_name_snapshot || '',
      branch_name: o.branch_name || '',
      branch_id: o.branch_id,
      created_date: o.created_date,
      total: Math.round(o.total || 0),
      status: o.status,
      item_count: o.item_count || 0,
    }));

    // Inventory alerts for the selected scope.
    let inventory = [];
    if (targetBranchIds) {
      inventory = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: targetBranchIds[0] });
    } else {
      inventory = await base44.asServiceRole.entities.BranchInventory.filter({ business_id });
    }
    inventory = inventory || [];
    const products = await base44.asServiceRole.entities.Product.filter({ business_id });
    const prodById = {};
    for (const p of (products || [])) prodById[p.id] = p;

    let outOfStock = 0, lowStock = 0, totalAvailable = 0;
    const alertItems = [];
    for (const inv of inventory) {
      const p = prodById[inv.product_id];
      if (!p) continue; // orphaned inventory (deleted product) is not an active alert
      const stock = inv.stock || 0;
      const available = inv.is_available !== false;
      if (!available) continue; // disabled listings are not active inventory warnings
      if (stock > 0) totalAvailable++;
      if (stock === 0) outOfStock++;
      else if (stock <= threshold) lowStock++;
      if (stock <= threshold) {
        alertItems.push({
          product_id: p.id,
          name: p.name,
          image_url: p.image_url || null,
          stock,
          category_name: p.category_name || null,
        });
      }
    }
    alertItems.sort((a, b) => (a.stock === 0 ? 0 : 1) - (b.stock === 0 ? 0 : 1));

    return Response.json({
      business: {
        id: business.id,
        name: business.name,
        logo_url: business.logo_url || null,
        store_id: business.store_id,
        category_name: business.category_name || '',
        is_active: business.is_active !== false,
        low_stock_threshold: threshold,
      },
      branches: branches.map((b) => ({
        id: b.id, name: b.name, is_active: b.is_active !== false,
        city: b.city || '', region: b.region || '', address: b.address || '',
      })),
      selectedBranchId: targetBranchIds ? targetBranchIds[0] : null,
      range: { label, start: startMs, end: endMs },
      metrics: { totalSales, totalOrders, pending, preparing, completed, cancelled },
      recentOrders,
      inventory: {
        threshold,
        outOfStock,
        lowStock,
        totalAvailable,
        items: alertItems.slice(0, 20),
      },
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Dashboard yuklanmadi' }, { status: error.status || 500 });
  }
}
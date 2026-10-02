import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { verifySellerOwnsBusiness } from '../../shared/orderAuth.ts';
import { resolveRange, buildBuckets, DEFAULT_THRESHOLD, DAY_MS } from '../../shared/statsAuth.ts';

// Returns business/branch statistics computed from real records: core metrics,
// revenue & order trends, branch comparison (when all branches selected and
// more than one authorized branch exists), and product performance derived
// from immutable completed OrderItem snapshots. Ownership is verified first.
//
// Revenue = sum of completed order totals (completed_at within range).
// Products sold = sum of completed OrderItem quantities in range.
// AOV = completed revenue / completed order count (0 when none).
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
    branches = branches || [];

    let targetBranchIds = null;
    if (branch_id && branch_id !== 'all') {
      const ok = branches.find((b) => b.id === branch_id);
      if (!ok) return Response.json({ error: "Filial topilmadi yoki ruxsat yo'q" }, { status: 403 });
      targetBranchIds = [branch_id];
    }

    let { startMs, endMs, label, bucket } = resolveRange(range, from, to);

    // Fetch orders for the business, scoped to branch.
    let orders = await base44.asServiceRole.entities.Order.filter({ business_id }, '-created_date', 500);
    orders = orders || [];
    if (targetBranchIds) orders = orders.filter((o) => targetBranchIds.includes(o.branch_id));

    // For "all time", anchor buckets to the earliest order so we don't emit
    // hundreds of empty months from 1970.
    if (range === 'all' || !startMs) {
      if (orders.length > 0) {
        const earliest = orders.reduce((min, o) => {
          const t = new Date(o.created_date).getTime();
          return t < min ? t : min;
        }, Date.now());
        startMs = earliest;
        const span = endMs - startMs;
        bucket = span <= 31 * DAY_MS ? 'day' : span <= 95 * DAY_MS ? 'week' : 'month';
      } else {
        startMs = endMs - 6 * DAY_MS;
        bucket = 'day';
      }
    }

    // Core metrics
    let completedRevenue = 0;
    let orderCount = 0;
    let completedCount = 0;
    let cancelledCount = 0;
    let productsSold = 0;
    const completedOrderIds = [];
    for (const o of orders) {
      const created = new Date(o.created_date).getTime();
      if (created >= startMs && created <= endMs) {
        orderCount++;
        if (o.status === 'cancelled') cancelledCount++;
      }
      if (o.status === 'completed' && o.completed_at) {
        const ct = new Date(o.completed_at).getTime();
        if (ct >= startMs && ct <= endMs) {
          completedRevenue += Math.round(o.total || 0);
          completedCount++;
          completedOrderIds.push(o.id);
        }
      }
    }
    const avgOrderValue = completedCount > 0 ? Math.round(completedRevenue / completedCount) : 0;

    // Trends
    const revBuckets = buildBuckets(startMs, endMs, bucket);
    const revenueTrend = revBuckets.map((b) => ({ label: b.label, value: 0 }));
    const orderTrend = revBuckets.map((b) => ({ label: b.label, total: 0, completed: 0, cancelled: 0 }));
    const findBucket = (ts) => {
      for (let i = 0; i < revBuckets.length; i++) {
        if (ts >= revBuckets[i].start && ts <= revBuckets[i].end) return i;
      }
      return -1;
    };
    for (const o of orders) {
      const created = new Date(o.created_date).getTime();
      const bi = findBucket(created);
      if (bi >= 0) {
        orderTrend[bi].total++;
        if (o.status === 'cancelled') orderTrend[bi].cancelled++;
      }
      if (o.status === 'completed' && o.completed_at) {
        const ci = findBucket(new Date(o.completed_at).getTime());
        if (ci >= 0) {
          revenueTrend[ci].value += Math.round(o.total || 0);
          orderTrend[ci].completed++;
        }
      }
    }

    // Product performance from completed OrderItem snapshots in range.
    const productPerf = {};
    for (const oid of completedOrderIds) {
      const items = await base44.asServiceRole.entities.OrderItem.filter({ order_id: oid });
      for (const it of (items || [])) {
        const key = it.product_id || it.product_name || 'unknown';
        if (!productPerf[key]) {
          productPerf[key] = { productId: it.product_id || null, name: it.product_name, image_url: it.image_url || null, quantitySold: 0, revenue: 0 };
        }
        const qty = it.quantity || 0;
        productPerf[key].quantitySold += qty;
        productPerf[key].revenue += Math.round(it.subtotal || 0);
        productsSold += qty;
      }
    }

    // Current stock per product for the selected scope.
    let inventory = [];
    if (targetBranchIds) {
      inventory = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: targetBranchIds[0] });
    } else {
      inventory = await base44.asServiceRole.entities.BranchInventory.filter({ business_id });
    }
    const stockByProduct = {};
    for (const inv of (inventory || [])) {
      const s = inv.stock || 0;
      stockByProduct[inv.product_id] = (stockByProduct[inv.product_id] || 0) + s;
    }

    const productPerformance = Object.values(productPerf)
      .map((p) => ({ ...p, currentStock: stockByProduct[p.productId] != null ? stockByProduct[p.productId] : null }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);

    // Branch comparison — only when all branches selected and >1 authorized branch.
    let branchComparison = null;
    if (!targetBranchIds && branches.length > 1) {
      branchComparison = [];
      // Pre-fetch inventory per branch for low-stock counts.
      for (const b of branches) {
        const branchOrders = orders.filter((o) => o.branch_id === b.id);
        let bRev = 0, bOrders = 0, bCompleted = 0, bPending = 0;
        for (const o of branchOrders) {
          const created = new Date(o.created_date).getTime();
          if (created >= startMs && created <= endMs) {
            bOrders++;
            if (o.status === 'cancelled') { /* counted in cancelled only */ }
          }
          if (o.status === 'completed' && o.completed_at) {
            const ct = new Date(o.completed_at).getTime();
            if (ct >= startMs && ct <= endMs) { bRev += Math.round(o.total || 0); bCompleted++; }
          }
          if (o.status === 'pending') bPending++;
        }
        let bLow = 0;
        const inv = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id: b.id });
        for (const i of (inv || [])) {
          if (i.is_available === false) continue;
          const s = i.stock || 0;
          if (s > 0 && s <= threshold) bLow++;
        }
        branchComparison.push({
          branchId: b.id, name: b.name, is_active: b.is_active !== false,
          revenue: bRev, orders: bOrders, completed: bCompleted, pending: bPending, lowStock: bLow,
        });
      }
      branchComparison.sort((a, b) => b.revenue - a.revenue);
    }

    return Response.json({
      business: {
        id: business.id, name: business.name, logo_url: business.logo_url || null,
        store_id: business.store_id, low_stock_threshold: threshold,
      },
      branches: branches.map((b) => ({ id: b.id, name: b.name, is_active: b.is_active !== false })),
      selectedBranchId: targetBranchIds ? targetBranchIds[0] : null,
      range: { label, start: startMs, end: endMs, bucket },
      core: { completedRevenue, orderCount, completedCount, cancelledCount, avgOrderValue, productsSold },
      revenueTrend,
      orderTrend,
      branchComparison,
      productPerformance,
      threshold,
    });
  } catch (error) {
    return Response.json({ error: error.message || 'Statistika yuklanmadi' }, { status: error.status || 500 });
  }
}
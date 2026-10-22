import { requireSupabase } from '@/lib/supabase';

const DAY_MS = 86400000;
const TZ_OFFSET_MS = 5 * 3600000;
const MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];

function resolveRange(range, from, to) {
  const now = Date.now();
  const shifted = new Date(now + TZ_OFFSET_MS);
  const today = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TZ_OFFSET_MS;
  if (range === 'today') return { start: today, end: now, label: 'Bugun', bucket: 'day' };
  if (range === '7d') return { start: today - 6 * DAY_MS, end: now, label: 'Oxirgi 7 kun', bucket: 'day' };
  if (range === '30d') return { start: today - 29 * DAY_MS, end: now, label: 'Oxirgi 30 kun', bucket: 'day' };
  if (range === 'custom' && from && to) {
    const [fy, fm, fd] = from.split('-').map(Number);
    const [ty, tm, td] = to.split('-').map(Number);
    const start = Date.UTC(fy, fm - 1, fd) - TZ_OFFSET_MS;
    const end = Date.UTC(ty, tm - 1, td) - TZ_OFFSET_MS + DAY_MS - 1;
    const span = end - start;
    return { start, end, label: `${from} – ${to}`, bucket: span <= 31 * DAY_MS ? 'day' : span <= 95 * DAY_MS ? 'week' : 'month' };
  }
  return { start: 0, end: now, label: 'Barcha vaqt', bucket: 'month' };
}

function buildBuckets(start, end, bucket) {
  const buckets = [];
  if (bucket === 'day') {
    const shifted = new Date(start + TZ_OFFSET_MS);
    let cursor = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TZ_OFFSET_MS;
    while (cursor <= end && buckets.length < 400) {
      const date = new Date(cursor + TZ_OFFSET_MS);
      buckets.push({ label: `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`, start: cursor, end: cursor + DAY_MS - 1 });
      cursor += DAY_MS;
    }
  } else if (bucket === 'week') {
    const shifted = new Date(start + TZ_OFFSET_MS);
    let cursor = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - TZ_OFFSET_MS;
    cursor -= ((new Date(cursor + TZ_OFFSET_MS).getUTCDay() + 6) % 7) * DAY_MS;
    while (cursor <= end && buckets.length < 200) {
      const date = new Date(cursor + TZ_OFFSET_MS);
      buckets.push({ label: `${String(date.getUTCDate()).padStart(2, '0')}.${String(date.getUTCMonth() + 1).padStart(2, '0')}`, start: cursor, end: cursor + 7 * DAY_MS - 1 });
      cursor += 7 * DAY_MS;
    }
  } else {
    const shifted = new Date(start + TZ_OFFSET_MS);
    let year = shifted.getUTCFullYear();
    let month = shifted.getUTCMonth();
    while (buckets.length < 240) {
      const bucketStart = Date.UTC(year, month, 1) - TZ_OFFSET_MS;
      if (bucketStart > end) break;
      buckets.push({ label: MONTHS[month], start: bucketStart, end: Date.UTC(year, month + 1, 1) - TZ_OFFSET_MS - 1 });
      if (++month > 11) { month = 0; year++; }
    }
  }
  return buckets;
}

export async function getSellerStatistics({ businessId, branchId = 'all', range = '30d', from = null, to = null }) {
  const client = requireSupabase();
  if (!businessId) throw new Error('Biznes tanlanishi kerak.');
  const [{ data: business, error: businessError }, { data: branches, error: branchesError }, { data: rows, error: ordersError }, { data: inventory, error: inventoryError }] = await Promise.all([
    client.from('businesses').select('*').eq('id', String(businessId)).maybeSingle(),
    client.from('branches').select('id,name,is_active').eq('business_id', String(businessId)).order('created_at'),
    client.from('orders').select('*').eq('business_id', String(businessId)).order('created_at', { ascending: false }).limit(1000),
    client.from('branch_inventory').select('branch_id,product_id,stock,is_available').eq('business_id', String(businessId)).limit(2000),
  ]);
  if (businessError) throw new Error(businessError.message || 'Biznes ma’lumotlari yuklanmadi.');
  if (branchesError) throw new Error(branchesError.message || 'Filiallar yuklanmadi.');
  if (ordersError) throw new Error(ordersError.message || 'Buyurtmalar yuklanmadi.');
  if (inventoryError) throw new Error(inventoryError.message || 'Ombor ma’lumotlari yuklanmadi.');
  if (!business) throw new Error('Biznes topilmadi.');

  const allBranches = branches || [];
  const selectedBranch = branchId && branchId !== 'all' ? allBranches.find((branch) => branch.id === branchId) : null;
  if (branchId && branchId !== 'all' && !selectedBranch) throw new Error('Filial topilmadi yoki ruxsat yo‘q.');
  const orders = (rows || []).filter((order) => !selectedBranch || order.branch_id === selectedBranch.id);
  let period = resolveRange(range, from, to);
  if (range === 'all' || !period.start) {
    const earliest = orders.reduce((min, order) => Math.min(min, new Date(order.created_at).getTime()), Date.now());
    period.start = orders.length ? earliest : period.end - 6 * DAY_MS;
    const span = period.end - period.start;
    period.bucket = span <= 31 * DAY_MS ? 'day' : span <= 95 * DAY_MS ? 'week' : 'month';
  }

  const inRange = (value) => {
    const time = new Date(value).getTime();
    return time >= period.start && time <= period.end;
  };
  const completedOrders = orders.filter((order) => order.status === 'completed' && order.completed_at && inRange(order.completed_at));
  const completedRevenue = completedOrders.reduce((sum, order) => sum + Math.round(Number(order.total) || 0), 0);
  const periodOrders = orders.filter((order) => inRange(order.created_at));
  const orderCount = periodOrders.length;
  const cancelledCount = periodOrders.filter((order) => order.status === 'cancelled').length;
  const bucketRows = buildBuckets(period.start, period.end, period.bucket);
  const revenueTrend = bucketRows.map(({ label }) => ({ label, value: 0 }));
  const orderTrend = bucketRows.map(({ label }) => ({ label, total: 0, completed: 0, cancelled: 0 }));
  const findBucket = (value) => bucketRows.findIndex((bucket) => value >= bucket.start && value <= bucket.end);
  for (const order of orders) {
    const orderBucket = findBucket(new Date(order.created_at).getTime());
    if (orderBucket >= 0) {
      orderTrend[orderBucket].total++;
      if (order.status === 'cancelled') orderTrend[orderBucket].cancelled++;
    }
    if (order.status === 'completed' && order.completed_at) {
      const completedBucket = findBucket(new Date(order.completed_at).getTime());
      if (completedBucket >= 0) {
        revenueTrend[completedBucket].value += Math.round(Number(order.total) || 0);
        orderTrend[completedBucket].completed++;
      }
    }
  }

  const orderIds = completedOrders.map((order) => order.id);
  let orderItems = [];
  if (orderIds.length) {
    const { data, error } = await client.from('order_items').select('order_id,product_id,product_name,image_url,quantity,subtotal')
      .in('order_id', orderIds).limit(5000);
    if (error) throw new Error(error.message || 'Buyurtma mahsulotlari yuklanmadi.');
    orderItems = data || [];
  }
  const stockByProduct = new Map();
  const scopedInventory = (inventory || []).filter((row) => !selectedBranch || row.branch_id === selectedBranch.id);
  for (const row of scopedInventory) stockByProduct.set(row.product_id, (stockByProduct.get(row.product_id) || 0) + Number(row.stock || 0));
  const performanceByProduct = new Map();
  let productsSold = 0;
  for (const item of orderItems) {
    const key = item.product_id || item.product_name || 'unknown';
    const product = performanceByProduct.get(key) || {
      productId: item.product_id || null, name: item.product_name, image_url: item.image_url || null, quantitySold: 0, revenue: 0,
    };
    product.quantitySold += Number(item.quantity || 0);
    product.revenue += Math.round(Number(item.subtotal) || 0);
    productsSold += Number(item.quantity || 0);
    performanceByProduct.set(key, product);
  }
  const productPerformance = [...performanceByProduct.values()]
    .map((product) => ({ ...product, currentStock: stockByProduct.get(product.productId) ?? null }))
    .sort((a, b) => b.revenue - a.revenue).slice(0, 15);

  let branchComparison = null;
  if (!selectedBranch && allBranches.length > 1) {
    branchComparison = allBranches.map((branch) => {
      const branchOrders = orders.filter((order) => order.branch_id === branch.id);
      const branchPeriodOrders = branchOrders.filter((order) => inRange(order.created_at));
      const branchCompleted = branchOrders.filter((order) => order.status === 'completed' && order.completed_at && inRange(order.completed_at));
      const branchInventory = (inventory || []).filter((row) => row.branch_id === branch.id && row.is_available !== false);
      return {
        branchId: branch.id, name: branch.name, is_active: branch.is_active !== false,
        revenue: branchCompleted.reduce((sum, order) => sum + Math.round(Number(order.total) || 0), 0),
        orders: branchPeriodOrders.length, completed: branchCompleted.length,
        pending: branchOrders.filter((order) => order.status === 'pending').length,
        lowStock: branchInventory.filter((row) => Number(row.stock) > 0 && Number(row.stock) <= Number(business.low_stock_threshold ?? 5)).length,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }

  return {
    business: { id: business.id, name: business.name, logo_url: business.logo_url || null, store_id: business.store_id, low_stock_threshold: business.low_stock_threshold ?? 5 },
    branches: allBranches,
    selectedBranchId: selectedBranch?.id || null,
    range: { label: period.label, start: period.start, end: period.end, bucket: period.bucket },
    core: {
      completedRevenue, orderCount, completedCount: completedOrders.length, cancelledCount,
      avgOrderValue: completedOrders.length ? Math.round(completedRevenue / completedOrders.length) : 0, productsSold,
    },
    revenueTrend, orderTrend, branchComparison, productPerformance,
    threshold: Number(business.low_stock_threshold ?? 5),
  };
}
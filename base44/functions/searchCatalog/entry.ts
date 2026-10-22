import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { escapeRegex } from "../../shared/storeAuth.ts";

// Buyer search over public, active businesses (by name or Store ID) and active
// products (by name) of active businesses. Special characters are escaped so
// user input cannot break the query. No private seller data is exposed.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const q = ((body || {}).q || "").trim();
    if (!q) return Response.json({ businesses: [], products: [] });

    const rx = escapeRegex(q);
    const [byName, byStoreId, productsRaw] = await Promise.all([
      base44.asServiceRole.entities.Business.filter({ name: { $regex: rx, $options: "i" } }, "-created_date", 50),
      base44.asServiceRole.entities.Business.filter({ store_id: { $regex: rx, $options: "i" } }, "-created_date", 50),
      base44.asServiceRole.entities.Product.filter({ name: { $regex: rx, $options: "i" } }, "-created_date", 50)
    ]);

    const bizMap = new Map();
    for (const b of [...(byName || []), ...(byStoreId || [])]) {
      if (b.is_active) bizMap.set(b.id, b);
    }
    const businesses = Array.from(bizMap.values());

    const products = [];
    for (const p of (productsRaw || [])) {
      if (!p.is_active) continue;
      let business = businesses.find((b) => b.id === p.business_id);
      if (!business) {
        business = await base44.asServiceRole.entities.Business.get(p.business_id);
      }
      if (!business || !business.is_active) continue;
      products.push({
        product_id: p.id,
        name: p.name,
        image_url: p.image_url,
        price: p.price,
        category_name: p.category_name,
        business_id: business.id,
        business_name: business.name,
        store_id: business.store_id
      });
    }

    return Response.json({ businesses, products });
  } catch (error) {
    return Response.json({ error: error.message || "Qidiruv xatosi" }, { status: error.status || 500 });
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Buyer-facing read for a branch's product catalog. Runs as service role so
// buyers (who cannot read BranchInventory directly) get a safe, computed view:
// only active branches of active businesses, with effective branch pricing and
// availability computed server-side.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { branch_id } = body || {};
    if (!branch_id) return Response.json({ error: "Filial majburiy" }, { status: 400 });

    const branch = await base44.asServiceRole.entities.Branch.get(branch_id);
    if (!branch) return Response.json({ error: "Filial topilmadi" }, { status: 404 });
    if (!branch.is_active) return Response.json({ error: "Bu filial hozirda faol emas" }, { status: 400 });

    const business = await base44.asServiceRole.entities.Business.get(branch.business_id);
    if (!business || !business.is_active) {
      return Response.json({ error: "Do'kon hozirda faol emas" }, { status: 400 });
    }

    const [products, inventory] = await Promise.all([
      base44.asServiceRole.entities.Product.filter({ business_id: branch.business_id }),
      base44.asServiceRole.entities.BranchInventory.filter({ branch_id })
    ]);

    const invByProduct = {};
    for (const inv of (inventory || [])) invByProduct[inv.product_id] = inv;

    const items = (products || []).filter((p) => p.is_active).map((p) => {
      const inv = invByProduct[p.id];
      const hasInv = !!inv;
      const stock = hasInv ? (inv.stock || 0) : 0;
      const available = hasInv && inv.is_available === true && stock > 0;
      const effectivePrice = hasInv && inv.price_override != null ? inv.price_override : p.price;
      return {
        product_id: p.id,
        name: p.name,
        description: p.description,
        image_url: p.image_url,
        category_name: p.category_name,
        base_price: p.price,
        effective_price: effectivePrice,
        stock,
        has_inventory: hasInv,
        is_available: hasInv ? inv.is_available === true : false,
        available,
        disabled: hasInv && inv.is_available === false
      };
    });

    return Response.json({ branch, business, items });
  } catch (error) {
    return Response.json({ error: error.message || "Katalog yuklanmadi" }, { status: error.status || 500 });
  }
}
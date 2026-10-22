import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getOwnedBranch, getOwnedProduct } from '../../shared/productAuth.ts';

// Single write path for branch inventory. Enforces:
//  - branch & product ownership
//  - product and branch belong to the same business
//  - uniqueness of (branch_id + product_id): updates the existing record if present
//  - stock >= 0 and price_override >= 0
// Frontend stock math is never trusted; all writes go through here.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { branch_id, product_id, stock, price_override, is_available } = body || {};
    if (!branch_id || !product_id) {
      return Response.json({ error: "Filial va mahsulot majburiy" }, { status: 400 });
    }

    const branch = await getOwnedBranch(base44, branch_id, user.id);
    const product = await getOwnedProduct(base44, product_id, user.id);
    if (product.business_id !== branch.business_id) {
      return Response.json({ error: "Mahsulot va filial bitta biznesga tegishli bo'lishi kerak" }, { status: 400 });
    }

    const numStock = stock === undefined ? undefined : Math.floor(Number(stock));
    if (numStock !== undefined && (Number.isNaN(numStock) || numStock < 0)) {
      return Response.json({ error: "Stock manfiy bo'lolmaydi" }, { status: 400 });
    }

    let numOverride = undefined;
    if (price_override !== undefined && price_override !== null && price_override !== '') {
      numOverride = Math.round(Number(price_override));
      if (Number.isNaN(numOverride) || numOverride < 0) {
        return Response.json({ error: "Narx noto'g'ri" }, { status: 400 });
      }
    } else if (price_override === null || price_override === '') {
      numOverride = null;
    }

    const existing = await base44.asServiceRole.entities.BranchInventory.filter({ branch_id, product_id });
    const inv = existing && existing[0];

    if (inv) {
      const update = {};
      if (numStock !== undefined) update.stock = numStock;
      if (numOverride !== undefined) update.price_override = numOverride;
      if (is_available !== undefined) update.is_available = !!is_available;
      const updated = await base44.asServiceRole.entities.BranchInventory.update(inv.id, update);
      return Response.json({ inventory: updated, created: false });
    }

    const created = await base44.asServiceRole.entities.BranchInventory.create({
      branch_id,
      product_id,
      business_id: branch.business_id,
      owner_id: user.id,
      stock: numStock !== undefined ? numStock : 0,
      price_override: numOverride === undefined ? null : numOverride,
      is_available: is_available !== undefined ? !!is_available : true
    });
    return Response.json({ inventory: created, created: true });
  } catch (error) {
    return Response.json({ error: error.message || "Inventar yangilanmadi" }, { status: error.status || 500 });
  }
}
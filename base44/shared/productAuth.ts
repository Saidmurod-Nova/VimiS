// Shared ownership helpers for the Product / Inventory module.
// RLS cannot express cross-entity ownership (a product belongs to a business
// owned by the user), so write functions verify ownership server-side.
// NOTE: shared modules cannot import each other, so getOwnedBusiness is
// inlined here (kept in sync with branchAuth.ts).

export async function getOwnedBusiness(base44, businessId, userId) {
  let business;
  try { business = await base44.asServiceRole.entities.Business.get(businessId); }
  catch (e) { business = null; }
  if (!business || business.created_by_id !== userId) {
    const err = new Error("Biznes topilmadi yoki ruxsat yo'q");
    err.status = 403;
    throw err;
  }
  return business;
}

// Verify a branch belongs to a business owned by the user; returns the branch.
export async function getOwnedBranch(base44, branchId, userId) {
  const branch = await base44.asServiceRole.entities.Branch.get(branchId);
  if (!branch || branch.owner_id !== userId) {
    const err = new Error("Filial topilmadi yoki ruxsat yo'q");
    err.status = 403;
    throw err;
  }
  return branch;
}

// Verify a product belongs to a business owned by the user; returns the product.
export async function getOwnedProduct(base44, productId, userId) {
  const product = await base44.asServiceRole.entities.Product.get(productId);
  if (!product) {
    const err = new Error("Mahsulot topilmadi");
    err.status = 404;
    throw err;
  }
  await getOwnedBusiness(base44, product.business_id, userId);
  return product;
}
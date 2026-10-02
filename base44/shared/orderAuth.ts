// Shared ownership + helpers for the Orders module. Seller access to orders is
// scoped by business ownership, which RLS cannot express, so seller-facing
// functions verify ownership here (service role) before returning data.

// Returns the list of business ids a user owns.
export async function getOwnedBusinessIds(base44, userId) {
  const list = await base44.asServiceRole.entities.Business.filter({ created_by_id: userId });
  return (list || []).map((b) => b.id);
}

// Throws 403 unless the user owns the business; returns the business.
export async function verifySellerOwnsBusiness(base44, businessId, userId) {
  const biz = await base44.asServiceRole.entities.Business.get(businessId).catch(() => null);
  if (!biz || biz.created_by_id !== userId) {
    const err = new Error("Biznes topilmadi yoki ruxsat yo'q");
    err.status = 403;
    throw err;
  }
  return biz;
}

// Throws 403 unless the user owns the branch's business; returns the branch.
export async function verifySellerOwnsBranch(base44, branchId, userId) {
  const branch = await base44.asServiceRole.entities.Branch.get(branchId).catch(() => null);
  if (!branch || branch.owner_id !== userId) {
    const err = new Error("Filial topilmadi yoki ruxsat yo'q");
    err.status = 403;
    throw err;
  }
  return branch;
}

// Generates a human-readable, unique order number. Checks the database to
// avoid collisions; falls back to a timestamp-based number after a few tries.
export async function generateOrderNumber(base44) {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  for (let i = 0; i < 6; i++) {
    const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
    const num = `VIM-${y}${m}${day}-${rnd}`;
    const existing = await base44.asServiceRole.entities.Order.filter({ order_number: num });
    if (!existing || existing.length === 0) return num;
  }
  return `VIM-${y}${m}${day}-${Date.now().toString(36).toUpperCase()}`;
}
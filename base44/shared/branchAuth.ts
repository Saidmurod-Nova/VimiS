// Shared helper: verifies a business belongs to the calling user.
// Used by branch write functions so a user cannot attach branches to
// a business they do not own (RLS alone cannot express cross-entity ownership).
export async function getOwnedBusiness(base44, businessId, userId) {
  const business = await base44.asServiceRole.entities.Business.get(businessId);
  if (!business || business.created_by_id !== userId) {
    const err = new Error("Biznes topilmadi yoki ruxsat yo'q");
    err.status = 403;
    throw err;
  }
  return business;
}
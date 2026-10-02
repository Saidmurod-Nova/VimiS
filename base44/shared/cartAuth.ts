// Shared helpers for cart operations. Cart mutations run as service role
// (Cart/CartItem writes are admin-only by RLS), so ownership is verified
// explicitly in each function. A user has at most one active cart at a time.

export async function getMyActiveCart(base44, userId) {
  const list = await base44.asServiceRole.entities.Cart.filter({ user_id: userId, status: 'active' });
  return list && list[0] ? list[0] : null;
}
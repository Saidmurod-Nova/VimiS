import { requireSupabase } from '@/lib/supabase';

/**
 * Supabase RPC wrappers for order operations.
 *
 * These functions work only after:
 * 1) the Supabase schema and migration 003 are applied,
 * 2) the user is authenticated through Supabase,
 * 3) the cart/address data already exists in Supabase.
 *
 * They deliberately do not fall back to Base44, because mixing Base44 user IDs
 * and Supabase auth.uid() would create ownership/security bugs.
 */
export async function checkoutSupabase({
  cartId,
  addressId,
  paymentMethod = 'cash_on_delivery',
  notes = '',
}) {
  if (!cartId || !addressId) {
    throw new Error('Savat va manzil tanlanishi kerak.');
  }

  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    throw new Error('Buyurtma berish uchun Supabase hisobiga kiring.');
  }

  const { data, error } = await client.rpc('vimi_checkout', {
    p_cart_id: String(cartId),
    p_address_id: String(addressId),
    p_payment_method: paymentMethod,
    p_notes: notes,
  });
  if (error) throw new Error(error.message || 'Buyurtma yaratilmadi.');
  if (!data?.ok || !data?.order_id) {
    throw new Error('Buyurtma yaratilgani tasdiqlanmadi.');
  }
  return data;
}

export async function updateOrderStatusSupabase({
  orderId,
  status,
  cancellationReason = '',
}) {
  if (!orderId || !status) throw new Error('Buyurtma va yangi holat majburiy.');

  const client = requireSupabase();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) {
    throw new Error('Buyurtmani boshqarish uchun Supabase hisobiga kiring.');
  }

  const { data, error } = await client.rpc('vimi_update_order_status', {
    p_order_id: String(orderId),
    p_new_status: status,
    p_cancellation_reason: cancellationReason,
  });
  if (error) throw new Error(error.message || 'Buyurtma holatini o‘zgartirib bo‘lmadi.');
  if (!data?.ok) throw new Error('Buyurtma holati o‘zgargani tasdiqlanmadi.');
  return data;
}

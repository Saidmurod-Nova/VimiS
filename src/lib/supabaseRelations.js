import { requireSupabase } from '@/lib/supabase';

async function currentUserId(client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error('Bu amal uchun Supabase hisobiga kiring.');
  return data.user.id;
}

function fail(error, fallback) {
  if (error) {
    console.error(fallback, error);
    throw new Error(error.message || fallback);
  }
}

export async function listAddresses() {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { data, error } = await client.from('addresses').select('*').eq('user_id', userId)
    .order('is_default', { ascending: false }).order('created_at', { ascending: false });
  fail(error, 'Manzillarni yuklab bo‘lmadi.');
  return data || [];
}

export async function getAddress(addressId) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { data, error } = await client.from('addresses').select('*').eq('id', String(addressId))
    .eq('user_id', userId).maybeSingle();
  fail(error, 'Manzilni yuklab bo‘lmadi.');
  return data;
}

export async function saveAddress({ addressId, title, address, latitude, longitude, isDefault = false }) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const payload = {
    user_id: userId,
    title: String(title || '').trim(),
    address: String(address || '').trim(),
    latitude: latitude == null ? null : Number(latitude),
    longitude: longitude == null ? null : Number(longitude),
    is_default: Boolean(isDefault),
  };
  if (!payload.title || !payload.address) throw new Error('Sarlavha va manzil majburiy.');

  if (payload.is_default) {
    const { error } = await client.from('addresses').update({ is_default: false })
      .eq('user_id', userId).eq('is_default', true);
    fail(error, 'Asosiy manzilni yangilab bo‘lmadi.');
  }

  const query = addressId
    ? client.from('addresses').update(payload).eq('id', String(addressId)).eq('user_id', userId)
    : client.from('addresses').insert(payload);
  const { data, error } = await query.select('*').single();
  fail(error, 'Manzil saqlanmadi.');
  return data;
}

export async function deleteAddress(addressId) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { error } = await client.from('addresses').delete().eq('id', String(addressId)).eq('user_id', userId);
  fail(error, 'Manzilni o‘chirib bo‘lmadi.');
}

export async function createProductCategory(businessId, name) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { data, error } = await client.from('product_categories').insert({
    business_id: String(businessId), name: String(name || '').trim(), created_by_id: userId,
  }).select('*').single();
  fail(error, 'Kategoriya yaratilmadi. Biznes egasini tekshiring.');
  return data;
}

export async function updateProductCategory(categoryId, name) {
  const client = requireSupabase();
  const { data, error } = await client.from('product_categories').update({ name: String(name || '').trim() })
    .eq('id', String(categoryId)).select('*').single();
  fail(error, 'Kategoriyani yangilab bo‘lmadi.');
  return data;
}

export async function deleteProductCategory(categoryId) {
  const client = requireSupabase();
  const { error } = await client.from('product_categories').delete().eq('id', String(categoryId));
  fail(error, 'Kategoriyani o‘chirib bo‘lmadi.');
}

export async function getBuyerOrder(orderId) {
  const client = requireSupabase();
  const { data: order, error } = await client.from('orders').select('*').eq('id', String(orderId)).maybeSingle();
  fail(error, 'Buyurtmani yuklab bo‘lmadi.');
  if (!order) return null;
  const { data: items, error: itemsError } = await client.from('order_items').select('*')
    .eq('order_id', order.id).order('created_at', { ascending: true });
  fail(itemsError, 'Buyurtma mahsulotlarini yuklab bo‘lmadi.');
  return { order: { ...order, created_date: order.created_at }, items: items || [] };
}

export async function getSellerOrder(orderId) {
  const client = requireSupabase();
  const { data: order, error } = await client.from('orders').select('*').eq('id', String(orderId)).maybeSingle();
  fail(error, 'Buyurtmani yuklab bo‘lmadi.');
  if (!order) return null;
  const [{ data: items, error: itemsError }, { data: branch, error: branchError }] = await Promise.all([
    client.from('order_items').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
    client.from('branches').select('*').eq('id', order.branch_id).maybeSingle(),
  ]);
  fail(itemsError, 'Buyurtma mahsulotlarini yuklab bo‘lmadi.');
  fail(branchError, 'Filial ma’lumotlarini yuklab bo‘lmadi.');
  return { order: { ...order, created_date: order.created_at }, items: items || [], branch };
}

export async function listUnreadNotifications() {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { data, error } = await client.from('notifications').select('id')
    .eq('user_id', userId).eq('read', false);
  fail(error, 'Bildirishnomalarni yuklab bo‘lmadi.');
  return data || [];
}

export async function markNotificationRead(notificationId) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { error } = await client.from('notifications').update({ read: true, read_at: new Date().toISOString() })
    .eq('id', String(notificationId)).eq('user_id', userId);
  fail(error, 'Bildirishnomani yangilab bo‘lmadi.');
}
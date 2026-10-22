import { requireSupabase } from '@/lib/supabase';

async function currentUserId(client) {
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) throw new Error('Bu amal uchun Supabase hisobiga kiring.');
  return data.user.id;
}

function fail(error, fallback) {
  if (error) {
    // Keep details in the developer console; show a useful, non-secret message to UI.
    console.error(fallback, error);
    throw new Error(error.message || fallback);
  }
}

/** Public catalogue: active businesses only (RLS is still enforced by Postgres). */
export async function listPublicBusinesses({ limit = 50, search = '' } = {}) {
  const client = requireSupabase();
  let query = client.from('businesses')
    .select('id,name,description,logo_url,category_id,category_name,store_id,is_active,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 50, 1), 100));
  if (search.trim()) query = query.or(`name.ilike.%${search.trim().replace(/[%_,]/g, ' ')}%,store_id.ilike.%${search.trim().replace(/[%_,]/g, ' ')}%`);
  const { data, error } = await query;
  fail(error, 'Do‘konlarni yuklab bo‘lmadi.');
  return data || [];
}

/** Businesses owned by the signed-in user. */
export async function listMyBusinesses() {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const { data, error } = await client.from('businesses')
    .select('*').eq('created_by_id', userId).order('created_at', { ascending: false });
  fail(error, 'Bizneslaringizni yuklab bo‘lmadi.');
  return data || [];
}

export async function createBusiness(input) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const name = String(input?.name || '').trim();
  const storeId = String(input?.store_id || '').trim().toUpperCase();
  if (!name || !storeId || !input?.category_id) throw new Error('Biznes nomi, Store ID va kategoriya majburiy.');
  const payload = {
    name,
    description: String(input.description || '').trim(),
    logo_url: input.logo_url || null,
    category_id: String(input.category_id),
    category_name: input.category_name || null,
    store_id: storeId,
    is_active: input.is_active !== false,
    low_stock_threshold: Number.isInteger(input.low_stock_threshold) ? input.low_stock_threshold : 5,
    created_by_id: userId,
  };
  const { data, error } = await client.from('businesses').insert(payload).select('*').single();
  fail(error, 'Biznes yaratilmadi. Store ID band bo‘lishi yoki ruxsat yetishmasligi mumkin.');
  return data;
}

export async function updateBusiness(businessId, patch) {
  const client = requireSupabase();
  if (!businessId) throw new Error('Biznes ID majburiy.');
  const allowed = ['name','description','logo_url','category_id','category_name','is_active','low_stock_threshold'];
  const payload = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(payload).length) throw new Error('O‘zgartirish uchun maydon topilmadi.');
  const { data, error } = await client.from('businesses').update(payload).eq('id', String(businessId)).select('*').single();
  fail(error, 'Biznesni yangilab bo‘lmadi.');
  return data;
}

export async function listBranches(businessId, { includeInactive = false } = {}) {
  const client = requireSupabase();
  if (!businessId) throw new Error('Biznes ID majburiy.');
  let query = client.from('branches').select('*').eq('business_id', String(businessId)).order('created_at', { ascending: true });
  if (!includeInactive) query = query.eq('is_active', true);
  const { data, error } = await query;
  fail(error, 'Filiallarni yuklab bo‘lmadi.');
  return data || [];
}

export async function createBranch(input) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  if (!input?.business_id || !String(input?.name || '').trim()) throw new Error('Biznes va filial nomi majburiy.');
  const payload = {
    business_id: String(input.business_id),
    name: String(input.name).trim(),
    geo_area_id: input.geo_area_id || null,
    country: input.country || 'Uzbekistan',
    region: input.region || null,
    city: input.city || null,
    district: input.district || null,
    address: input.address || null,
    latitude: input.latitude == null ? null : Number(input.latitude),
    longitude: input.longitude == null ? null : Number(input.longitude),
    phone: input.phone || null,
    working_hours: input.working_hours || null,
    is_active: input.is_active !== false,
    created_by_id: userId,
  };
  const { data, error } = await client.from('branches').insert(payload).select('*').single();
  fail(error, 'Filial yaratilmadi. Biznes egasi ekaningizni tekshiring.');
  return data;
}

export async function listProducts({ businessId, categoryId, search = '', includeInactive = false, limit = 100 } = {}) {
  const client = requireSupabase();
  let query = client.from('products').select('*').order('created_at', { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 200));
  if (businessId) query = query.eq('business_id', String(businessId));
  if (categoryId) query = query.eq('category_id', String(categoryId));
  if (!includeInactive) query = query.eq('is_active', true);
  const term = search.trim().replace(/[%_,]/g, ' ');
  if (term) query = query.ilike('name', `%${term}%`);
  const { data, error } = await query;
  fail(error, 'Mahsulotlarni yuklab bo‘lmadi.');
  return data || [];
}

export async function createProduct(input) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const name = String(input?.name || '').trim();
  const price = Number(input?.price);
  if (!input?.business_id || !name || !Number.isSafeInteger(price) || price < 0) {
    throw new Error('Biznes, mahsulot nomi va butun so‘mdagi narx to‘g‘ri kiritilishi kerak.');
  }
  const payload = {
    business_id: String(input.business_id),
    category_id: input.category_id || null,
    category_name: input.category_name || null,
    name,
    description: input.description || null,
    image_url: input.image_url || null,
    price,
    is_active: input.is_active !== false,
    created_by_id: userId,
  };
  const { data, error } = await client.from('products').insert(payload).select('*').single();
  fail(error, 'Mahsulot yaratilmadi. Biznes egasi ekaningizni tekshiring.');
  return data;
}

export async function updateProduct(productId, patch) {
  const client = requireSupabase();
  if (!productId) throw new Error('Mahsulot ID majburiy.');
  const allowed = ['category_id','category_name','name','description','image_url','price','is_active'];
  const payload = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
  if ('price' in payload && (!Number.isSafeInteger(Number(payload.price)) || Number(payload.price) < 0)) {
    throw new Error('Narx manfiy bo‘lmagan butun so‘m bo‘lishi kerak.');
  }
  if ('price' in payload) payload.price = Number(payload.price);
  const { data, error } = await client.from('products').update(payload).eq('id', String(productId)).select('*').single();
  fail(error, 'Mahsulotni yangilab bo‘lmadi.');
  return data;
}

export async function listBranchInventory(branchId) {
  const client = requireSupabase();
  if (!branchId) throw new Error('Filial ID majburiy.');
  const { data, error } = await client.from('branch_inventory')
    .select('*,products(id,name,description,image_url,price,is_active)')
    .eq('branch_id', String(branchId)).order('created_at', { ascending: true });
  fail(error, 'Ombor qoldig‘ini yuklab bo‘lmadi.');
  return data || [];
}

export async function upsertBranchInventory({ branchId, businessId, productId, stock, priceOverride = null, isAvailable = true }) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const stockNumber = Number(stock);
  const priceNumber = priceOverride == null || priceOverride === '' ? null : Number(priceOverride);
  if (!branchId || !businessId || !productId || !Number.isInteger(stockNumber) || stockNumber < 0) {
    throw new Error('Filial, biznes, mahsulot va 0 yoki undan katta butun qoldiq majburiy.');
  }
  if (priceNumber !== null && (!Number.isSafeInteger(priceNumber) || priceNumber < 0)) {
    throw new Error('Maxsus narx 0 yoki undan katta butun so‘m bo‘lishi kerak.');
  }
  const payload = {
    branch_id: String(branchId), business_id: String(businessId), product_id: String(productId),
    stock: stockNumber, price_override: priceNumber, is_available: Boolean(isAvailable),
    owner_id: userId, created_by_id: userId,
  };
  const { data, error } = await client.from('branch_inventory')
    .upsert(payload, { onConflict: 'branch_id,product_id' }).select('*').single();
  fail(error, 'Ombor qoldig‘ini saqlab bo‘lmadi. Biznes/filial egasini tekshiring.');
  return data;
}


/** Product categories for a single business. */
export async function listProductCategories(businessId) {
  const client = requireSupabase();
  if (!businessId) return [];
  const { data, error } = await client.from('product_categories')
    .select('*').eq('business_id', String(businessId)).order('name', { ascending: true });
  fail(error, 'Mahsulot kategoriyalarini yuklab bo‘lmadi.');
  return data || [];
}

/** Inventory rows for a business across all branches. */
export async function listBusinessInventory(businessId) {
  const client = requireSupabase();
  if (!businessId) return [];
  const { data, error } = await client.from('branch_inventory')
    .select('*').eq('business_id', String(businessId));
  fail(error, 'Ombor qoldig‘ini yuklab bo‘lmadi.');
  return data || [];
}

export async function getProduct(productId) {
  const client = requireSupabase();
  if (!productId) throw new Error('Mahsulot ID majburiy.');
  const { data, error } = await client.from('products').select('*').eq('id', String(productId)).maybeSingle();
  fail(error, 'Mahsulotni yuklab bo‘lmadi.');
  return data || null;
}


/** Generate a unique public Store ID without querying Base44. */
export async function generateUniqueStoreIdSupabase(name) {
  const client = requireSupabase();
  const prefix = String(name || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'STORE';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 8; attempt++) {
    let suffix = '';
    for (let i = 0; i < 4; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    const candidate = `${prefix}-${suffix}`;
    const { data, error } = await client.from('businesses').select('id').eq('store_id', candidate).limit(1);
    if (error) throw new Error('Store ID bandligini tekshirib bo‘lmadi: ' + error.message);
    if (!data?.length) return candidate;
  }
  throw new Error('Noyob Store ID yaratilmadi. Qayta urinib ko‘ring.');
}

export async function getBranch(branchId) {
  const client = requireSupabase();
  if (!branchId) throw new Error('Filial ID majburiy.');
  const { data, error } = await client.from('branches').select('*').eq('id', String(branchId)).maybeSingle();
  fail(error, 'Filialni yuklab bo‘lmadi.');
  return data || null;
}

export async function updateBranch(branchId, patch) {
  const client = requireSupabase();
  if (!branchId) throw new Error('Filial ID majburiy.');
  const allowed = ['name','geo_area_id','country','region','city','district','address','latitude','longitude','phone','working_hours','is_active'];
  const payload = Object.fromEntries(Object.entries(patch || {}).filter(([key]) => allowed.includes(key)));
  if (!Object.keys(payload).length) throw new Error('O‘zgartirish uchun maydon topilmadi.');
  const { data, error } = await client.from('branches').update(payload).eq('id', String(branchId)).select('*').single();
  fail(error, 'Filialni yangilab bo‘lmadi. Egasi ekaningizni tekshiring.');
  return data;
}

export async function upsertInventoryForBranch({ branchId, productId, stock, priceOverride = null, isAvailable = true }) {
  const client = requireSupabase();
  const branch = await getBranch(branchId);
  if (!branch) throw new Error('Filial topilmadi.');
  return upsertBranchInventory({
    branchId,
    businessId: branch.business_id,
    productId,
    stock,
    priceOverride,
    isAvailable,
  });
}


/** Public top-level categories for the buyer home screen. */
export async function listPublicCategories() {
  const client = requireSupabase();
  const { data, error } = await client.from('categories')
    .select('id,name,icon').order('name', { ascending: true }).limit(100);
  fail(error, 'Kategoriyalarni yuklab bo‘lmadi.');
  return data || [];
}

/** Public branch catalogue matching the shape used by the existing buyer UI. */
export async function getBranchCatalogSupabase(branchId) {
  const client = requireSupabase();
  if (!branchId) throw new Error('Filial ID majburiy.');
  const { data: branch, error: branchError } = await client.from('branches')
    .select('*').eq('id', String(branchId)).eq('is_active', true).maybeSingle();
  fail(branchError, 'Filialni yuklab bo‘lmadi.');
  if (!branch) throw new Error('Faol filial topilmadi.');
  const { data: business, error: businessError } = await client.from('businesses')
    .select('*').eq('id', branch.business_id).eq('is_active', true).maybeSingle();
  fail(businessError, 'Do‘konni yuklab bo‘lmadi.');
  if (!business) throw new Error('Do‘kon faol emas.');
  const [{ data: products, error: productsError }, { data: inventory, error: inventoryError }] = await Promise.all([
    client.from('products').select('*').eq('business_id', business.id).eq('is_active', true).order('name', { ascending: true }).limit(300),
    client.from('branch_inventory').select('*').eq('branch_id', branch.id).limit(500),
  ]);
  fail(productsError, 'Mahsulotlarni yuklab bo‘lmadi.');
  fail(inventoryError, 'Ombor qoldig‘ini yuklab bo‘lmadi.');
  const invByProduct = new Map((inventory || []).map((row) => [row.product_id, row]));
  const items = (products || []).map((product) => {
    const inv = invByProduct.get(product.id);
    const hasInventory = Boolean(inv);
    const available = Boolean(inv && inv.is_available && Number(inv.stock) > 0);
    return {
      product_id: product.id,
      id: product.id,
      name: product.name,
      description: product.description,
      image_url: product.image_url,
      category_id: product.category_id,
      category_name: product.category_name,
      price: Number(product.price),
      effective_price: Number(inv?.price_override ?? product.price),
      stock: Number(inv?.stock ?? 0),
      available,
      disabled: !available,
      has_inventory: hasInventory,
      business_id: business.id,
      business_name: business.name,
    };
  });
  return { branch, business, items };
}

/** Public business lookup by its shareable Store ID. */
export async function getPublicBusinessByStoreId(storeId) {
  const client = requireSupabase();
  const { data, error } = await client.from('businesses').select('*')
    .eq('store_id', String(storeId || '').trim().toUpperCase()).eq('is_active', true).maybeSingle();
  fail(error, 'Do‘konni yuklab bo‘lmadi.');
  return data || null;
}

export async function getPublicBusinessById(businessId) {
  const client = requireSupabase();
  const { data, error } = await client.from('businesses').select('*')
    .eq('id', String(businessId)).eq('is_active', true).maybeSingle();
  fail(error, 'Do‘konni yuklab bo‘lmadi.');
  return data || null;
}

/** Search public stores and products. Result shape is compatible with Search cards. */
export async function searchPublicCatalog(query, { limit = 30 } = {}) {
  const term = String(query || '').trim().replace(/[%_,]/g, ' ');
  if (!term) return { businesses: [], products: [] };
  const client = requireSupabase();
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 60);
  const [{ data: businesses, error: businessError }, { data: products, error: productError }] = await Promise.all([
    client.from('businesses').select('id,name,description,logo_url,category_id,category_name,store_id,is_active')
      .eq('is_active', true).or(`name.ilike.%${term}%,store_id.ilike.%${term}%`).limit(safeLimit),
    client.from('products').select('id,business_id,name,description,image_url,price,category_name,is_active')
      .eq('is_active', true).ilike('name', `%${term}%`).limit(safeLimit),
  ]);
  fail(businessError, 'Do‘konlarni qidirib bo‘lmadi.');
  fail(productError, 'Mahsulotlarni qidirib bo‘lmadi.');
  const bizRows = businesses || [];
  const bizMap = new Map(bizRows.map((b) => [b.id, b]));
  const productBusinessIds = [...new Set((products || []).map((p) => p.business_id))];
  const missingIds = productBusinessIds.filter((id) => !bizMap.has(id));
  if (missingIds.length) {
    const { data: extra, error: extraError } = await client.from('businesses')
      .select('id,name,description,logo_url,category_id,category_name,store_id,is_active')
      .in('id', missingIds).eq('is_active', true);
    fail(extraError, 'Mahsulot do‘konlarini yuklab bo‘lmadi.');
    for (const b of (extra || [])) bizMap.set(b.id, b);
  }
  const visibleProducts = (products || []).filter((p) => bizMap.has(p.business_id)).map((p) => ({
    ...p, product_id: p.id, business_name: bizMap.get(p.business_id)?.name || '', price: Number(p.price),
  }));
  return { businesses: bizRows, products: visibleProducts };
}

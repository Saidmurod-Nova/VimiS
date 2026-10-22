import { requireSupabase } from '@/lib/supabase';

function normalizeQuantity(value, label = 'Miqdor') {
  const number = Number(value);
  if (!Number.isInteger(number) || number <= 0) {
    throw new Error(`${label} musbat butun son bo'lishi kerak.`);
  }
  return number;
}

async function currentUserId(client = requireSupabase()) {
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) {
    throw new Error('Savatni boshqarish uchun Supabase hisobiga kiring.');
  }
  return user.id;
}

export async function getCart() {
  const client = requireSupabase();
  const userId = await currentUserId(client);

  const { data: cart, error: cartError } = await client
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  console.log("getCart result:", { cart, cartError });
  if (cartError) throw new Error(cartError.message || 'Savat yuklanmadi.');
  if (!cart) {
    return { cart: null, items: [], business: null, branch: null, subtotal: 0, total_items: 0 };
  }

  const [{ data: itemsData, error: itemsError }, { data: businessData, error: businessError }, { data: branchData, error: branchError }] = await Promise.all([
    client.from('cart_items').select('id, product_id, quantity, created_at, products(name,image_url,price,category_name)').eq('cart_id', cart.id).order('created_at', { ascending: true }),
    client.from('businesses').select('id,name,logo_url,store_id').eq('id', cart.business_id).maybeSingle(),
    client.from('branches').select('id,name,city,region,address').eq('id', cart.branch_id).maybeSingle(),
  ]);

  if (itemsError) throw new Error(itemsError.message || 'Savat mahsulotlari yuklanmadi.');
  if (businessError) throw new Error(businessError.message || 'Do‘kon ma’lumotlari yuklanmadi.');
  if (branchError) throw new Error(branchError.message || 'Filial ma’lumotlari yuklanmadi.');

  const productIds = (itemsData || []).map((row) => row.product_id);
  let inventoryByProduct = new Map();
  if (productIds.length > 0) {
    const { data: inventoryData, error: inventoryError } = await client
      .from('branch_inventory')
      .select('product_id,stock,price_override,is_available')
      .eq('branch_id', cart.branch_id)
      .in('product_id', productIds);

    if (inventoryError) throw new Error(inventoryError.message || 'Ombor ma’lumotlari yuklanmadi.');
    inventoryByProduct = new Map((inventoryData || []).map((row) => [row.product_id, row]));
  }

  const mappedItems = (itemsData || []).map((row) => {
    const product = row.products || {};
    const inventory = inventoryByProduct.get(row.product_id) || {};
    const unitPrice = Number(inventory.price_override ?? product.price ?? 0);
    const quantity = Number(row.quantity || 0);
    const subtotal = unitPrice * quantity;
    return {
      cart_item_id: row.id,
      cart_id: cart.id,
      product_id: row.product_id,
      name: product.name || 'Mahsulot',
      image_url: product.image_url || '',
      quantity,
      unit_price: unitPrice,
      subtotal,
      stock: Number(inventory.stock ?? 0),
      available: Boolean(inventory.is_available && Number(inventory.stock || 0) > 0),
      category_name: product.category_name || null,
    };
  });

  const subtotal = mappedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItems = mappedItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    items: mappedItems,
    business: businessData || null,
    branch: branchData || null,
    subtotal,
    total_items: totalItems,
  };
}

export async function getOrCreateActiveCart({ businessId, branchId }) {
  const client = requireSupabase();
  const userId = await currentUserId(client);

  if (!businessId || !branchId) {
    throw new Error('Do‘kon va filial tanlanishi kerak.');
  }

  const { data: existingCart, error: cartError } = await client
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (cartError) throw new Error(cartError.message || 'Savat holati tekshirilmoqda.');
  if (!existingCart) {
    const { data: createdCart, error: createError } = await client
      .from('carts')
      .insert({
        user_id: userId,
        business_id: String(businessId),
        branch_id: String(branchId),
        status: 'active',
        created_by_id: userId,
      })
      .select('*')
      .single();

    if (createError) throw new Error(createError.message || 'Savat yaratilmadi.');
    return { cart: createdCart, created: true, conflict: false };
  }

  if (existingCart.business_id === String(businessId) && existingCart.branch_id === String(branchId)) {
    return { cart: existingCart, created: false, conflict: false };
  }

  const [{ data: business }, { data: branch }] = await Promise.all([
    client.from('businesses').select('id,name').eq('id', existingCart.business_id).maybeSingle(),
    client.from('branches').select('id,name').eq('id', existingCart.branch_id).maybeSingle(),
  ]);

  return {
    cart: existingCart,
    created: false,
    conflict: true,
    current_cart: {
      id: existingCart.id,
      business_id: existingCart.business_id,
      business_name: business?.name || 'Do‘kon',
      branch_id: existingCart.branch_id,
      branch_name: branch?.name || 'Filial',
    },
  };
}

export async function addToCart({ product_id, branch_id, quantity = 1, forceNew = false }) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const productId = String(product_id || '').trim();
  const branchId = String(branch_id || '').trim();
  const qty = normalizeQuantity(quantity, 'Miqdor');

  if (!productId || !branchId) {
    throw new Error('Mahsulot va filial tanlanishi kerak.');
  }

  const { data: product, error: productError } = await client
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('is_active', true)
    .maybeSingle();

  if (productError) throw new Error(productError.message || 'Mahsulot tekshirilmoqda.');
  if (!product) throw new Error('Mahsulot topilmadi yoki faol emas.');

  const { data: branch, error: branchError } = await client
    .from('branches')
    .select('*')
    .eq('id', branchId)
    .eq('business_id', product.business_id)
    .eq('is_active', true)
    .maybeSingle();

  if (branchError) throw new Error(branchError.message || 'Filial tekshirilmoqda.');
  if (!branch) throw new Error('Bu mahsulot ushbu filialda mavjud emas.');

  const { data: inventory, error: inventoryError } = await client
    .from('branch_inventory')
    .select('*')
    .eq('branch_id', branchId)
    .eq('product_id', productId)
    .maybeSingle();

  if (inventoryError) throw new Error(inventoryError.message || 'Ombor qoldig‘i tekshirilmoqda.');
  if (!inventory || inventory.is_available !== true) {
    throw new Error('Mahsulot ushbu filialda hozir mavjud emas.');
  }
  if (Number(inventory.stock || 0) < qty) {
    throw new Error(`Yetarli qoldiq yo‘q. Mavjud: ${inventory.stock}.`);
  }

  const activeCart = await getOrCreateActiveCart({ businessId: product.business_id, branchId });
  if (activeCart.conflict && !forceNew) {
    return { conflict: true, current_cart: activeCart.current_cart, quantity: 0 };
  }

  if (activeCart.conflict && forceNew) {
    const { data: currentCart, error: cartError } = await client
      .from('carts')
      .update({ business_id: product.business_id, branch_id: branchId, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', activeCart.cart.id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (cartError) throw new Error(cartError.message || 'Savatni almashtirib bo‘lmadi.');
    await client.from('cart_items').delete().eq('cart_id', currentCart.id);
    activeCart.cart = currentCart;
  }

  const { data: existingItem, error: itemLookupError } = await client
    .from('cart_items')
    .select('*')
    .eq('cart_id', activeCart.cart.id)
    .eq('product_id', productId)
    .maybeSingle();

  if (itemLookupError) throw new Error(itemLookupError.message || 'Savat mahsuloti tekshirilmoqda.');

  if (existingItem) {
    const nextQty = Number(existingItem.quantity || 0) + qty;
    if (nextQty > Number(inventory.stock || 0)) {
      throw new Error(`Sizning tanlovingiz ombordagi qoldiqdan oshib ketdi. Mavjud: ${inventory.stock}.`);
    }

    const { data: updated, error: updateError } = await client
      .from('cart_items')
      .update({ quantity: nextQty })
      .eq('id', existingItem.id)
      .select('id, product_id, quantity')
      .single();

    if (updateError) throw new Error(updateError.message || 'Mahsulot miqdori yangilanmadi.');
    return { ok: true, quantity: Number(updated.quantity || 0), conflict: false };
  }

  const { data: inserted, error: insertError } = await client
    .from('cart_items')
    .insert({
      cart_id: activeCart.cart.id,
      product_id: productId,
      quantity: qty,
      created_by_id: userId,
    })
    .select('id, product_id, quantity')
    .single();

  if (insertError) {
    throw new Error(insertError.message || 'Mahsulot savatga qo‘shilmadi.');
  }

  return { ok: true, quantity: Number(inserted.quantity || 0), conflict: false };
}

export async function updateCartItemQuantity(cartItemId, quantity) {
  const client = requireSupabase();
  const userId = await currentUserId(client);
  const nextQty = normalizeQuantity(quantity, 'Miqdor');

  const { data: item, error: lookupError } = await client
    .from('cart_items')
    .select('id, cart_id, product_id, quantity, carts!inner(user_id, branch_id, status)')
    .eq('id', String(cartItemId))
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message || 'Savat mahsuloti topilmadi.');
  if (!item || !item.carts || item.carts.user_id !== userId || item.carts.status !== 'active') {
    throw new Error('Ushbu mahsulot o‘z savatingizga tegishli emas.');
  }

  const { data: inventory, error: inventoryError } = await client
    .from('branch_inventory')
    .select('stock, is_available')
    .eq('branch_id', item.carts.branch_id)
    .eq('product_id', item.product_id)
    .maybeSingle();

  if (inventoryError) throw new Error(inventoryError.message || 'Qoldiq tekshirilmoqda.');
  if (!inventory || inventory.is_available !== true) {
    throw new Error('Mahsulot hozirda mavjud emas.');
  }
  if (Number(inventory.stock || 0) < nextQty) {
    throw new Error(`Tanlangan miqdor qoldiqdan oshdi. Mavjud: ${inventory.stock}.`);
  }

  const { data: updated, error: updateError } = await client
    .from('cart_items')
    .update({ quantity: nextQty })
    .eq('id', item.id)
    .select('id, quantity')
    .single();

  if (updateError) throw new Error(updateError.message || 'Miqdor yangilanmadi.');
  return updated;
}

export async function removeCartItem(cartItemId) {
  const client = requireSupabase();
  const userId = await currentUserId(client);

  const { data: item, error: itemError } = await client
    .from('cart_items')
    .select('id, cart_id, carts!inner(user_id, status)')
    .eq('id', String(cartItemId))
    .maybeSingle();

  if (itemError) throw new Error(itemError.message || 'Mahsulot o‘chirilmadi.');
  if (!item || !item.carts || item.carts.user_id !== userId || item.carts.status !== 'active') {
    throw new Error('Ushbu mahsulot sizning savatingizga tegishli emas.');
  }

  const { error: deleteError } = await client.from('cart_items').delete().eq('id', item.id);
  if (deleteError) throw new Error(deleteError.message || 'Mahsulot o‘chirilmadi.');
}

export async function clearCart() {
  const client = requireSupabase();
  const userId = await currentUserId(client);

  const { data: cart, error: cartError } = await client
    .from('carts')
    .select('id,user_id,status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  if (cartError) throw new Error(cartError.message || 'Savat tozalanmadi.');
  if (!cart) return;

  const { error: deleteError } = await client.from('cart_items').delete().eq('cart_id', cart.id);
  if (deleteError) throw new Error(deleteError.message || 'Savat mahsulotlari o‘chirilmadi.');
}

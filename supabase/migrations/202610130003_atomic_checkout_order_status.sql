-- Vimi stage 3: atomic checkout and safe order status transitions.
-- Run only AFTER 202610130002_vimi_schema.sql.
-- Client calls these RPCs with the signed-in Supabase session; never expose service_role.

create or replace function public.vimi_checkout(
  p_cart_id text,
  p_address_id text,
  p_payment_method text default 'cash_on_delivery',
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid text := auth.uid()::text;
  v_cart public.carts%rowtype;
  v_business public.businesses%rowtype;
  v_branch public.branches%rowtype;
  v_address public.addresses%rowtype;
  v_profile public.profiles%rowtype;
  v_ci record;
  v_product public.products%rowtype;
  v_inventory public.branch_inventory%rowtype;
  v_items jsonb := '[]'::jsonb;
  v_item jsonb;
  v_subtotal bigint := 0;
  v_total bigint := 0;
  v_item_count integer := 0;
  v_unit_price bigint;
  v_line_total bigint;
  v_order_id text;
  v_order_number text;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Login talab qilinadi';
  end if;
  if p_cart_id is null or p_address_id is null then
    raise exception using errcode = '22023', message = 'Savat va manzil majburiy';
  end if;

  select * into v_cart from public.carts
   where id = p_cart_id and user_id = v_uid and status = 'active'
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Faol savat topilmadi';
  end if;

  select * into v_business from public.businesses
   where id = v_cart.business_id and is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'Do‘kon faol emas';
  end if;

  select * into v_branch from public.branches
   where id = v_cart.branch_id and business_id = v_cart.business_id and is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'Filial faol emas';
  end if;

  select * into v_address from public.addresses
   where id = p_address_id and user_id = v_uid;
  if not found then
    raise exception using errcode = 'P0002', message = 'Manzil topilmadi';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();

  if not exists (select 1 from public.cart_items where cart_id = v_cart.id) then
    raise exception using errcode = '22023', message = 'Savat bo‘sh';
  end if;

  -- Lock inventory rows and validate current product/price/stock before writing any order.
  for v_ci in
    select ci.id, ci.product_id, ci.quantity
      from public.cart_items ci
     where ci.cart_id = v_cart.id
     order by ci.product_id
  loop
    select * into v_product from public.products
     where id = v_ci.product_id
       and business_id = v_cart.business_id
       and is_active = true;
    if not found then
      raise exception using errcode = '22023', message = 'Savatdagi mahsulot mavjud emas';
    end if;

    select * into v_inventory from public.branch_inventory
     where branch_id = v_cart.branch_id and product_id = v_product.id
     for update;
    if not found or v_inventory.is_available is distinct from true then
      raise exception using errcode = '22023', message = 'Mahsulot ushbu filialda mavjud emas';
    end if;
    if v_inventory.stock < v_ci.quantity then
      raise exception using errcode = '22023', message = 'Mahsulot qoldig‘i yetarli emas: ' || v_product.name;
    end if;

    v_unit_price := coalesce(v_inventory.price_override, v_product.price);
    v_line_total := v_unit_price * v_ci.quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_item_count := v_item_count + v_ci.quantity;
    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'unit_price', v_unit_price,
      'quantity', v_ci.quantity,
      'subtotal', v_line_total,
      'image_url', v_product.image_url
    ));
  end loop;

  v_total := v_subtotal; -- Delivery fee is currently zero in Vimi MVP.
  v_order_number := 'VIM-' || to_char(now() at time zone 'UTC', 'YYYYMMDD') || '-' ||
                    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into public.orders (
    order_number, user_id, business_id, branch_id, business_name, branch_name,
    status, delivery_address, delivery_latitude, delivery_longitude,
    buyer_name_snapshot, buyer_phone_snapshot, payment_method,
    subtotal, delivery_fee, total, item_count, notes, created_by_id
  ) values (
    v_order_number, v_uid, v_cart.business_id, v_cart.branch_id, v_business.name, v_branch.name,
    'pending', v_address.address, v_address.latitude, v_address.longitude,
    coalesce(v_profile.full_name, ''), coalesce(v_profile.phone, ''),
    coalesce(nullif(p_payment_method, ''), 'cash_on_delivery'),
    v_subtotal, 0, v_total, v_item_count, coalesce(p_notes, ''), v_uid
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_items)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, unit_price, quantity, subtotal, image_url, created_by_id
    ) values (
      v_order_id, v_item->>'product_id', v_item->>'product_name',
      (v_item->>'unit_price')::bigint, (v_item->>'quantity')::integer,
      (v_item->>'subtotal')::bigint, nullif(v_item->>'image_url', 'null'), v_uid
    );
    update public.branch_inventory
       set stock = stock - (v_item->>'quantity')::integer
     where branch_id = v_cart.branch_id and product_id = v_item->>'product_id';
  end loop;

  delete from public.cart_items where cart_id = v_cart.id;
  update public.carts set status = 'checked_out' where id = v_cart.id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'status', 'pending',
    'subtotal', v_subtotal,
    'delivery_fee', 0,
    'total', v_total,
    'item_count', v_item_count
  );
end;
$$;

revoke all on function public.vimi_checkout(text, text, text, text) from public, anon;
grant execute on function public.vimi_checkout(text, text, text, text) to authenticated;


create or replace function public.vimi_update_order_status(
  p_order_id text,
  p_new_status text,
  p_cancellation_reason text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid text := auth.uid()::text;
  v_order public.orders%rowtype;
  v_item record;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Login talab qilinadi';
  end if;
  if p_new_status not in ('accepted','preparing','completed','cancelled') then
    raise exception using errcode = '22023', message = 'Buyurtma holati noto‘g‘ri';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Buyurtma topilmadi';
  end if;

  -- Seller may update only an order for their own business; buyer may only cancel pending orders.
  if public.vimi_owns_business(v_order.business_id) then
    if not (
      (v_order.status = 'pending' and p_new_status in ('accepted','cancelled')) or
      (v_order.status = 'accepted' and p_new_status in ('preparing','cancelled')) or
      (v_order.status = 'preparing' and p_new_status = 'completed')
    ) then
      raise exception using errcode = '22023', message = 'Bu holat o‘zgarishiga ruxsat yo‘q';
    end if;
  elsif v_order.user_id = v_uid then
    if not (v_order.status = 'pending' and p_new_status = 'cancelled') then
      raise exception using errcode = '42501', message = 'Xaridor faqat kutilayotgan buyurtmani bekor qilishi mumkin';
    end if;
  else
    raise exception using errcode = '42501', message = 'Bu buyurtmani boshqarishga ruxsat yo‘q';
  end if;

  if p_new_status = 'cancelled' then
    -- Restore stock exactly once, in the same transaction as the status change.
    for v_item in select product_id, quantity from public.order_items where order_id = v_order.id and product_id is not null
    loop
      update public.branch_inventory
         set stock = stock + v_item.quantity
       where branch_id = v_order.branch_id and product_id = v_item.product_id;
    end loop;
  end if;

  update public.orders set
    status = p_new_status,
    cancellation_reason = case when p_new_status = 'cancelled' then coalesce(p_cancellation_reason, '') else cancellation_reason end,
    accepted_at = case when p_new_status = 'accepted' then v_now else accepted_at end,
    preparing_at = case when p_new_status = 'preparing' then v_now else preparing_at end,
    completed_at = case when p_new_status = 'completed' then v_now else completed_at end,
    cancelled_at = case when p_new_status = 'cancelled' then v_now else cancelled_at end
  where id = v_order.id;

  return jsonb_build_object('ok', true, 'order_id', v_order.id, 'status', p_new_status);
end;
$$;

revoke all on function public.vimi_update_order_status(text, text, text) from public, anon;
grant execute on function public.vimi_update_order_status(text, text, text) to authenticated;

create or replace function public.vimi_telegram_miniapp_add_to_cart(
  p_telegram_user_id bigint,
  p_product_id text,
  p_branch_id text,
  p_quantity integer,
  p_force_new boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
  v_product public.products%rowtype;
  v_branch public.branches%rowtype;
  v_inventory public.branch_inventory%rowtype;
  v_cart public.carts%rowtype;
  v_cart_item public.cart_items%rowtype;
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0
     or p_product_id is null or p_branch_id is null
     or p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception using errcode = '22023', message = 'Invalid Telegram Mini App cart item';
  end if;

  select l.user_id::text into v_user_id
    from public.telegram_account_links l
   where l.bot_type = 'buyer'
     and l.telegram_user_id = p_telegram_user_id;
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Linked Telegram buyer account required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));

  select p.* into v_product
    from public.products p
   where p.id = p_product_id
     and p.is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'Product not found or inactive';
  end if;
  if not exists (
    select 1 from public.businesses b
     where b.id = v_product.business_id and b.is_active = true
  ) then
    raise exception using errcode = 'P0002', message = 'Product business is inactive';
  end if;

  select b.* into v_branch
    from public.branches b
   where b.id = p_branch_id
     and b.business_id = v_product.business_id
     and b.is_active = true;
  if not found then
    raise exception using errcode = 'P0002', message = 'Branch is unavailable for this product';
  end if;

  select c.* into v_cart
    from public.carts c
   where c.user_id = v_user_id
     and c.status = 'active'
   for update;

  if not found then
    insert into public.carts (user_id, business_id, branch_id, status, created_by_id)
    values (v_user_id, v_product.business_id, v_branch.id, 'active', v_user_id)
    returning * into v_cart;
  elsif v_cart.business_id <> v_product.business_id or v_cart.branch_id <> v_branch.id then
    if p_force_new is distinct from true then
      return jsonb_build_object(
        'conflict', true,
        'current_cart', jsonb_build_object(
          'business_id', v_cart.business_id,
          'branch_id', v_cart.branch_id
        )
      );
    end if;
    delete from public.cart_items where cart_id = v_cart.id;
    update public.carts
       set business_id = v_product.business_id,
           branch_id = v_branch.id,
           updated_at = now()
     where id = v_cart.id
    returning * into v_cart;
  end if;

  select i.* into v_inventory
    from public.branch_inventory i
   where i.branch_id = v_branch.id
     and i.product_id = v_product.id
   for update;
  if not found or v_inventory.is_available is distinct from true then
    raise exception using errcode = '22023', message = 'Product is unavailable at this branch';
  end if;

  select ci.* into v_cart_item
    from public.cart_items ci
   where ci.cart_id = v_cart.id
     and ci.product_id = v_product.id
   for update;
  if v_inventory.stock < coalesce(v_cart_item.quantity, 0) + p_quantity then
    raise exception using errcode = '22023', message = 'Insufficient product stock';
  end if;

  insert into public.cart_items (cart_id, product_id, quantity, created_by_id)
  values (v_cart.id, v_product.id, p_quantity, v_user_id)
  on conflict (cart_id, product_id) do update
    set quantity = public.cart_items.quantity + excluded.quantity,
        updated_at = now()
  returning * into v_cart_item;

  return jsonb_build_object(
    'ok', true,
    'cart_id', v_cart.id,
    'cart_item_id', v_cart_item.id,
    'quantity', v_cart_item.quantity
  );
end;
$$;

create or replace function public.vimi_telegram_miniapp_cart_action(
  p_telegram_user_id bigint,
  p_action text,
  p_cart_item_id text default null,
  p_quantity integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
  v_cart public.carts%rowtype;
  v_item public.cart_items%rowtype;
  v_inventory public.branch_inventory%rowtype;
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0
     or p_action not in ('update', 'remove', 'clear') then
    raise exception using errcode = '22023', message = 'Invalid Telegram Mini App cart action';
  end if;

  select l.user_id::text into v_user_id
    from public.telegram_account_links l
   where l.bot_type = 'buyer'
     and l.telegram_user_id = p_telegram_user_id;
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Linked Telegram buyer account required';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user_id, 0));
  select c.* into v_cart
    from public.carts c
   where c.user_id = v_user_id
     and c.status = 'active'
   for update;
  if not found then
    return jsonb_build_object('ok', true, 'empty', true);
  end if;

  if p_action = 'clear' then
    delete from public.cart_items where cart_id = v_cart.id;
    return jsonb_build_object('ok', true);
  end if;

  if p_cart_item_id is null then
    raise exception using errcode = '22023', message = 'Cart item is required';
  end if;
  select ci.* into v_item
    from public.cart_items ci
   where ci.id = p_cart_item_id
     and ci.cart_id = v_cart.id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Cart item not found';
  end if;

  if p_action = 'remove' then
    delete from public.cart_items where id = v_item.id;
    return jsonb_build_object('ok', true);
  end if;

  if p_quantity is null or p_quantity < 1 or p_quantity > 99 then
    raise exception using errcode = '22023', message = 'Invalid cart quantity';
  end if;
  select i.* into v_inventory
    from public.branch_inventory i
   where i.branch_id = v_cart.branch_id
     and i.product_id = v_item.product_id
   for update;
  if not found or v_inventory.is_available is distinct from true or v_inventory.stock < p_quantity then
    raise exception using errcode = '22023', message = 'Insufficient product stock';
  end if;

  update public.cart_items
     set quantity = p_quantity,
         updated_at = now()
   where id = v_item.id;
  return jsonb_build_object('ok', true, 'quantity', p_quantity);
end;
$$;

create or replace function public.vimi_telegram_miniapp_checkout(
  p_telegram_user_id bigint,
  p_cart_id text,
  p_address_id text,
  p_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0 then
    raise exception using errcode = '22023', message = 'Invalid Telegram buyer identity';
  end if;

  select l.user_id::text into v_user_id
    from public.telegram_account_links l
   where l.bot_type = 'buyer'
     and l.telegram_user_id = p_telegram_user_id;
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Linked Telegram buyer account required';
  end if;

  perform set_config('request.jwt.claim.sub', v_user_id, true);
  return public.vimi_checkout(p_cart_id, p_address_id, 'cash_on_delivery', p_notes);
end;
$$;

revoke all on function public.vimi_telegram_miniapp_add_to_cart(bigint, text, text, integer, boolean)
  from public, anon, authenticated;
revoke all on function public.vimi_telegram_miniapp_cart_action(bigint, text, text, integer)
  from public, anon, authenticated;
revoke all on function public.vimi_telegram_miniapp_checkout(bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.vimi_telegram_miniapp_add_to_cart(bigint, text, text, integer, boolean)
  to service_role;
grant execute on function public.vimi_telegram_miniapp_cart_action(bigint, text, text, integer)
  to service_role;
grant execute on function public.vimi_telegram_miniapp_checkout(bigint, text, text, text)
  to service_role;

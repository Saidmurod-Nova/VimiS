-- Vimi Supabase schema migration (prepared from Base44 entity definitions).
-- Review before applying to a production project. This creates empty tables; it does NOT import Base44 records.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar text,
  role text not null default 'user' check (role in ('admin','user')),
  selected_location jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.vimi_handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, avatar)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', '')
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_vimi on auth.users;
create trigger on_auth_user_created_vimi after insert on auth.users
for each row execute procedure public.vimi_handle_new_user();

create or replace function public.vimi_touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute procedure public.vimi_touch_updated_at();

-- Base44 entity IDs are strings, so these tables use text IDs during migration.
create table if not exists public.geo_areas (
  id text primary key default gen_random_uuid()::text,
  parent_id text references public.geo_areas(id) on delete set null,
  type text not null check (type in ('country','region','district','city')),
  name text not null,
  code text,
  created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null, icon text,
  created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.businesses (
  id text primary key default gen_random_uuid()::text,
  name text not null, description text, logo_url text,
  category_id text references public.categories(id) on delete set null,
  category_name text, store_id text not null unique,
  is_active boolean not null default true,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_by_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.branches (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  owner_id text,
  name text not null, geo_area_id text references public.geo_areas(id) on delete set null,
  country text, region text, city text, district text, address text,
  latitude double precision, longitude double precision, phone text, working_hours text,
  is_active boolean not null default true, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_categories (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  name text not null, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  business_id text not null references public.businesses(id) on delete cascade,
  category_id text references public.product_categories(id) on delete set null,
  category_name text, name text not null, description text, image_url text,
  price bigint not null check (price >= 0), is_active boolean not null default true,
  created_by_id text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.branch_inventory (
  id text primary key default gen_random_uuid()::text,
  branch_id text not null references public.branches(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  business_id text not null references public.businesses(id) on delete cascade,
  owner_id text, stock integer not null default 0 check (stock >= 0),
  price_override bigint check (price_override is null or price_override >= 0),
  is_available boolean not null default true, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (branch_id, product_id)
);
create table if not exists public.addresses (
  id text primary key default gen_random_uuid()::text,
  user_id text not null, title text, address text not null,
  latitude double precision, longitude double precision, is_default boolean not null default false,
  created_by_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.carts (
  id text primary key default gen_random_uuid()::text,
  user_id text not null, business_id text not null references public.businesses(id) on delete cascade,
  branch_id text not null references public.branches(id) on delete cascade,
  status text not null default 'active' check (status in ('active','checked_out')),
  created_by_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.cart_items (
  id text primary key default gen_random_uuid()::text,
  cart_id text not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_by_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (cart_id, product_id)
);
create table if not exists public.orders (
  id text primary key default gen_random_uuid()::text,
  order_number text not null unique, user_id text not null,
  business_id text not null references public.businesses(id), branch_id text not null references public.branches(id),
  business_name text, branch_name text,
  status text not null default 'pending' check (status in ('pending','accepted','preparing','completed','cancelled')),
  delivery_address text, delivery_latitude double precision, delivery_longitude double precision,
  buyer_name_snapshot text, buyer_phone_snapshot text, payment_method text,
  subtotal bigint not null default 0 check (subtotal >= 0), delivery_fee bigint not null default 0 check (delivery_fee >= 0),
  total bigint not null check (total >= 0), item_count integer not null default 0 check (item_count >= 0),
  notes text, cancellation_reason text, accepted_at timestamptz, preparing_at timestamptz,
  completed_at timestamptz, cancelled_at timestamptz, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
  id text primary key default gen_random_uuid()::text,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text, product_name text not null, unit_price bigint not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0), subtotal bigint not null check (subtotal >= 0), image_url text,
  created_by_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.favorite_stores (
  id text primary key default gen_random_uuid()::text,
  user_id text not null, business_id text not null references public.businesses(id) on delete cascade,
  created_by_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id,business_id)
);
create table if not exists public.saved_stores (
  id text primary key default gen_random_uuid()::text,
  user_id text not null, business_id text not null references public.businesses(id) on delete cascade,
  last_visited_at timestamptz, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique (user_id,business_id)
);
create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_id text not null, title text not null, body text, type text, related_id text, event_key text,
  read boolean not null default false, read_at timestamptz, created_by_id text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create index if not exists branches_business_id_idx on public.branches(business_id);
create index if not exists products_business_id_active_idx on public.products(business_id,is_active);
create index if not exists inventory_branch_product_idx on public.branch_inventory(branch_id,product_id);
create index if not exists carts_user_status_idx on public.carts(user_id,status);
create index if not exists cart_items_cart_idx on public.cart_items(cart_id);
create index if not exists orders_user_created_idx on public.orders(user_id,created_at desc);
create index if not exists orders_business_status_idx on public.orders(business_id,status,created_at desc);
create index if not exists order_items_order_idx on public.order_items(order_id);
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index if not exists geo_areas_parent_idx on public.geo_areas(parent_id);

-- Ownership helpers used by RLS. They only answer whether the current user owns a business/branch.
create or replace function public.vimi_owns_business(target_business_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.businesses b where b.id = target_business_id and b.created_by_id = auth.uid()::text);
$$;
create or replace function public.vimi_owns_branch(target_branch_id text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.branches br join public.businesses b on b.id = br.business_id where br.id = target_branch_id and b.created_by_id = auth.uid()::text);
$$;
revoke all on function public.vimi_owns_business(text) from public;
revoke all on function public.vimi_owns_branch(text) from public;
grant execute on function public.vimi_owns_business(text) to anon, authenticated;
grant execute on function public.vimi_owns_branch(text) to anon, authenticated;

-- Enable RLS on every application table.
do $$ declare t text; begin
  foreach t in array array['profiles','geo_areas','categories','businesses','branches','product_categories','products','branch_inventory','addresses','carts','cart_items','orders','order_items','favorite_stores','saved_stores','notifications'] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Profiles: users can read their own profile and update only non-privileged fields.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated;
grant update (full_name, phone, avatar, selected_location) on public.profiles to authenticated;

-- Public catalogue reads; business data writes are restricted to the owning user.
drop policy if exists "geo_areas_read_all" on public.geo_areas;
create policy "geo_areas_read_all" on public.geo_areas for select to anon, authenticated using (true);
drop policy if exists "categories_read_all" on public.categories;
create policy "categories_read_all" on public.categories for select to anon, authenticated using (true);
drop policy if exists "businesses_read_active_or_owner" on public.businesses;
create policy "businesses_read_active_or_owner" on public.businesses for select to anon, authenticated using (is_active = true or created_by_id = auth.uid()::text);
drop policy if exists "businesses_insert_owner" on public.businesses;
create policy "businesses_insert_owner" on public.businesses for insert to authenticated with check (created_by_id = auth.uid()::text);
drop policy if exists "businesses_update_owner" on public.businesses;
create policy "businesses_update_owner" on public.businesses for update to authenticated using (created_by_id = auth.uid()::text) with check (created_by_id = auth.uid()::text);
drop policy if exists "businesses_delete_owner" on public.businesses;
create policy "businesses_delete_owner" on public.businesses for delete to authenticated using (created_by_id = auth.uid()::text);

drop policy if exists "branches_read_active_or_owner" on public.branches;
create policy "branches_read_active_or_owner" on public.branches for select to anon, authenticated using (is_active = true or public.vimi_owns_business(business_id));
drop policy if exists "branches_insert_owner" on public.branches;
create policy "branches_insert_owner" on public.branches for insert to authenticated with check (public.vimi_owns_business(business_id));
drop policy if exists "branches_update_owner" on public.branches;
create policy "branches_update_owner" on public.branches for update to authenticated using (public.vimi_owns_business(business_id)) with check (public.vimi_owns_business(business_id));
drop policy if exists "branches_delete_owner" on public.branches;
create policy "branches_delete_owner" on public.branches for delete to authenticated using (public.vimi_owns_business(business_id));

drop policy if exists "product_categories_owner_all" on public.product_categories;
create policy "product_categories_owner_all" on public.product_categories for all to authenticated using (public.vimi_owns_business(business_id)) with check (public.vimi_owns_business(business_id));
drop policy if exists "products_read_active_or_owner" on public.products;
create policy "products_read_active_or_owner" on public.products for select to anon, authenticated using (is_active = true or public.vimi_owns_business(business_id));
drop policy if exists "products_owner_insert" on public.products;
create policy "products_owner_insert" on public.products for insert to authenticated with check (public.vimi_owns_business(business_id) and created_by_id = auth.uid()::text);
drop policy if exists "products_owner_update" on public.products;
create policy "products_owner_update" on public.products for update to authenticated using (public.vimi_owns_business(business_id)) with check (public.vimi_owns_business(business_id));
drop policy if exists "products_owner_delete" on public.products;
create policy "products_owner_delete" on public.products for delete to authenticated using (public.vimi_owns_business(business_id));

drop policy if exists "inventory_read_available_or_owner" on public.branch_inventory;
create policy "inventory_read_available_or_owner" on public.branch_inventory for select to anon, authenticated using (is_available = true or public.vimi_owns_business(business_id));
drop policy if exists "inventory_owner_all" on public.branch_inventory;
create policy "inventory_owner_all" on public.branch_inventory for all to authenticated using (public.vimi_owns_business(business_id)) with check (public.vimi_owns_business(business_id));

-- Personal data and buyer-owned collections.
drop policy if exists "addresses_owner_all" on public.addresses;
create policy "addresses_owner_all" on public.addresses for all to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
drop policy if exists "carts_owner_all" on public.carts;
create policy "carts_owner_all" on public.carts for all to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
drop policy if exists "cart_items_owner_all" on public.cart_items;
create policy "cart_items_owner_all" on public.cart_items for all to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()::text)) with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()::text));
drop policy if exists "favorite_stores_owner_all" on public.favorite_stores;
create policy "favorite_stores_owner_all" on public.favorite_stores for all to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
drop policy if exists "saved_stores_owner_all" on public.saved_stores;
create policy "saved_stores_owner_all" on public.saved_stores for all to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select" on public.notifications for select to authenticated using (user_id = auth.uid()::text);
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update to authenticated using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);

-- Orders are intentionally read-only to clients. Checkout and status transitions must be server-side RPC/Edge Functions.
drop policy if exists "orders_buyer_or_seller_read" on public.orders;
create policy "orders_buyer_or_seller_read" on public.orders for select to authenticated using (user_id = auth.uid()::text or public.vimi_owns_business(business_id));
drop policy if exists "order_items_read_if_order_visible" on public.order_items;
create policy "order_items_read_if_order_visible" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid()::text or public.vimi_owns_business(o.business_id))));

-- Generic updated_at triggers for all tables that contain updated_at.
do $$ declare t text; begin
  foreach t in array array['geo_areas','categories','businesses','branches','product_categories','products','branch_inventory','addresses','carts','cart_items','orders','order_items','favorite_stores','saved_stores','notifications'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch_updated_at', t);
    execute format('create trigger %I before update on public.%I for each row execute procedure public.vimi_touch_updated_at()', t || '_touch_updated_at', t);
  end loop;
end $$;

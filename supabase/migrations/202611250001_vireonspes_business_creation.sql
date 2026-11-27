-- Create a business and its first branch atomically using the authenticated
-- Supabase user as owner. Existing ownership remains businesses.created_by_id.
-- Business managers are represented separately from the account-wide profile role.

do $$
begin
  if to_regclass('public.businesses') is null
     or to_regclass('public.branches') is null
     or to_regclass('public.categories') is null
     or to_regclass('public.geo_areas') is null then
    raise exception 'Business creation prerequisites are missing; apply the Vimi schema migration first';
  end if;
end
$$;

create table if not exists public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id text not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'manager' check (role = 'manager'),
  created_by_id text not null,
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);

create index if not exists business_members_user_business_idx
  on public.business_members(user_id, business_id);

alter table public.business_members enable row level security;
revoke all on public.business_members from public, anon, authenticated;
grant select, insert, delete on public.business_members to authenticated;

create or replace function public.vimi_owns_business(target_business_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.businesses b
     where b.id = target_business_id
       and b.created_by_id = auth.uid()::text
  ) or exists (
    select 1
      from public.business_members bm
     where bm.business_id = target_business_id
       and bm.user_id = auth.uid()
       and bm.role = 'manager'
  );
$$;

revoke all on function public.vimi_owns_business(text) from public;
grant execute on function public.vimi_owns_business(text) to anon, authenticated;

drop policy if exists business_members_select_related on public.business_members;
create policy business_members_select_related
  on public.business_members for select to authenticated
  using (user_id = auth.uid() or public.vimi_owns_business(business_id));

drop policy if exists business_members_insert_manager on public.business_members;
create policy business_members_insert_manager
  on public.business_members for insert to authenticated
  with check (
    public.vimi_owns_business(business_id)
    and created_by_id = auth.uid()::text
    and user_id <> auth.uid()
  );

drop policy if exists business_members_delete_manager on public.business_members;
create policy business_members_delete_manager
  on public.business_members for delete to authenticated
  using (public.vimi_owns_business(business_id));

drop policy if exists "businesses_read_active_or_owner" on public.businesses;
create policy "businesses_read_active_or_owner"
  on public.businesses for select to anon, authenticated
  using (is_active = true or public.vimi_owns_business(id));

drop policy if exists "businesses_update_owner" on public.businesses;
create policy "businesses_update_owner"
  on public.businesses for update to authenticated
  using (public.vimi_owns_business(id))
  with check (public.vimi_owns_business(id));

revoke update on public.businesses from authenticated;
grant update (name, description, logo_url, category_id, category_name, is_active, low_stock_threshold)
  on public.businesses to authenticated;

create or replace function public.vimi_create_business_with_branch(
  p_name text,
  p_description text,
  p_logo_url text,
  p_category_id text,
  p_store_id text,
  p_phone text,
  p_working_hours text,
  p_geo_area_id text,
  p_country text,
  p_region text,
  p_city text,
  p_district text,
  p_address text,
  p_latitude double precision,
  p_longitude double precision
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid text := auth.uid()::text;
  v_name text := btrim(coalesce(p_name, ''));
  v_category_name text;
  v_geo_country text;
  v_geo_region text;
  v_geo_city text;
  v_geo_type text;
  v_business public.businesses%rowtype;
  v_branch public.branches%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;
  if v_name = '' or length(v_name) > 120 then
    raise exception using errcode = '22023', message = 'Biznes nomi 1 dan 120 ta belgigacha bo‘lishi kerak';
  end if;
  if p_category_id is null or btrim(p_category_id) = '' then
    raise exception using errcode = '22023', message = 'Biznes kategoriyasini tanlang';
  end if;
  select c.name into v_category_name
    from public.categories c
   where c.id = p_category_id;
  if not found then
    raise exception using errcode = '22023', message = 'Tanlangan kategoriya topilmadi';
  end if;
  if p_description is not null and length(p_description) > 1200 then
    raise exception using errcode = '22023', message = 'Tavsif 1200 ta belgidan oshmasligi kerak';
  end if;
  if p_logo_url is not null and length(p_logo_url) > 2048 then
    raise exception using errcode = '22023', message = 'Logo manzili juda uzun';
  end if;
  if p_store_id is null or p_store_id !~ '^[A-Z0-9]{1,6}-[A-Z0-9]{4,6}$' then
    raise exception using errcode = '22023', message = 'Store ID formati noto‘g‘ri';
  end if;
  if p_phone is not null and length(btrim(p_phone)) > 40 then
    raise exception using errcode = '22023', message = 'Telefon raqami 40 ta belgidan oshmasligi kerak';
  end if;
  if p_working_hours is not null and length(btrim(p_working_hours)) > 120 then
    raise exception using errcode = '22023', message = 'Ish vaqti 120 ta belgidan oshmasligi kerak';
  end if;
  if p_country is null or btrim(p_country) = '' or length(btrim(p_country)) > 100
     or p_region is null or btrim(p_region) = '' or length(btrim(p_region)) > 100
     or p_city is null or btrim(p_city) = '' or length(btrim(p_city)) > 100 then
    raise exception using errcode = '22023', message = 'Davlat, viloyat va shahar/tumanni tanlang';
  end if;
  if p_geo_area_id is null or btrim(p_geo_area_id) = '' then
    raise exception using errcode = '22023', message = 'Hududni tanlang';
  end if;
  select country.name, region.name, area.name, area.type
    into v_geo_country, v_geo_region, v_geo_city, v_geo_type
    from public.geo_areas area
    join public.geo_areas region on region.id = area.parent_id
    join public.geo_areas country on country.id = region.parent_id
   where area.id = p_geo_area_id
     and area.type in ('city', 'district')
     and region.type = 'region'
     and country.type = 'country';
  if not found
     or lower(btrim(p_country)) <> lower(v_geo_country)
     or lower(btrim(p_region)) <> lower(v_geo_region)
     or lower(btrim(p_city)) <> lower(v_geo_city)
     or (v_geo_type = 'district' and lower(btrim(coalesce(p_district, ''))) <> lower(v_geo_city))
     or (v_geo_type = 'city' and nullif(btrim(coalesce(p_district, '')), '') is not null) then
    raise exception using errcode = '22023', message = 'Tanlangan hudud ma’lumotlari mos kelmadi';
  end if;
  if p_district is not null and length(btrim(p_district)) > 100 then
    raise exception using errcode = '22023', message = 'Tuman nomi 100 ta belgidan oshmasligi kerak';
  end if;
  if p_address is not null and length(btrim(p_address)) > 240 then
    raise exception using errcode = '22023', message = 'Manzil 240 ta belgidan oshmasligi kerak';
  end if;
  if p_latitude is null or p_longitude is null
     or p_latitude::text in ('NaN', 'Infinity', '-Infinity') or p_latitude < -90 or p_latitude > 90
     or p_longitude::text in ('NaN', 'Infinity', '-Infinity') or p_longitude < -180 or p_longitude > 180 then
    raise exception using errcode = '22023', message = 'Xarita koordinatalari noto‘g‘ri';
  end if;

  insert into public.businesses (
    name, description, logo_url, category_id, category_name, store_id, is_active,
    created_by_id
  ) values (
    v_name, nullif(btrim(coalesce(p_description, '')), ''),
    nullif(btrim(coalesce(p_logo_url, '')), ''),
    p_category_id, v_category_name,
    p_store_id, true, v_uid
  )
  returning * into v_business;

  insert into public.branches (
    business_id, owner_id, name, geo_area_id, country, region, city, district,
    address, latitude, longitude, phone, working_hours, is_active, created_by_id
  ) values (
    v_business.id, v_uid, 'Asosiy filial', nullif(btrim(coalesce(p_geo_area_id, '')), ''),
    btrim(p_country), btrim(p_region), btrim(p_city), nullif(btrim(coalesce(p_district, '')), ''),
    nullif(btrim(coalesce(p_address, '')), ''), p_latitude, p_longitude,
    nullif(btrim(coalesce(p_phone, '')), ''),
    nullif(btrim(coalesce(p_working_hours, '')), ''), true, v_uid
  )
  returning * into v_branch;

  return jsonb_build_object(
    'business', to_jsonb(v_business),
    'branch', to_jsonb(v_branch)
  );
end;
$$;

revoke all on function public.vimi_create_business_with_branch(
  text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision
) from public, anon;
grant execute on function public.vimi_create_business_with_branch(
  text, text, text, text, text, text, text, text, text, text, text, text, text, double precision, double precision
) to authenticated;

notify pgrst, 'reload schema';

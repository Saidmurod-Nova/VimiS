-- Courier Mode uses the existing orders, branches, order_items, profiles,
-- notifications, and vimi_is_admin() structures.
-- Apply after migrations 202610130002, 202610130003, 202610190002,
-- and 202610220001.

do $$
begin
  if to_regclass('public.profiles') is null
     or to_regclass('public.orders') is null
     or to_regclass('public.order_items') is null
     or to_regclass('public.branches') is null
     or to_regclass('public.businesses') is null
     or to_regclass('public.notifications') is null
     or to_regprocedure('public.vimi_is_admin()') is null then
    raise exception 'Courier Mode migration prerequisites are missing; apply the documented Vimi migrations first';
  end if;
end
$$;

create table if not exists public.courier_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'suspended')),
  is_available boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'approved') or (is_available = false))
);

create table if not exists public.courier_deliveries (
  id uuid primary key default gen_random_uuid(),
  order_id text not null unique references public.orders(id) on delete cascade,
  courier_id uuid references auth.users(id) on delete set null,
  status text not null default 'available'
    check (status in ('available', 'accepted', 'picked_up', 'on_the_way', 'delivered', 'cancelled')),
  accepted_at timestamptz,
  picked_up_at timestamptz,
  on_the_way_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status = 'available' and courier_id is null)
    or (status <> 'available' and status <> 'cancelled' and courier_id is not null)
    or status = 'cancelled'
  )
);

create table if not exists public.courier_delivery_events (
  id bigint generated always as identity primary key,
  delivery_id uuid not null references public.courier_deliveries(id) on delete cascade,
  courier_id uuid references auth.users(id) on delete set null,
  changed_by uuid references auth.users(id) on delete set null,
  previous_status text,
  new_status text not null,
  created_at timestamptz not null default now()
);

create index if not exists courier_deliveries_available_idx
  on public.courier_deliveries(status, created_at desc)
  where status = 'available';
create index if not exists courier_deliveries_courier_status_idx
  on public.courier_deliveries(courier_id, status, updated_at desc);
create index if not exists courier_delivery_events_delivery_created_idx
  on public.courier_delivery_events(delivery_id, created_at);

drop trigger if exists courier_profiles_touch_updated_at on public.courier_profiles;
create trigger courier_profiles_touch_updated_at
  before update on public.courier_profiles
  for each row execute procedure public.vimi_touch_updated_at();

drop trigger if exists courier_deliveries_touch_updated_at on public.courier_deliveries;
create trigger courier_deliveries_touch_updated_at
  before update on public.courier_deliveries
  for each row execute procedure public.vimi_touch_updated_at();

alter table public.courier_profiles enable row level security;
alter table public.courier_deliveries enable row level security;
alter table public.courier_delivery_events enable row level security;

drop policy if exists courier_profiles_read_self_or_admin on public.courier_profiles;
create policy courier_profiles_read_self_or_admin
  on public.courier_profiles for select to authenticated
  using (user_id = auth.uid() or public.vimi_is_admin());

drop policy if exists courier_deliveries_read_available_or_assigned on public.courier_deliveries;
create policy courier_deliveries_read_available_or_assigned
  on public.courier_deliveries for select to authenticated
  using (
    courier_id = auth.uid()
    or (
      status = 'available'
      and exists (
        select 1
          from public.courier_profiles cp
         where cp.user_id = auth.uid()
           and cp.status = 'approved'
           and cp.is_available
      )
    )
  );

drop policy if exists courier_delivery_events_read_own_or_admin on public.courier_delivery_events;
create policy courier_delivery_events_read_own_or_admin
  on public.courier_delivery_events for select to authenticated
  using (courier_id = auth.uid() or changed_by = auth.uid() or public.vimi_is_admin());

revoke all on public.courier_profiles from anon, authenticated;
grant select on public.courier_profiles to authenticated;
revoke all on public.courier_deliveries from anon, authenticated;
grant select on public.courier_deliveries to authenticated;
revoke all on public.courier_delivery_events from anon, authenticated;
grant select on public.courier_delivery_events to authenticated;

create or replace function public.vimi_courier_record_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.courier_delivery_events (
      delivery_id, courier_id, changed_by, previous_status, new_status
    ) values (
      new.id, new.courier_id, auth.uid(), null, new.status
    );
  elsif new.status is distinct from old.status then
    insert into public.courier_delivery_events (
      delivery_id, courier_id, changed_by, previous_status, new_status
    ) values (
      new.id, new.courier_id, auth.uid(), old.status, new.status
    );
  end if;
  return new;
end;
$$;

revoke all on function public.vimi_courier_record_event() from public, anon, authenticated;

drop trigger if exists courier_deliveries_record_event on public.courier_deliveries;
create trigger courier_deliveries_record_event
  after insert on public.courier_deliveries
  for each row execute function public.vimi_courier_record_event();

drop trigger if exists courier_deliveries_record_status_event on public.courier_deliveries;
create trigger courier_deliveries_record_status_event
  after update of status on public.courier_deliveries
  for each row execute function public.vimi_courier_record_event();

create or replace function public.vimi_courier_sync_order()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'preparing' and new.delivery_address is not null and btrim(new.delivery_address) <> '' then
    insert into public.courier_deliveries (order_id)
    values (new.id)
    on conflict (order_id) do nothing;
  end if;

  if new.status in ('cancelled', 'completed') then
    update public.courier_deliveries
       set status = 'cancelled',
           cancelled_at = now()
     where order_id = new.id
       and status in ('available', 'accepted', 'picked_up', 'on_the_way');
  end if;
  return new;
end;
$$;

revoke all on function public.vimi_courier_sync_order() from public, anon, authenticated;

drop trigger if exists orders_sync_courier_insert on public.orders;
create trigger orders_sync_courier_insert
  after insert on public.orders
  for each row execute function public.vimi_courier_sync_order();

drop trigger if exists orders_sync_courier_status on public.orders;
create trigger orders_sync_courier_status
  after update of status on public.orders
  for each row
  when (new.status is distinct from old.status)
  execute function public.vimi_courier_sync_order();

-- Orders that were already being prepared before this migration become eligible.
insert into public.courier_deliveries (order_id)
select o.id
  from public.orders o
 where o.status = 'preparing'
   and o.delivery_address is not null
   and btrim(o.delivery_address) <> ''
on conflict (order_id) do nothing;

create or replace function public.vimi_courier_delivery_payload(
  p_delivery_id uuid,
  p_include_customer boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', d.id,
    'order_id', o.id,
    'order_number', o.order_number,
    'status', d.status,
    'store', coalesce(o.business_name, b.name, ''),
    'store_address', coalesce(nullif(br.address, ''), br.name, ''),
    'destination', coalesce(o.delivery_address, ''),
    'customer_name', case when p_include_customer and d.courier_id = auth.uid()
      then coalesce(o.buyer_name_snapshot, '') else null end,
    'customer_phone', case when p_include_customer and d.courier_id = auth.uid()
      then coalesce(o.buyer_phone_snapshot, '') else null end,
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.product_name,
        'quantity', oi.quantity
      ) order by oi.created_at)
        from public.order_items oi
       where oi.order_id = o.id
    ), '[]'::jsonb),
    'item_count', o.item_count,
    'delivery_fee', o.delivery_fee,
    'notes', o.notes,
    'created_at', o.created_at,
    'accepted_at', d.accepted_at,
    'picked_up_at', d.picked_up_at,
    'on_the_way_at', d.on_the_way_at,
    'delivered_at', d.delivered_at,
    'cancelled_at', d.cancelled_at
  )
    from public.courier_deliveries d
    join public.orders o on o.id = d.order_id
    join public.businesses b on b.id = o.business_id
    join public.branches br on br.id = o.branch_id
   where d.id = p_delivery_id;
$$;

revoke all on function public.vimi_courier_delivery_payload(uuid, boolean) from public, anon, authenticated;

create or replace function public.vimi_courier_request_access()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;

  insert into public.courier_profiles (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select cp.status into v_status
    from public.courier_profiles cp
   where cp.user_id = v_uid;

  return jsonb_build_object('ok', true, 'status', v_status);
end;
$$;

create or replace function public.vimi_admin_list_courier_applications()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_applications jsonb;
begin
  if v_uid is null or not public.vimi_is_admin() then
    raise exception using errcode = '42501', message = 'Administrator ruxsati talab qilinadi';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', cp.user_id,
      'status', cp.status,
      'created_at', cp.created_at,
      'full_name', coalesce(p.full_name, ''),
      'phone', p.phone
    ) order by cp.created_at asc
  ), '[]'::jsonb)
    into v_applications
    from public.courier_profiles cp
    left join public.profiles p on p.id = cp.user_id
   where cp.status = 'pending';

  return v_applications;
end;
$$;

create or replace function public.vimi_admin_set_courier_application_status(
  p_user_id uuid,
  p_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.courier_profiles%rowtype;
begin
  if v_uid is null or not public.vimi_is_admin() then
    raise exception using errcode = '42501', message = 'Administrator ruxsati talab qilinadi';
  end if;
  if p_user_id is null or p_status is null or p_status not in ('approved', 'rejected') then
    raise exception using errcode = '22023', message = 'Kuryer holati noto‘g‘ri';
  end if;

  update public.courier_profiles
     set status = p_status,
         approved_by = case when p_status = 'approved' then v_uid else null end,
         approved_at = case when p_status = 'approved' then now() else null end,
         is_available = false
   where user_id = p_user_id
     and status = 'pending'
  returning * into v_profile;

  if not found then
    raise exception using errcode = 'P0002', message = 'Kutilayotgan kuryer arizasi topilmadi';
  end if;

  return jsonb_build_object(
    'user_id', v_profile.user_id,
    'status', v_profile.status,
    'approved_by', v_profile.approved_by,
    'approved_at', v_profile.approved_at
  );
end;
$$;

create or replace function public.vimi_courier_get_state()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_status text := 'not_requested';
  v_is_available boolean := false;
  v_available jsonb := '[]'::jsonb;
  v_active jsonb := '[]'::jsonb;
  v_completed jsonb := '[]'::jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;

  select cp.status, cp.is_available
    into v_status, v_is_available
    from public.courier_profiles cp
   where cp.user_id = v_uid;
  v_status := coalesce(v_status, 'not_requested');
  v_is_available := coalesce(v_is_available, false);

  if v_status = 'approved' and v_is_available then
    select coalesce(jsonb_agg(
      public.vimi_courier_delivery_payload(d.id, false)
      order by o.created_at desc
    ), '[]'::jsonb)
      into v_available
      from public.courier_deliveries d
      join public.orders o on o.id = d.order_id
     where d.status = 'available'
       and o.status = 'preparing'
       and d.courier_id is null;
  end if;

  if v_status = 'approved' or v_status = 'suspended' then
    select coalesce(jsonb_agg(
      public.vimi_courier_delivery_payload(d.id, true)
      order by o.created_at desc
    ), '[]'::jsonb)
      into v_active
      from public.courier_deliveries d
      join public.orders o on o.id = d.order_id
     where d.courier_id = v_uid
       and d.status in ('accepted', 'picked_up', 'on_the_way');

    select coalesce(jsonb_agg(
      public.vimi_courier_delivery_payload(d.id, true)
      order by d.delivered_at desc
    ), '[]'::jsonb)
      into v_completed
      from public.courier_deliveries d
      join public.orders o on o.id = d.order_id
     where d.courier_id = v_uid
       and d.status = 'delivered';
  end if;

  return jsonb_build_object(
    'status', v_status,
    'is_available', v_status = 'approved' and v_is_available,
    'available_deliveries', v_available,
    'active_deliveries', v_active,
    'completed_deliveries', v_completed
  );
end;
$$;

create or replace function public.vimi_courier_set_availability(p_is_available boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;
  if p_is_available is null then
    raise exception using errcode = '22023', message = 'Onlayn holat belgilanmagan';
  end if;

  update public.courier_profiles
     set is_available = p_is_available
   where user_id = v_uid
     and status = 'approved';
  if not found then
    raise exception using errcode = '42501', message = 'Kuryerlik rejimi administrator tomonidan tasdiqlanishi kerak';
  end if;

  return jsonb_build_object('ok', true, 'is_available', p_is_available);
end;
$$;

create or replace function public.vimi_courier_accept_delivery(p_delivery_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.courier_profiles%rowtype;
  v_delivery public.courier_deliveries%rowtype;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;
  select cp.* into v_profile
    from public.courier_profiles cp
   where cp.user_id = v_uid
   for update;
  if not found or v_profile.status <> 'approved' or not v_profile.is_available then
    raise exception using errcode = '42501', message = 'Tasdiqlangan va onlayn kuryer bo‘lish talab qilinadi';
  end if;

  update public.courier_deliveries d
     set courier_id = v_uid,
         status = 'accepted',
         accepted_at = now()
   where d.id = p_delivery_id
     and d.status = 'available'
     and d.courier_id is null
     and exists (
       select 1 from public.orders o
        where o.id = d.order_id
          and o.status = 'preparing'
          and o.delivery_address is not null
     )
  returning d.* into v_delivery;
  if not found then
    raise exception using errcode = '40001', message = 'Buyurtma endi mavjud emas yoki boshqa kuryer qabul qilgan';
  end if;

  return public.vimi_courier_delivery_payload(v_delivery.id, true);
end;
$$;

create or replace function public.vimi_courier_update_delivery(
  p_delivery_id uuid,
  p_new_status text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_delivery public.courier_deliveries%rowtype;
  v_expected_status text;
  v_now timestamptz := now();
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;

  select d.* into v_delivery
    from public.courier_deliveries d
   where d.id = p_delivery_id
     and d.courier_id = v_uid
   for update;
  if not found then
    raise exception using errcode = '42501', message = 'Bu buyurtma sizga biriktirilmagan';
  end if;

  v_expected_status := case v_delivery.status
    when 'accepted' then 'picked_up'
    when 'picked_up' then 'on_the_way'
    when 'on_the_way' then 'delivered'
    else null
  end;
  if v_expected_status is null or p_new_status is distinct from v_expected_status then
    raise exception using errcode = '22023', message = 'Buyurtma holatlari ketma-ketligi noto‘g‘ri';
  end if;
  if p_new_status = 'delivered' and not exists (
    select 1 from public.orders o where o.id = v_delivery.order_id and o.status = 'preparing'
  ) then
    raise exception using errcode = '22023', message = 'Buyurtma yetkazishga tayyor holatda emas';
  end if;

  update public.courier_deliveries
     set status = p_new_status,
         picked_up_at = case when p_new_status = 'picked_up' then v_now else picked_up_at end,
         on_the_way_at = case when p_new_status = 'on_the_way' then v_now else on_the_way_at end,
         delivered_at = case when p_new_status = 'delivered' then v_now else delivered_at end
   where id = v_delivery.id
  returning * into v_delivery;

  if p_new_status = 'delivered' then
    update public.orders
       set status = 'completed',
           completed_at = v_now
     where id = v_delivery.order_id
       and status = 'preparing';
    if not found then
      raise exception using errcode = '40001', message = 'Buyurtma holati o‘zgargan; yetkazish yakunlanmadi';
    end if;
  end if;

  return public.vimi_courier_delivery_payload(v_delivery.id, true);
end;
$$;

create or replace function public.vimi_notify_courier_delivery_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_seller_id text;
  v_recipient record;
  v_title text;
  v_message text;
  v_status_label text;
begin
  if new.status is not distinct from old.status
     or new.status not in ('accepted', 'picked_up', 'on_the_way', 'delivered') then
    return new;
  end if;

  select o.* into v_order from public.orders o where o.id = new.order_id;
  select b.created_by_id into v_seller_id from public.businesses b where b.id = v_order.business_id;

  v_status_label := case new.status
    when 'accepted' then 'kuryer buyurtmani qabul qildi'
    when 'picked_up' then 'buyurtma do‘kondan olib ketildi'
    when 'on_the_way' then 'buyurtma yo‘lda'
    when 'delivered' then 'buyurtma yetkazildi'
  end;
  v_title := case new.status
    when 'accepted' then 'Kuryer topildi'
    when 'picked_up' then 'Buyurtma olib ketildi'
    when 'on_the_way' then 'Buyurtma yo‘lda'
    when 'delivered' then 'Buyurtma yetkazildi'
  end;
  v_message := v_order.order_number || ' · ' || v_status_label;

  for v_recipient in
    select distinct recipients.user_id, recipients.kind
      from (values (v_order.user_id, 'buyer'), (v_seller_id, 'seller')) as recipients(user_id, kind)
     where recipients.user_id is not null
       and (new.status <> 'delivered' or recipients.kind = 'seller')
  loop
    insert into public.notifications (
      recipient_id, title, message, type, link, data, event_key
    ) values (
      v_recipient.user_id,
      v_title,
      v_message,
      case when v_recipient.kind = 'seller' then 'order_seller' else 'order_buyer' end,
      case when v_recipient.kind = 'seller'
        then '/seller/orders/' || v_order.id
        else '/orders/' || v_order.id end,
      jsonb_build_object('order_id', v_order.id, 'delivery_status', new.status),
      'courier:' || new.id || ':' || new.status || ':' || v_recipient.kind
    )
    on conflict (recipient_id, event_key) where event_key is not null do nothing;
  end loop;

  return new;
end;
$$;

revoke all on function public.vimi_notify_courier_delivery_status() from public, anon, authenticated;

drop trigger if exists courier_deliveries_notify_status on public.courier_deliveries;
create trigger courier_deliveries_notify_status
  after update of status on public.courier_deliveries
  for each row execute function public.vimi_notify_courier_delivery_status();

revoke all on function public.vimi_courier_request_access() from public, anon;
revoke all on function public.vimi_admin_list_courier_applications() from public, anon;
revoke all on function public.vimi_admin_set_courier_application_status(uuid, text) from public, anon;
revoke all on function public.vimi_courier_get_state() from public, anon;
revoke all on function public.vimi_courier_set_availability(boolean) from public, anon;
revoke all on function public.vimi_courier_accept_delivery(uuid) from public, anon;
revoke all on function public.vimi_courier_update_delivery(uuid, text) from public, anon;
grant execute on function public.vimi_courier_request_access() to authenticated;
grant execute on function public.vimi_admin_list_courier_applications() to authenticated;
grant execute on function public.vimi_admin_set_courier_application_status(uuid, text) to authenticated;
grant execute on function public.vimi_courier_get_state() to authenticated;
grant execute on function public.vimi_courier_set_availability(boolean) to authenticated;
grant execute on function public.vimi_courier_accept_delivery(uuid) to authenticated;
grant execute on function public.vimi_courier_update_delivery(uuid, text) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'courier_deliveries'
     ) then
    alter publication supabase_realtime add table public.courier_deliveries;
  end if;
end;
$$;

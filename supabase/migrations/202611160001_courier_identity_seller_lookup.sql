-- Add public courier codes and a business-owner-only assigned courier lookup.

create sequence if not exists public.courier_code_seq;
revoke all on sequence public.courier_code_seq from public, anon, authenticated;

alter table public.courier_profiles
  add column if not exists courier_code text;

update public.courier_profiles
   set courier_code = 'K-' || lpad(nextval('public.courier_code_seq')::text, 6, '0')
 where courier_code is null;

alter table public.courier_profiles
  alter column courier_code set default ('K-' || lpad(nextval('public.courier_code_seq')::text, 6, '0')),
  alter column courier_code set not null;

create unique index if not exists courier_profiles_courier_code_uidx
  on public.courier_profiles(courier_code);

create or replace function public.vimi_courier_get_identity()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_identity jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;

  select jsonb_build_object('courier_code', cp.courier_code)
    into v_identity
    from public.courier_profiles cp
   where cp.user_id = v_uid;

  return v_identity;
end;
$$;

create or replace function public.vimi_seller_get_order_courier(p_order_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_courier jsonb;
begin
  if v_uid is null then
    raise exception using errcode = '28000', message = 'Kirish talab qilinadi';
  end if;

  select jsonb_build_object(
    'courier_code', cp.courier_code,
    'name', coalesce(nullif(p.full_name, ''), 'Kuryer'),
    'phone', p.phone,
    'status', d.status,
    'accepted_at', d.accepted_at
  )
    into v_courier
    from public.orders o
    join public.courier_deliveries d on d.order_id = o.id
    join public.courier_profiles cp on cp.user_id = d.courier_id
    left join public.profiles p on p.id = d.courier_id
   where o.id = p_order_id
     and public.vimi_owns_business(o.business_id)
     and d.status in ('accepted', 'picked_up', 'on_the_way', 'delivered')
   limit 1;

  return v_courier;
end;
$$;

revoke all on function public.vimi_courier_get_identity() from public, anon, authenticated;
revoke all on function public.vimi_seller_get_order_courier(text) from public, anon, authenticated;
grant execute on function public.vimi_courier_get_identity() to authenticated;
grant execute on function public.vimi_seller_get_order_courier(text) to authenticated;
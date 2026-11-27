-- Add admin-only courier application review RPCs.
-- The original Courier migration is already applied in some environments.

do $$
begin
  if to_regclass('public.courier_profiles') is null
     or to_regclass('public.profiles') is null
     or to_regprocedure('public.vimi_is_admin()') is null then
    raise exception 'Courier approval prerequisites are missing; apply the Vimi and Courier migrations first';
  end if;
end
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

revoke all on function public.vimi_admin_list_courier_applications() from public, anon;
revoke all on function public.vimi_admin_set_courier_application_status(uuid, text) from public, anon;
grant execute on function public.vimi_admin_list_courier_applications() to authenticated;
grant execute on function public.vimi_admin_set_courier_application_status(uuid, text) to authenticated;

notify pgrst, 'reload schema';

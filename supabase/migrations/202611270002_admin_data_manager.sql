-- Let authenticated admins manage marketplace records through the in-app data manager.
-- Private auth/session and Telegram integration tables intentionally stay inaccessible.
do $$
declare
  table_name text;
  managed_tables text[] := array[
    'geo_areas',
    'categories',
    'businesses',
    'branches',
    'product_categories',
    'products',
    'branch_inventory',
    'addresses',
    'carts',
    'cart_items',
    'orders',
    'order_items',
    'favorite_stores',
    'saved_stores',
    'notifications',
    'business_members',
    'courier_profiles',
    'courier_deliveries'
  ];
begin
  if to_regprocedure('public.vimi_is_admin()') is null then
    raise exception 'Admin data manager requires public.vimi_is_admin(); apply the admin category access migration first';
  end if;

  foreach table_name in array managed_tables loop
    if to_regclass(format('public.%I', table_name)) is null then
      raise exception 'Admin data manager requires public.% table', table_name;
    end if;

    execute format('alter table public.%I enable row level security', table_name);
    execute format('grant select, insert, update, delete on public.%I to authenticated', table_name);
    execute format('drop policy if exists admin_data_manager_all on public.%I', table_name);
    execute format(
      'create policy admin_data_manager_all on public.%I for all to authenticated using (public.vimi_is_admin()) with check (public.vimi_is_admin())',
      table_name
    );
  end loop;

  if to_regclass('public.profiles') is not null then
    execute 'drop policy if exists admin_data_manager_read on public.profiles';
    execute 'create policy admin_data_manager_read on public.profiles for select to authenticated using (public.vimi_is_admin())';
    execute 'grant select on public.profiles to authenticated';
  end if;

  if to_regclass('public.courier_delivery_events') is not null then
    execute 'drop policy if exists admin_data_manager_read on public.courier_delivery_events';
    execute 'create policy admin_data_manager_read on public.courier_delivery_events for select to authenticated using (public.vimi_is_admin())';
    execute 'grant select on public.courier_delivery_events to authenticated';
  end if;
end
$$;

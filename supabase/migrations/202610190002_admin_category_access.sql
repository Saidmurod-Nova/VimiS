-- Restrict global category management to users whose protected profile role is admin.
create or replace function public.vimi_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles profile
    where profile.id = auth.uid()
      and profile.role = 'admin'
  );
$$;

revoke all on function public.vimi_is_admin() from public;
grant execute on function public.vimi_is_admin() to authenticated;

drop policy if exists "categories_admin_manage" on public.categories;
create policy "categories_admin_manage"
on public.categories
for all
to authenticated
using (public.vimi_is_admin())
with check (public.vimi_is_admin());

grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
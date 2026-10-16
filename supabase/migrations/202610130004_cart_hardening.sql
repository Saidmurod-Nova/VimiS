-- Harden the active-cart invariant and duplicate protections for the Supabase cart flow.
-- This migration is intentionally additive and does not rewrite prior migrations.

create unique index if not exists carts_active_user_unique_idx
  on public.carts (user_id)
  where status = 'active';

create unique index if not exists cart_items_cart_product_unique_idx
  on public.cart_items (cart_id, product_id);

create or replace function public.vimi_assert_user_cart_access(p_cart_id text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.carts c
    where c.id = p_cart_id
      and c.user_id = auth.uid()::text
      and c.status = 'active'
  );
$$;

revoke all on function public.vimi_assert_user_cart_access(text) from public, anon;
grant execute on function public.vimi_assert_user_cart_access(text) to authenticated;

-- The app should still rely on table RLS for ownership enforcement, but this helper
-- provides a safe, explicit gate for any future RPC or server-side operation.

-- Allow a linked seller to perform the same safe order transitions as the
-- authenticated web workflow, without exposing the service role to Telegram.
alter table public.telegram_order_outbox
  add column if not exists failed_at timestamptz,
  add column if not exists skipped_at timestamptz;

create or replace function public.vimi_telegram_claim_outbox(p_limit integer default 20)
returns table (
  id uuid,
  bot_type text,
  recipient_user_id text,
  order_id text,
  event_type text,
  status_snapshot text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit < 1 or p_limit > 100 then
    raise exception using errcode = '22023', message = 'Invalid Telegram outbox batch size';
  end if;

  delete from public.telegram_order_outbox
   where id in (
     select o.id
       from public.telegram_order_outbox o
      where o.delivered_at < now() - interval '90 days'
         or o.failed_at < now() - interval '90 days'
         or o.skipped_at < now() - interval '90 days'
      order by coalesce(o.delivered_at, o.failed_at, o.skipped_at)
      limit 500
   );

  return query
  with candidates as (
    select o.id
      from public.telegram_order_outbox o
     where o.delivered_at is null
       and o.failed_at is null
       and o.skipped_at is null
       and o.available_at <= now()
       and (o.locked_until is null or o.locked_until < now())
     order by o.created_at
     limit p_limit
     for update skip locked
  ),
  claimed as (
    update public.telegram_order_outbox o
       set locked_until = now() + interval '2 minutes',
           attempts = o.attempts + 1
      from candidates c
     where o.id = c.id
    returning o.id, o.bot_type, o.recipient_user_id, o.order_id, o.event_type, o.status_snapshot
  )
  select c.id, c.bot_type, c.recipient_user_id, c.order_id, c.event_type, c.status_snapshot
    from claimed c;
end;
$$;

create or replace function public.vimi_telegram_complete_outbox(
  p_id uuid,
  p_delivered boolean,
  p_error text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_retry_seconds integer;
  v_retry_after integer;
begin
  if p_delivered then
    update public.telegram_order_outbox
       set delivered_at = now(),
           locked_until = null,
           last_error = null
     where id = p_id and delivered_at is null and failed_at is null and skipped_at is null;
  elsif p_error ~ '^telegram_skipped_[a-z_]+$' then
    update public.telegram_order_outbox
       set skipped_at = now(),
           locked_until = null,
           last_error = left(p_error, 1000)
     where id = p_id and delivered_at is null and failed_at is null and skipped_at is null;
  elsif p_error ~ '^telegram_permanent_[0-9]{3}$' then
    update public.telegram_order_outbox
       set failed_at = now(),
           locked_until = null,
           last_error = left(p_error, 1000)
     where id = p_id and delivered_at is null and failed_at is null and skipped_at is null;
  else
    v_retry_seconds := least(3600, (5 * power(2, least(attempts, 10)))::integer);
    if p_error ~ '^telegram_429:[0-9]{1,4}$' then
      v_retry_after := least(3600, greatest(1, substring(p_error from '^telegram_429:([0-9]{1,4})$')::integer));
      v_retry_seconds := greatest(v_retry_seconds, v_retry_after);
    end if;
    update public.telegram_order_outbox
       set available_at = now() + v_retry_seconds * interval '1 second',
           locked_until = null,
           last_error = left(coalesce(p_error, 'telegram_delivery_failed'), 1000)
     where id = p_id and delivered_at is null and failed_at is null and skipped_at is null;
  end if;
end;
$$;

create or replace function public.vimi_telegram_update_seller_order_status(
  p_telegram_user_id bigint,
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
  v_user_id text;
  v_order public.orders%rowtype;
  v_item record;
  v_now timestamptz := now();
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0
     or p_order_id is null
     or p_new_status not in ('accepted', 'preparing', 'completed', 'cancelled') then
    raise exception using errcode = '22023', message = 'Invalid Telegram order action';
  end if;

  select l.user_id::text into v_user_id
    from public.telegram_account_links l
   where l.bot_type = 'seller'
     and l.telegram_user_id = p_telegram_user_id;
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Linked seller account required';
  end if;

  select o.* into v_order
    from public.orders o
   where o.id = p_order_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;

  if not exists (
    select 1
      from public.businesses b
     where b.id = v_order.business_id
       and b.created_by_id = v_user_id
  ) then
    raise exception using errcode = '42501', message = 'Seller does not own this order';
  end if;

  if not (
    (v_order.status = 'pending' and p_new_status in ('accepted', 'cancelled')) or
    (v_order.status = 'accepted' and p_new_status in ('preparing', 'cancelled')) or
    (v_order.status = 'preparing' and p_new_status = 'completed')
  ) then
    raise exception using errcode = '22023', message = 'Order status transition is not allowed';
  end if;

  if p_new_status = 'cancelled' then
    for v_item in
      select product_id, quantity
        from public.order_items
       where order_id = v_order.id
         and product_id is not null
    loop
      update public.branch_inventory
         set stock = stock + v_item.quantity
       where branch_id = v_order.branch_id
         and product_id = v_item.product_id;
    end loop;
  end if;

  update public.orders
     set status = p_new_status,
         cancellation_reason = case
           when p_new_status = 'cancelled' then left(coalesce(p_cancellation_reason, ''), 500)
           else cancellation_reason
         end,
         accepted_at = case when p_new_status = 'accepted' then v_now else accepted_at end,
         preparing_at = case when p_new_status = 'preparing' then v_now else preparing_at end,
         completed_at = case when p_new_status = 'completed' then v_now else completed_at end,
         cancelled_at = case when p_new_status = 'cancelled' then v_now else cancelled_at end
   where id = v_order.id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', p_new_status
  );
end;
$$;

revoke all on function public.vimi_telegram_update_seller_order_status(bigint, text, text, text)
  from public, anon, authenticated;
grant execute on function public.vimi_telegram_update_seller_order_status(bigint, text, text, text)
  to service_role;

create or replace function public.vimi_telegram_cancel_buyer_order(
  p_telegram_user_id bigint,
  p_order_id text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id text;
  v_order public.orders%rowtype;
  v_item record;
  v_seller_id text;
begin
  if p_telegram_user_id is null or p_telegram_user_id <= 0 or p_order_id is null then
    raise exception using errcode = '22023', message = 'Invalid Telegram cancellation request';
  end if;

  select l.user_id::text into v_user_id
    from public.telegram_account_links l
   where l.bot_type = 'buyer'
     and l.telegram_user_id = p_telegram_user_id;
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Linked buyer account required';
  end if;

  select o.* into v_order
    from public.orders o
   where o.id = p_order_id
     and o.user_id = v_user_id
   for update;
  if not found then
    raise exception using errcode = 'P0002', message = 'Order not found';
  end if;
  if v_order.status <> 'pending' then
    raise exception using errcode = '22023', message = 'Only pending orders can be cancelled by the buyer';
  end if;

  for v_item in
    select product_id, quantity
      from public.order_items
     where order_id = v_order.id
       and product_id is not null
  loop
    update public.branch_inventory
       set stock = stock + v_item.quantity
     where branch_id = v_order.branch_id
       and product_id = v_item.product_id;
  end loop;

  update public.orders
     set status = 'cancelled',
         cancellation_reason = 'Telegram orqali xaridor tomonidan bekor qilindi',
         cancelled_at = now()
   where id = v_order.id;

  select b.created_by_id into v_seller_id
    from public.businesses b
   where b.id = v_order.business_id;
  if v_seller_id is not null then
    insert into public.telegram_order_outbox (
      event_key, bot_type, recipient_user_id, order_id, event_type, status_snapshot
    ) values (
      'order:' || v_order.id || ':cancelled:seller',
      'seller',
      v_seller_id,
      v_order.id,
      'status_changed',
      'cancelled'
    )
    on conflict (event_key) do nothing;
  end if;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'status', 'cancelled'
  );
end;
$$;

revoke all on function public.vimi_telegram_cancel_buyer_order(bigint, text)
  from public, anon, authenticated;
grant execute on function public.vimi_telegram_cancel_buyer_order(bigint, text)
  to service_role;

create or replace function public.vimi_telegram_enqueue_buyer_cancellation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id text;
begin
  if new.status = 'cancelled'
     and old.status is distinct from new.status
     and auth.uid()::text = new.user_id then
    select b.created_by_id into v_seller_id
      from public.businesses b
     where b.id = new.business_id;

    if v_seller_id is not null then
      insert into public.telegram_order_outbox (
        event_key, bot_type, recipient_user_id, order_id, event_type, status_snapshot
      ) values (
        'order:' || new.id || ':cancelled:seller',
        'seller',
        v_seller_id,
        new.id,
        'status_changed',
        'cancelled'
      )
      on conflict (event_key) do nothing;
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.vimi_telegram_enqueue_buyer_cancellation()
  from public, anon, authenticated;
drop trigger if exists orders_telegram_buyer_cancel on public.orders;
create trigger orders_telegram_buyer_cancel
  after update of status on public.orders
  for each row
  when (old.status is distinct from new.status and new.status = 'cancelled')
  execute function public.vimi_telegram_enqueue_buyer_cancellation();

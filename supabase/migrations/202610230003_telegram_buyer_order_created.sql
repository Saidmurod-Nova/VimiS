create or replace function public.vimi_telegram_enqueue_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id text;
begin
  if tg_op = 'INSERT' then
    select b.created_by_id into v_seller_id
      from public.businesses b
     where b.id = new.business_id;

    if v_seller_id is not null then
      insert into public.telegram_order_outbox (
        event_key, bot_type, recipient_user_id, order_id, event_type, status_snapshot
      ) values (
        'order:' || new.id || ':new:seller',
        'seller',
        v_seller_id,
        new.id,
        'new_order',
        new.status
      )
      on conflict (event_key) do nothing;
    end if;

    if new.user_id is not null then
      insert into public.telegram_order_outbox (
        event_key, bot_type, recipient_user_id, order_id, event_type, status_snapshot
      ) values (
        'order:' || new.id || ':new:buyer',
        'buyer',
        new.user_id,
        new.id,
        'new_order',
        new.status
      )
      on conflict (event_key) do nothing;
    end if;
  elsif new.status is distinct from old.status and new.user_id is not null then
    insert into public.telegram_order_outbox (
      event_key, bot_type, recipient_user_id, order_id, event_type, status_snapshot
    ) values (
      'order:' || new.id || ':' || new.status || ':buyer',
      'buyer',
      new.user_id,
      new.id,
      'status_changed',
      new.status
    )
    on conflict (event_key) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.vimi_telegram_enqueue_order_event()
  from public, anon, authenticated;

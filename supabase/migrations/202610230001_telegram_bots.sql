-- Telegram integration for the existing Supabase-authenticated VimiS users
-- and orders. This migration adds private integration tables; it does not
-- recreate or modify marketplace tables.

create table if not exists public.telegram_account_links (
  id uuid primary key default gen_random_uuid(),
  bot_type text not null check (bot_type in ('buyer', 'seller')),
  telegram_user_id bigint not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_at timestamptz not null default now(),
  unique (bot_type, telegram_user_id),
  unique (bot_type, user_id)
);

create table if not exists public.telegram_link_tokens (
  token_hash text primary key,
  bot_type text not null check (bot_type in ('buyer', 'seller')),
  user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create index if not exists telegram_link_tokens_expiry_idx
  on public.telegram_link_tokens(expires_at)
  where consumed_at is null;

create table if not exists public.telegram_notification_preferences (
  bot_type text not null check (bot_type in ('buyer', 'seller')),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_status_enabled boolean not null default true,
  new_order_enabled boolean not null default true,
  revision integer not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now(),
  primary key (bot_type, user_id)
);

create table if not exists public.telegram_webhook_updates (
  bot_type text not null check (bot_type in ('buyer', 'seller')),
  update_id bigint not null,
  state text not null default 'processing' check (state in ('processing', 'completed')),
  lease_until timestamptz not null default now(),
  received_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (bot_type, update_id)
);

create table if not exists public.telegram_order_outbox (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  bot_type text not null check (bot_type in ('buyer', 'seller')),
  recipient_user_id text not null,
  order_id text not null references public.orders(id) on delete cascade,
  event_type text not null check (event_type in ('new_order', 'status_changed')),
  status_snapshot text not null,
  created_at timestamptz not null default now(),
  available_at timestamptz not null default now(),
  locked_until timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  delivered_at timestamptz,
  last_error text
);

create index if not exists telegram_order_outbox_pending_idx
  on public.telegram_order_outbox(available_at, created_at)
  where delivered_at is null;

alter table public.telegram_account_links enable row level security;
alter table public.telegram_link_tokens enable row level security;
alter table public.telegram_notification_preferences enable row level security;
alter table public.telegram_webhook_updates enable row level security;
alter table public.telegram_order_outbox enable row level security;

revoke all on public.telegram_account_links from public, anon, authenticated;
revoke all on public.telegram_link_tokens from public, anon, authenticated;
revoke all on public.telegram_notification_preferences from public, anon, authenticated;
revoke all on public.telegram_webhook_updates from public, anon, authenticated;
revoke all on public.telegram_order_outbox from public, anon, authenticated;

grant all on public.telegram_account_links to service_role;
grant all on public.telegram_link_tokens to service_role;
grant all on public.telegram_notification_preferences to service_role;
grant all on public.telegram_webhook_updates to service_role;
grant all on public.telegram_order_outbox to service_role;

create or replace function public.vimi_telegram_create_link_token(
  p_bot_type text,
  p_user_id uuid,
  p_token_hash text,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_bot_type not in ('buyer', 'seller')
     or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_expires_at <= now()
     or p_expires_at > now() + interval '10 minutes' then
    raise exception using errcode = '22023', message = 'Invalid Telegram link token parameters';
  end if;

  delete from public.telegram_link_tokens
   where expires_at <= now() or consumed_at is not null;

  insert into public.telegram_link_tokens (token_hash, bot_type, user_id, expires_at)
  values (p_token_hash, p_bot_type, p_user_id, p_expires_at);
end;
$$;

create or replace function public.vimi_telegram_consume_link_token(
  p_bot_type text,
  p_token_hash text,
  p_telegram_user_id bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_existing_user_id uuid;
  v_existing_telegram_user_id bigint;
begin
  if p_bot_type not in ('buyer', 'seller')
     or p_token_hash !~ '^[a-f0-9]{64}$'
     or p_telegram_user_id is null
     or p_telegram_user_id <= 0 then
    raise exception using errcode = '22023', message = 'Invalid Telegram link token parameters';
  end if;

  update public.telegram_link_tokens
     set consumed_at = now()
   where token_hash = p_token_hash
     and bot_type = p_bot_type
     and consumed_at is null
     and expires_at > now()
  returning user_id into v_user_id;

  if v_user_id is null then
    select t.user_id into v_user_id
      from public.telegram_link_tokens t
      join public.telegram_account_links l
        on l.bot_type = t.bot_type
       and l.user_id = t.user_id
       and l.telegram_user_id = p_telegram_user_id
     where t.token_hash = p_token_hash
       and t.bot_type = p_bot_type
       and t.consumed_at is not null;
    return v_user_id::text;
  end if;

  select user_id into v_existing_user_id
    from public.telegram_account_links
   where bot_type = p_bot_type and telegram_user_id = p_telegram_user_id;
  if v_existing_user_id is not null and v_existing_user_id <> v_user_id then
    raise exception using errcode = '23505', message = 'Telegram account is already linked to another VimiS account';
  end if;

  select telegram_user_id into v_existing_telegram_user_id
    from public.telegram_account_links
   where bot_type = p_bot_type and user_id = v_user_id;
  if v_existing_telegram_user_id is not null and v_existing_telegram_user_id <> p_telegram_user_id then
    raise exception using errcode = '23505', message = 'VimiS account is already linked to another Telegram account';
  end if;

  insert into public.telegram_account_links (bot_type, telegram_user_id, user_id)
  values (p_bot_type, p_telegram_user_id, v_user_id)
  on conflict (bot_type, telegram_user_id) do nothing;

  return v_user_id::text;
end;
$$;

create or replace function public.vimi_telegram_unlink(
  p_bot_type text,
  p_telegram_user_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
begin
  delete from public.telegram_account_links
   where bot_type = p_bot_type
     and telegram_user_id = p_telegram_user_id
  returning user_id into v_user_id;

  if v_user_id is null then
    return false;
  end if;

  delete from public.telegram_notification_preferences
   where bot_type = p_bot_type and user_id = v_user_id;
  return true;
end;
$$;

create or replace function public.vimi_telegram_claim_update(
  p_bot_type text,
  p_update_id bigint
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_claimed_id bigint;
  v_state text;
begin
  if p_bot_type not in ('buyer', 'seller') or p_update_id is null or p_update_id < 0 then
    raise exception using errcode = '22023', message = 'Invalid Telegram update';
  end if;

  if p_update_id % 1000 = 0 then
    delete from public.telegram_webhook_updates
     where state = 'completed' and completed_at < now() - interval '30 days';
  end if;

  insert into public.telegram_webhook_updates (bot_type, update_id, lease_until)
  values (p_bot_type, p_update_id, now() + interval '2 minutes')
  on conflict (bot_type, update_id) do update
    set state = 'processing',
        lease_until = now() + interval '2 minutes',
        received_at = now()
    where public.telegram_webhook_updates.state = 'processing'
      and public.telegram_webhook_updates.lease_until < now()
  returning update_id into v_claimed_id;

  if v_claimed_id is not null then
    return 'claimed';
  end if;

  select state into v_state
    from public.telegram_webhook_updates
   where bot_type = p_bot_type and update_id = p_update_id;

  return case when v_state = 'completed' then 'completed' else 'busy' end;
end;
$$;

create or replace function public.vimi_telegram_complete_update(
  p_bot_type text,
  p_update_id bigint
)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.telegram_webhook_updates
     set state = 'completed',
         completed_at = now(),
         lease_until = now()
   where bot_type = p_bot_type
     and update_id = p_update_id
     and state = 'processing';
$$;

create or replace function public.vimi_telegram_set_preference(
  p_bot_type text,
  p_user_id uuid,
  p_link_id uuid,
  p_preference text,
  p_expected_revision integer,
  p_desired boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current boolean;
  v_revision integer;
begin
  if p_bot_type not in ('buyer', 'seller')
     or (p_bot_type = 'buyer' and p_preference <> 'order_status_enabled')
     or (p_bot_type = 'seller' and p_preference <> 'new_order_enabled')
     or p_expected_revision is null
     or p_expected_revision < 0 then
    raise exception using errcode = '22023', message = 'Invalid Telegram notification preference';
  end if;

  if not exists (
    select 1 from public.telegram_account_links l
     where l.id = p_link_id and l.bot_type = p_bot_type and l.user_id = p_user_id
  ) then
    return 'stale';
  end if;

  insert into public.telegram_notification_preferences (bot_type, user_id)
  values (p_bot_type, p_user_id)
  on conflict (bot_type, user_id) do nothing;

  if p_preference = 'order_status_enabled' then
    select order_status_enabled, revision into v_current, v_revision
      from public.telegram_notification_preferences
     where bot_type = p_bot_type and user_id = p_user_id
     for update;
  else
    select new_order_enabled, revision into v_current, v_revision
      from public.telegram_notification_preferences
     where bot_type = p_bot_type and user_id = p_user_id
     for update;
  end if;

  if v_current = p_desired and v_revision = p_expected_revision + 1 then
    return 'unchanged';
  end if;
  if v_current = p_desired then
    return 'stale';
  end if;
  if v_revision <> p_expected_revision then
    return 'stale';
  end if;

  if p_preference = 'order_status_enabled' then
    update public.telegram_notification_preferences
       set order_status_enabled = p_desired, revision = revision + 1, updated_at = now()
     where bot_type = p_bot_type and user_id = p_user_id;
  else
    update public.telegram_notification_preferences
       set new_order_enabled = p_desired, revision = revision + 1, updated_at = now()
     where bot_type = p_bot_type and user_id = p_user_id;
  end if;
  return 'updated';
end;
$$;

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
     select id from public.telegram_order_outbox
      where delivered_at < now() - interval '90 days'
      order by delivered_at
      limit 500
   );

  return query
  with candidates as (
    select o.id
      from public.telegram_order_outbox o
     where o.delivered_at is null
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
begin
  if p_delivered then
    update public.telegram_order_outbox
       set delivered_at = now(),
           locked_until = null,
           last_error = null
     where id = p_id and delivered_at is null;
  else
    update public.telegram_order_outbox
       set available_at = now() + least(3600, (5 * power(2, least(attempts, 10)))::integer) * interval '1 second',
           locked_until = null,
           last_error = left(coalesce(p_error, 'Delivery failed'), 1000)
     where id = p_id and delivered_at is null;
  end if;
end;
$$;

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

revoke all on function public.vimi_telegram_create_link_token(text, uuid, text, timestamptz) from public, anon, authenticated;
revoke all on function public.vimi_telegram_consume_link_token(text, text, bigint) from public, anon, authenticated;
revoke all on function public.vimi_telegram_unlink(text, bigint) from public, anon, authenticated;
revoke all on function public.vimi_telegram_claim_update(text, bigint) from public, anon, authenticated;
revoke all on function public.vimi_telegram_complete_update(text, bigint) from public, anon, authenticated;
revoke all on function public.vimi_telegram_set_preference(text, uuid, uuid, text, integer, boolean) from public, anon, authenticated;
revoke all on function public.vimi_telegram_claim_outbox(integer) from public, anon, authenticated;
revoke all on function public.vimi_telegram_complete_outbox(uuid, boolean, text) from public, anon, authenticated;
revoke all on function public.vimi_telegram_enqueue_order_event() from public, anon, authenticated;

grant execute on function public.vimi_telegram_create_link_token(text, uuid, text, timestamptz) to service_role;
grant execute on function public.vimi_telegram_consume_link_token(text, text, bigint) to service_role;
grant execute on function public.vimi_telegram_unlink(text, bigint) to service_role;
grant execute on function public.vimi_telegram_claim_update(text, bigint) to service_role;
grant execute on function public.vimi_telegram_complete_update(text, bigint) to service_role;
grant execute on function public.vimi_telegram_set_preference(text, uuid, uuid, text, integer, boolean) to service_role;
grant execute on function public.vimi_telegram_claim_outbox(integer) to service_role;
grant execute on function public.vimi_telegram_complete_outbox(uuid, boolean, text) to service_role;

drop trigger if exists orders_telegram_outbox on public.orders;
create trigger orders_telegram_outbox
  after insert or update of status on public.orders
  for each row execute function public.vimi_telegram_enqueue_order_event();

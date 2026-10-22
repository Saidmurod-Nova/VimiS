do $$
begin
  if to_regclass('public.notifications') is null then
    raise exception 'public.notifications must exist before applying the notification center migration';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'user_id'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'recipient_id'
  ) then
    alter table public.notifications rename column user_id to recipient_id;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'body'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'message'
  ) then
    alter table public.notifications rename column body to message;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'read'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'notifications' and column_name = 'is_read'
  ) then
    alter table public.notifications rename column read to is_read;
  end if;
end
$$;

alter table public.notifications
  add column if not exists link text,
  add column if not exists data jsonb not null default '{}'::jsonb,
  add column if not exists event_key text;

alter table public.notifications
  alter column recipient_id set not null,
  alter column is_read set default false,
  alter column is_read set not null,
  alter column data set default '{}'::jsonb,
  alter column data set not null;

alter index if exists public.notifications_user_event_unique
  rename to notifications_recipient_event_unique;

create unique index if not exists notifications_recipient_event_unique
  on public.notifications(recipient_id, event_key)
  where event_key is not null;

create or replace function public.vimi_notify_order_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_seller_id text;
  v_recipient_id text;
  v_title text;
  v_message text;
  v_type text;
  v_link text;
  v_event_key text;
begin
  select b.created_by_id into v_seller_id
    from public.businesses b where b.id = new.business_id;

  if tg_op = 'INSERT' then
    v_recipient_id := v_seller_id;
    v_title := 'Yangi buyurtma';
    v_message := new.order_number || ' · ' || new.item_count || ' ta mahsulot · ' || new.total || ' so‘m';
    v_type := 'order_seller';
    v_link := '/seller/orders/' || new.id;
    v_event_key := 'order:' || new.id || ':new:seller';
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' and auth.uid()::text = new.user_id then
      v_recipient_id := v_seller_id;
      v_title := 'Buyurtma bekor qilindi';
      v_message := new.order_number || ' buyurtma xaridor tomonidan bekor qilindi';
      v_type := 'order_seller';
      v_link := '/seller/orders/' || new.id;
      v_event_key := 'order:' || new.id || ':cancelled:seller';
    else
      v_recipient_id := new.user_id;
      v_title := case new.status
        when 'accepted' then 'Buyurtma qabul qilindi'
        when 'preparing' then 'Buyurtma tayyorlanmoqda'
        when 'completed' then 'Buyurtma yakunlandi'
        when 'cancelled' then 'Buyurtma bekor qilindi'
        else 'Buyurtma yangilandi'
      end;
      v_message := case new.status
        when 'accepted' then new.order_number || ' buyurtmangiz qabul qilindi'
        when 'preparing' then new.order_number || ' buyurtmangiz tayyorlanmoqda'
        when 'completed' then new.order_number || ' buyurtmangiz yakunlandi'
        when 'cancelled' then new.order_number || ' buyurtma do‘kon tomonidan bekor qilindi'
        else new.order_number || ' buyurtma holati yangilandi'
      end;
      v_type := 'order_buyer';
      v_link := '/orders/' || new.id;
      v_event_key := 'order:' || new.id || ':' || new.status || ':buyer';
    end if;
  else
    return new;
  end if;

  if v_recipient_id is not null then
    insert into public.notifications (recipient_id, title, message, type, link, data, event_key)
    values (
      v_recipient_id,
      v_title,
      v_message,
      v_type,
      v_link,
      jsonb_build_object('order_id', new.id, 'event_key', v_event_key),
      v_event_key
    )
    on conflict (recipient_id, event_key) where event_key is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.vimi_notify_order_event() from public, anon, authenticated;

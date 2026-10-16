-- Keep order notifications in Supabase when checkout or a status transition
-- changes an order. The event key makes retries idempotent.
create unique index if not exists notifications_user_event_unique
  on public.notifications(user_id, event_key)
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
  v_body text;
  v_type text;
  v_event_key text;
begin
  select b.created_by_id into v_seller_id
    from public.businesses b where b.id = new.business_id;

  if tg_op = 'INSERT' then
    v_recipient_id := v_seller_id;
    v_title := 'Yangi buyurtma';
    v_body := new.order_number || ' · ' || new.item_count || ' ta mahsulot · ' || new.total || ' so‘m';
    v_type := 'order_seller';
    v_event_key := 'order:' || new.id || ':new:seller';
  elsif new.status is distinct from old.status then
    if new.status = 'cancelled' and auth.uid()::text = new.user_id then
      v_recipient_id := v_seller_id;
      v_title := 'Buyurtma bekor qilindi';
      v_body := new.order_number || ' buyurtma xaridor tomonidan bekor qilindi';
      v_type := 'order_seller';
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
      v_body := case new.status
        when 'accepted' then new.order_number || ' buyurtmangiz qabul qilindi'
        when 'preparing' then new.order_number || ' buyurtmangiz tayyorlanmoqda'
        when 'completed' then new.order_number || ' buyurtmangiz yakunlandi'
        when 'cancelled' then new.order_number || ' buyurtma do‘kon tomonidan bekor qilindi'
        else new.order_number || ' buyurtma holati yangilandi'
      end;
      v_type := 'order_buyer';
      v_event_key := 'order:' || new.id || ':' || new.status || ':buyer';
    end if;
  else
    return new;
  end if;

  if v_recipient_id is not null then
    insert into public.notifications (user_id, title, body, type, related_id, event_key)
    values (v_recipient_id, v_title, v_body, v_type, new.id, v_event_key)
    on conflict (user_id, event_key) where event_key is not null do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.vimi_notify_order_event() from public, anon, authenticated;

drop trigger if exists orders_notify_insert on public.orders;
create trigger orders_notify_insert
  after insert on public.orders
  for each row execute function public.vimi_notify_order_event();

drop trigger if exists orders_notify_status on public.orders;
create trigger orders_notify_status
  after update of status on public.orders
  for each row execute function public.vimi_notify_order_event();

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end;
$$;
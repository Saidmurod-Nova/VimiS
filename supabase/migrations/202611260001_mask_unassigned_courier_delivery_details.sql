create or replace function public.vimi_courier_delivery_payload(
  p_delivery_id uuid,
  p_include_customer boolean default false
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id', d.id,
    'order_id', o.id,
    'order_number', o.order_number,
    'status', d.status,
    'store', coalesce(o.business_name, b.name, ''),
    'store_address', coalesce(nullif(br.address, ''), br.name, ''),
    'destination', case
      when p_include_customer and d.courier_id = auth.uid()
        then coalesce(o.delivery_address, '')
      else null
    end,
    'customer_name', case
      when p_include_customer and d.courier_id = auth.uid()
        then coalesce(o.buyer_name_snapshot, '')
      else null
    end,
    'customer_phone', case
      when p_include_customer and d.courier_id = auth.uid()
        then coalesce(o.buyer_phone_snapshot, '')
      else null
    end,
    'products', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', oi.product_name,
        'quantity', oi.quantity
      ) order by oi.created_at)
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb),
    'item_count', o.item_count,
    'delivery_fee', o.delivery_fee,
    'notes', case
      when p_include_customer and d.courier_id = auth.uid()
        then o.notes
      else null
    end,
    'created_at', o.created_at,
    'accepted_at', d.accepted_at,
    'picked_up_at', d.picked_up_at,
    'on_the_way_at', d.on_the_way_at,
    'delivered_at', d.delivered_at,
    'cancelled_at', d.cancelled_at
  )
  from public.courier_deliveries d
  join public.orders o on o.id = d.order_id
  join public.businesses b on b.id = o.business_id
  join public.branches br on br.id = o.branch_id
  where d.id = p_delivery_id;
$$;

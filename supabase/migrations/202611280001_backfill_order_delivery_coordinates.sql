begin;

with ranked_addresses as (
  select
    o.id as order_id,
    a.latitude,
    a.longitude,
    row_number() over (
      partition by o.id
      order by
        abs(extract(epoch from (a.updated_at - o.created_at))),
        a.is_default desc,
        a.created_at desc
    ) as address_rank
  from public.orders o
  join public.addresses a
    on a.user_id = o.user_id
   and btrim(a.address) = btrim(o.delivery_address)
  where (o.delivery_latitude is null or o.delivery_longitude is null)
    and a.latitude between -90 and 90
    and a.longitude between -180 and 180
)
update public.orders o
   set delivery_latitude = a.latitude,
       delivery_longitude = a.longitude
  from ranked_addresses a
 where a.order_id = o.id
   and a.address_rank = 1;

commit;

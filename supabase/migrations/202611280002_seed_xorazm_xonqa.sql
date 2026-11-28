insert into public.geo_areas (
  id,
  parent_id,
  type,
  name,
  code,
  created_by_id,
  created_at,
  updated_at
)
select
  '6c2928b72b2d11f0a1b2c3d4',
  region.id,
  'city',
  'Xonqa',
  null,
  null,
  now(),
  now()
from public.geo_areas as region
where region.type = 'region'
  and region.name = 'Xorazm viloyati'
on conflict (id) do update set
  parent_id = excluded.parent_id,
  type = excluded.type,
  name = excluded.name,
  code = excluded.code,
  updated_at = excluded.updated_at;

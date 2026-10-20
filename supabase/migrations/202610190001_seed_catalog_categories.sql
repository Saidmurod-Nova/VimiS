-- Seed buyer-facing business categories; the migration can be re-run safely.
insert into public.categories (name, icon)
select seed.name, seed.icon
from (values
  ('Oziq-ovqat', '🥬'),
  ('Ichimliklar', '🥤'),
  ('Elektronika', '📱'),
  ('Kiyim-kechak', '👕'),
  ('Poyabzal', '👟'),
  ('Go‘zallik va parvarish', '✨'),
  ('Uy va bog‘', '🏡'),
  ('Bolalar tovarlari', '🧸'),
  ('Sport va dam olish', '⚽'),
  ('Avtomobil', '🚗'),
  ('Dorixona', '🩺'),
  ('Maishiy texnika', '🧺')
) as seed(name, icon)
where not exists (
  select 1 from public.categories existing where lower(existing.name) = lower(seed.name)
);
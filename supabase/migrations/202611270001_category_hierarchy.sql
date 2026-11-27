alter table public.categories
  add column if not exists parent_id text references public.categories(id) on delete cascade,
  add column if not exists sort_order integer not null default 0;

create index if not exists categories_parent_idx on public.categories(parent_id);
create index if not exists categories_sort_idx on public.categories(parent_id, sort_order);

insert into public.categories (name, icon, parent_id, sort_order)
select seed.name, seed.icon, parent.id, seed.sort_order
from (
  values
    ('Telefonlar', '📱', 'Elektronika', 1),
    ('Noutbuklar', '💻', 'Elektronika', 2),
    ('Speakerlar', '🔊', 'Elektronika', 3),
    ('Planshetlar', '📟', 'Elektronika', 4),
    ('Aksessuarlar', '🎧', 'Elektronika', 5),
    ('Televizorlar', '📺', 'Elektronika', 6),
    ('Kompyuter jihozlari', '🖥️', 'Elektronika', 7),
    ('Sabzavotlar', '🥬', 'Oziq-ovqat', 1),
    ('Mevalar', '🍎', 'Oziq-ovqat', 2),
    ('Sut va sut mahsulotlari', '🥛', 'Oziq-ovqat', 3),
    ('Go‘sht va parranda', '🥩', 'Oziq-ovqat', 4),
    ('Non va qandolat', '🥐', 'Oziq-ovqat', 5),
    ('Erkaklar kiyimi', '👔', 'Kiyim-kechak', 1),
    ('Ayollar kiyimi', '👗', 'Kiyim-kechak', 2),
    ('Bolalar kiyimi', '👶', 'Kiyim-kechak', 3),
    ('Ichki kiyim', '🧦', 'Kiyim-kechak', 4),
    ('Turar joy uchun', '🛋️', 'Uy va bog‘', 1),
    ('Oshxona anjomlari', '🍳', 'Uy va bog‘', 2),
    ('Tozalash vositalari', '🧹', 'Uy va bog‘', 3),
    ('Bog‘ va balkon', '🌿', 'Uy va bog‘', 4),
    ('Soch va tan parvarishi', '💆', 'Go‘zallik va parvarish', 1),
    ('Kosmetika', '💄', 'Go‘zallik va parvarish', 2),
    ('Atirlar', '🌸', 'Go‘zallik va parvarish', 3),
    ('Gigiena', '🧼', 'Go‘zallik va parvarish', 4),
    ('Konditsionerlar', '❄️', 'Maishiy texnika', 1),
    ('Kir yuvish mashinalari', '🧺', 'Maishiy texnika', 2),
    ('Muzlatkichlar', '🧊', 'Maishiy texnika', 3),
    ('Choynak va plitalar', '🍽️', 'Maishiy texnika', 4),
    ('Sport kiyimi', '👟', 'Sport va dam olish', 1),
    ('Trenajor va anjomlar', '🏋️', 'Sport va dam olish', 2),
    ('Velosipedlar', '🚲', 'Sport va dam olish', 3),
    ('Camping', '⛺', 'Sport va dam olish', 4)
) as seed(name, icon, parent_name, sort_order)
join public.categories parent
  on lower(parent.name) = lower(seed.parent_name)
 and parent.parent_id is null
where not exists (
  select 1 from public.categories existing
  where lower(existing.name) = lower(seed.name) and existing.parent_id = parent.id
);

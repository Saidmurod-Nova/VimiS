-- Import the GeoArea export, inserting parents before their children for the self-reference.
insert into public.geo_areas (
  id, parent_id, type, name, code, created_by_id, created_at, updated_at
) values
  ('6abe02a8c50164d6f87769a4', null, 'country', 'O''zbekiston', 'UZ', '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.304000', '2026-10-01T06:50:16.304000'),

  ('6abe02af3cb180ba91b2bf82', '6abe02a8c50164d6f87769a4', 'region', 'Qoraqalpog''iston Respublikasi', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.643000', '2026-10-01T06:50:23.643000'),
  ('6abe02afa2bb1f6051262310', '6abe02a8c50164d6f87769a4', 'region', 'Navoiy viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.156000', '2026-10-01T06:50:23.156000'),
  ('6abe02ae77f20804ce1e509b', '6abe02a8c50164d6f87769a4', 'region', 'Sirdaryo viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.561000', '2026-10-01T06:50:22.561000'),
  ('6abe02ad6c4113c3280636a2', '6abe02a8c50164d6f87769a4', 'region', 'Jizzax viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:21.928000', '2026-10-01T06:50:21.928000'),
  ('6abe02ad631c8d1a98b39049', '6abe02a8c50164d6f87769a4', 'region', 'Namangan viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:21.252000', '2026-10-01T06:50:21.252000'),
  ('6abe02ac10233051720aed9a', '6abe02a8c50164d6f87769a4', 'region', 'Surxondaryo viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.684000', '2026-10-01T06:50:20.684000'),
  ('6abe02acf14748da4acbf28a', '6abe02a8c50164d6f87769a4', 'region', 'Qashqadaryo viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.200000', '2026-10-01T06:50:20.200000'),
  ('6abe02ab4d8d9e0ae47dab7a', '6abe02a8c50164d6f87769a4', 'region', 'Xorazm viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.717000', '2026-10-01T06:50:19.717000'),
  ('6abe02ab72a02d4c609031e0', '6abe02a8c50164d6f87769a4', 'region', 'Farg''ona viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.253000', '2026-10-01T06:50:19.253000'),
  ('6abe02aaf3da2dd959c87e96', '6abe02a8c50164d6f87769a4', 'region', 'Andijon viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.701000', '2026-10-01T06:50:18.701000'),
  ('6abe02aafa7e1ac38d4e47dc', '6abe02a8c50164d6f87769a4', 'region', 'Buxoro viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.250000', '2026-10-01T06:50:18.250000'),
  ('6abe02a959a76e262c184687', '6abe02a8c50164d6f87769a4', 'region', 'Samarqand viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.750000', '2026-10-01T06:50:17.750000'),
  ('6abe02a9d4db61826d5fb0bc', '6abe02a8c50164d6f87769a4', 'region', 'Toshkent viloyati', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.142000', '2026-10-01T06:50:17.142000'),
  ('6abe02a84196b11141fa3d49', '6abe02a8c50164d6f87769a4', 'region', 'Toshkent shahri', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.601000', '2026-10-01T06:50:16.601000'),

  ('6abe02afce64bb4b1550f96d', '6abe02af3cb180ba91b2bf82', 'city', 'Mo''noq', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.861000', '2026-10-01T06:50:23.861000'),
  ('6abe02afce64bb4b1550f96e', '6abe02af3cb180ba91b2bf82', 'city', 'Chimboy', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.861000', '2026-10-01T06:50:23.861000'),
  ('6abe02afce64bb4b1550f96c', '6abe02af3cb180ba91b2bf82', 'city', 'Nukus', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.861000', '2026-10-01T06:50:23.861000'),
  ('6abe02afce64bb4b1550f96f', '6abe02af3cb180ba91b2bf82', 'city', 'Beruniy', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.861000', '2026-10-01T06:50:23.861000'),

  ('6abe02afdb86a16d5b301f44', '6abe02afa2bb1f6051262310', 'city', 'Uchquduq', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.383000', '2026-10-01T06:50:23.383000'),
  ('6abe02afdb86a16d5b301f43', '6abe02afa2bb1f6051262310', 'city', 'Zarafshon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.383000', '2026-10-01T06:50:23.383000'),
  ('6abe02afdb86a16d5b301f42', '6abe02afa2bb1f6051262310', 'city', 'Navoiy', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:23.383000', '2026-10-01T06:50:23.383000'),

  ('6abe02ae768484216651e528', '6abe02ae77f20804ce1e509b', 'city', 'Guliston', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.844000', '2026-10-01T06:50:22.844000'),
  ('6abe02ae768484216651e52a', '6abe02ae77f20804ce1e509b', 'city', 'Xovos', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.844000', '2026-10-01T06:50:22.844000'),
  ('6abe02ae768484216651e529', '6abe02ae77f20804ce1e509b', 'city', 'Sirdaryo', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.844000', '2026-10-01T06:50:22.844000'),

  ('6abe02aea8fa3a60151bec47', '6abe02ad6c4113c3280636a2', 'city', 'G''allaorol', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.319000', '2026-10-01T06:50:22.319000'),
  ('6abe02aea8fa3a60151bec46', '6abe02ad6c4113c3280636a2', 'city', 'Jizzax', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.319000', '2026-10-01T06:50:22.319000'),
  ('6abe02aea8fa3a60151bec48', '6abe02ad6c4113c3280636a2', 'city', 'Zarbdor', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:22.319000', '2026-10-01T06:50:22.319000'),

  ('6abe02ad32e5f1067537975d', '6abe02ad631c8d1a98b39049', 'city', 'Chortoq', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:21.478000', '2026-10-01T06:50:21.478000'),
  ('6abe02ad32e5f1067537975e', '6abe02ad631c8d1a98b39049', 'city', 'Uchqo''rg''on', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:21.478000', '2026-10-01T06:50:21.478000'),
  ('6abe02ad32e5f1067537975c', '6abe02ad631c8d1a98b39049', 'city', 'Namangan', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:21.478000', '2026-10-01T06:50:21.478000'),

  ('6abe02ac2dacc6cb2db871a6', '6abe02ac10233051720aed9a', 'city', 'Termiz', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.948000', '2026-10-01T06:50:20.948000'),
  ('6abe02ac2dacc6cb2db871a8', '6abe02ac10233051720aed9a', 'city', 'Sherobod', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.948000', '2026-10-01T06:50:20.948000'),
  ('6abe02ac2dacc6cb2db871a7', '6abe02ac10233051720aed9a', 'city', 'Denov', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.948000', '2026-10-01T06:50:20.948000'),

  ('6abe02ac41d44fd02130f592', '6abe02acf14748da4acbf28a', 'city', 'Shahrisabz', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.466000', '2026-10-01T06:50:20.466000'),
  ('6abe02ac41d44fd02130f593', '6abe02acf14748da4acbf28a', 'city', 'Kitob', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.466000', '2026-10-01T06:50:20.466000'),
  ('6abe02ac41d44fd02130f594', '6abe02acf14748da4acbf28a', 'city', 'Chiroqchi', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.466000', '2026-10-01T06:50:20.466000'),
  ('6abe02ac41d44fd02130f591', '6abe02acf14748da4acbf28a', 'city', 'Qarshi', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:20.466000', '2026-10-01T06:50:20.466000'),

  ('6abe02ab823658649ab107c6', '6abe02ab4d8d9e0ae47dab7a', 'city', 'Shovot', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.979000', '2026-10-01T06:50:19.979000'),
  ('6abe02ab823658649ab107c4', '6abe02ab4d8d9e0ae47dab7a', 'city', 'Urganch', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.979000', '2026-10-01T06:50:19.979000'),
  ('6abe02ab823658649ab107c5', '6abe02ab4d8d9e0ae47dab7a', 'city', 'Xiva', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.979000', '2026-10-01T06:50:19.979000'),

  ('6abe02ab808c90716c77e104', '6abe02ab72a02d4c609031e0', 'city', 'Qo''qon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.500000', '2026-10-01T06:50:19.500000'),
  ('6abe02ab808c90716c77e105', '6abe02ab72a02d4c609031e0', 'city', 'Quvasoy', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.500000', '2026-10-01T06:50:19.500000'),
  ('6abe02ab808c90716c77e102', '6abe02ab72a02d4c609031e0', 'city', 'Farg''ona', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.500000', '2026-10-01T06:50:19.500000'),
  ('6abe02ab808c90716c77e103', '6abe02ab72a02d4c609031e0', 'city', 'Marg''ilon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.500000', '2026-10-01T06:50:19.500000'),
  ('6abe02ab808c90716c77e106', '6abe02ab72a02d4c609031e0', 'city', 'Qo''shtepa', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:19.500000', '2026-10-01T06:50:19.500000'),

  ('6abe02aa2cb660af1841ae20', '6abe02aaf3da2dd959c87e96', 'city', 'Andijon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.978000', '2026-10-01T06:50:18.978000'),
  ('6abe02aa2cb660af1841ae21', '6abe02aaf3da2dd959c87e96', 'city', 'Xonobod', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.978000', '2026-10-01T06:50:18.978000'),
  ('6abe02aa2cb660af1841ae22', '6abe02aaf3da2dd959c87e96', 'city', 'Asaka', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.978000', '2026-10-01T06:50:18.978000'),
  ('6abe02aa2cb660af1841ae23', '6abe02aaf3da2dd959c87e96', 'city', 'Marhamat', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.978000', '2026-10-01T06:50:18.978000'),

  ('6abe02aa4c2d192ce7b36c23', '6abe02aafa7e1ac38d4e47dc', 'city', 'G''ijduvon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.489000', '2026-10-01T06:50:18.489000'),
  ('6abe02aa4c2d192ce7b36c24', '6abe02aafa7e1ac38d4e47dc', 'city', 'Qorako''l', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.489000', '2026-10-01T06:50:18.489000'),
  ('6abe02aa4c2d192ce7b36c22', '6abe02aafa7e1ac38d4e47dc', 'city', 'Buxoro', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.489000', '2026-10-01T06:50:18.489000'),
  ('6abe02aa4c2d192ce7b36c25', '6abe02aafa7e1ac38d4e47dc', 'city', 'Olot', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.489000', '2026-10-01T06:50:18.489000'),

  ('6abe02aa6f9678bdcfe3b872', '6abe02a959a76e262c184687', 'city', 'Oqtosh', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.023000', '2026-10-01T06:50:18.023000'),
  ('6abe02aa6f9678bdcfe3b86f', '6abe02a959a76e262c184687', 'city', 'Samarqand', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.023000', '2026-10-01T06:50:18.023000'),
  ('6abe02aa6f9678bdcfe3b873', '6abe02a959a76e262c184687', 'city', 'Ishtixon', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.023000', '2026-10-01T06:50:18.023000'),
  ('6abe02aa6f9678bdcfe3b870', '6abe02a959a76e262c184687', 'city', 'Kattaqo''rg''on', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.023000', '2026-10-01T06:50:18.023000'),
  ('6abe02aa6f9678bdcfe3b871', '6abe02a959a76e262c184687', 'city', 'Urgut', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:18.023000', '2026-10-01T06:50:18.023000'),

  ('6abe02a940c6e0d1c4e62caa', '6abe02a9d4db61826d5fb0bc', 'city', 'Chirchiq', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62cac', '6abe02a9d4db61826d5fb0bc', 'city', 'Angren', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62cad', '6abe02a9d4db61826d5fb0bc', 'city', 'Bekobod', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62caf', '6abe02a9d4db61826d5fb0bc', 'city', 'Ohangaron', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62ca9', '6abe02a9d4db61826d5fb0bc', 'city', 'Toshkent', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62cab', '6abe02a9d4db61826d5fb0bc', 'city', 'Olmaliq', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),
  ('6abe02a940c6e0d1c4e62cae', '6abe02a9d4db61826d5fb0bc', 'city', 'Yangiyo''l', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:17.436000', '2026-10-01T06:50:17.436000'),

  ('6abe02a8a6a170be23ebdb1d', '6abe02a84196b11141fa3d49', 'city', 'Sergeli', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb1a', '6abe02a84196b11141fa3d49', 'city', 'Mirobod', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb18', '6abe02a84196b11141fa3d49', 'city', 'Chilonzor', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb19', '6abe02a84196b11141fa3d49', 'city', 'Yunusobod', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb1c', '6abe02a84196b11141fa3d49', 'city', 'Yakkasaroy', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb1f', '6abe02a84196b11141fa3d49', 'city', 'Uchtepa', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb1b', '6abe02a84196b11141fa3d49', 'city', 'Shayxontohur', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb1e', '6abe02a84196b11141fa3d49', 'city', 'Olmazor', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000'),
  ('6abe02a8a6a170be23ebdb20', '6abe02a84196b11141fa3d49', 'city', 'Bektemir', null, '6abdff44bc400e054637dc83', '2026-10-01T06:50:16.831000', '2026-10-01T06:50:16.831000')
on conflict (id) do update set
  parent_id = excluded.parent_id,
  type = excluded.type,
  name = excluded.name,
  code = excluded.code,
  created_by_id = excluded.created_by_id,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at;

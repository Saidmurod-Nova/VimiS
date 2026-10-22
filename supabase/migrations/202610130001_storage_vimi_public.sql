-- Vimi public product/business image bucket.
-- Run this in Supabase SQL Editor after reviewing the project settings.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vimi-public',
  'vimi-public',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public images can be read without a session; only authenticated users can upload.
drop policy if exists "Vimi images are publicly readable" on storage.objects;
create policy "Vimi images are publicly readable"
on storage.objects for select
to public
using (bucket_id = 'vimi-public');

drop policy if exists "Users upload images into their own folder" on storage.objects;
create policy "Users upload images into their own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vimi-public'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users update images in their own folder" on storage.objects;
create policy "Users update images in their own folder"
on storage.objects for update
to authenticated
using (
  bucket_id = 'vimi-public'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'vimi-public'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users delete images in their own folder" on storage.objects;
create policy "Users delete images in their own folder"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vimi-public'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

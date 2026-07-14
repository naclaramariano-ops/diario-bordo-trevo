-- Diário de Bordo Trevo V6.8.5
-- Foto de perfil + bucket público de avatares.
-- Migração não destrutiva.

alter table if exists public.usuarios
  add column if not exists foto_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Compatível com a autenticação própria atual do aplicativo.
-- O bucket armazena somente fotos de perfil públicas.
drop policy if exists "avatars_public_read" on storage.objects;
drop policy if exists "avatars_public_insert" on storage.objects;
drop policy if exists "avatars_public_update" on storage.objects;
drop policy if exists "avatars_public_delete" on storage.objects;

create policy "avatars_public_read"
on storage.objects for select
to public
using (bucket_id = 'avatars');

create policy "avatars_public_insert"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'avatars');

create policy "avatars_public_update"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'avatars')
with check (bucket_id = 'avatars');

create policy "avatars_public_delete"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'avatars');

notify pgrst, 'reload schema';

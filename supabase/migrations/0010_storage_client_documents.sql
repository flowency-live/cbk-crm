-- ============================================================
-- 0010_storage_client_documents.sql
-- Private bucket for client uploads. Objects are keyed by org:
--   {org_id}/{year}/{month}/{uuid}-{filename}
-- RLS lets a client read/write only their own org's folder; staff see all.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('client-documents', 'client-documents', false)
on conflict (id) do nothing;

drop policy if exists "client read own documents" on storage.objects;
create policy "client read own documents" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'client-documents'
    and (is_staff() or (storage.foldername(name))[1] = auth_org_id()::text)
  );

drop policy if exists "client upload own documents" on storage.objects;
create policy "client upload own documents" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'client-documents'
    and (is_staff() or (storage.foldername(name))[1] = auth_org_id()::text)
  );

drop policy if exists "staff manage documents" on storage.objects;
create policy "staff manage documents" on storage.objects
  for all to authenticated
  using (bucket_id = 'client-documents' and is_staff())
  with check (bucket_id = 'client-documents' and is_staff());

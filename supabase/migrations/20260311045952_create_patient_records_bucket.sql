insert into storage.buckets (id, name, public) 
values ('patient-records', 'patient-records', false)
on conflict (id) do nothing;

create policy "Users can view records in their tenant"
on storage.objects for select
to authenticated
using (
  bucket_id = 'patient-records' and
  auth.uid() in (
    select id from public.profiles
    where tenant_id::text = (storage.foldername(name))[1]
  )
);

create policy "Users can upload records in their tenant"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'patient-records' and
  auth.uid() in (
    select id from public.profiles
    where tenant_id::text = (storage.foldername(name))[1]
  )
);

create policy "Creator or admin can delete records"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'patient-records' and
  (
    owner = auth.uid() or
    auth.uid() in (
      select id from public.profiles
      where tenant_id::text = (storage.foldername(name))[1] and role = 'admin'
    )
  )
);

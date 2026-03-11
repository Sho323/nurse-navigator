-- Allow tenant_id to be null in profiles (for new signups who haven't selected a tenant yet)
ALTER TABLE public.profiles ALTER COLUMN tenant_id DROP NOT NULL;

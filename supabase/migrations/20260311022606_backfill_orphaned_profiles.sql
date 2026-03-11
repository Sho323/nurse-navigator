-- Backfill any missing profiles for users who signed up when the trigger failed
INSERT INTO public.profiles (id, tenant_id, name, role)
SELECT 
  au.id, 
  NULL, 
  coalesce(au.raw_user_meta_data->>'name', au.email, 'Unknown'), 
  'nurse'::user_role
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Replace the recursive/flawed SELECT policy on public.profiles
DROP POLICY IF EXISTS "Users can view profiles in their tenant" ON public.profiles;

-- 1. Always allow users to see their own profile (crucial for initial login when tenant_id is NULL)
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- 2. Allow users to see other profiles in the same tenant
CREATE POLICY "Users can view profiles in their tenant"
  ON public.profiles FOR SELECT
  USING (
    tenant_id IS NOT NULL AND 
    tenant_id = (SELECT p.tenant_id FROM public.profiles p WHERE p.id = auth.uid() LIMIT 1)
  );

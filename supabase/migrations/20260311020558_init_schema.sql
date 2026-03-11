-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ====================================================================
-- 1. Tenants Table
-- ====================================================================
create table public.tenants (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.tenants enable row level security;

-- ====================================================================
-- 2. Profiles Table (Extends auth.users)
-- ====================================================================
create type user_role as enum ('admin', 'nurse');

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  role user_role default 'nurse'::user_role not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

-- Everyone can view profiles in their own tenant
create policy "Users can view profiles in their tenant"
  on public.profiles for select using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid())
  );

-- Only admins can insert/update/delete profiles in their tenant
create policy "Admins can insert profiles in their tenant"
  on public.profiles for insert with check (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can update profiles in their tenant"
  on public.profiles for update using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can delete profiles in their tenant"
  on public.profiles for delete using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, tenant_id, name, role)
  values (
    new.id,
    -- Default to a specific tenant or handle via application logic
    -- In a real SaaS, tenant_id would be determined during signup flow
    -- For MVP, we might assign a default or require careful onboarding
    (new.raw_user_meta_data->>'tenant_id')::uuid,
    coalesce(new.raw_user_meta_data->>'name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'nurse'::user_role)
  );
  return new;
end;
$$;

-- Trigger for new user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- 3. Patients Table
-- ====================================================================
create table public.patients (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  name text not null,
  kana_name text,
  care_level text,
  insurance_type text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.patients enable row level security;

-- Everyone can view and create/update patients in their tenant
create policy "Users can view patients in their tenant"
  on public.patients for select using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can insert patients in their tenant"
  on public.patients for insert with check (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update patients in their tenant"
  on public.patients for update using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

-- Only admins can delete patients
create policy "Admins can delete patients in their tenant"
  on public.patients for delete using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ====================================================================
-- 4. Visit Records Table
-- ====================================================================
create table public.visit_records (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete cascade not null,
  nurse_id uuid references public.profiles(id) on delete cascade not null,
  visit_type text not null,
  temperature numeric,
  blood_pressure text,
  text_record text,
  image_urls text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.visit_records enable row level security;

-- Everyone can view and insert records in their tenant
create policy "Users can view records in their tenant"
  on public.visit_records for select using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can insert records in their tenant"
  on public.visit_records for insert with check (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update records in their tenant"
  on public.visit_records for update using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

-- Only creator or admin can delete
create policy "Creator or Admin can delete records"
  on public.visit_records for delete using (
    nurse_id = auth.uid() or
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ====================================================================
-- 5. Messages Table
-- ====================================================================
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  patient_id uuid references public.patients(id) on delete set null,
  content text not null,
  is_system_alert boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.messages enable row level security;

create policy "Users can view messages in their tenant"
  on public.messages for select using (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can insert messages in their tenant"
  on public.messages for insert with check (tenant_id = (select tenant_id from public.profiles where id = auth.uid()));

create policy "Creator can delete message within 5 mins"
  on public.messages for delete using (
    sender_id = auth.uid() and 
    created_at > (now() - interval '5 minutes')
  );

-- ====================================================================
-- 6. Sales Data Table
-- ====================================================================
create type sales_status as enum ('matched', 'inferred', 'error', 'pending');

create table public.sales_data (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  target_month text not null,
  billed_amount numeric not null,
  received_amount numeric,
  patient_name text not null,
  status sales_status default 'pending'::sales_status not null,
  ai_comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sales_data enable row level security;

-- Strict Admin Only policies
create policy "Admins can view sales data"
  on public.sales_data for select using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can insert sales data"
  on public.sales_data for insert with check (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can update sales data"
  on public.sales_data for update using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can delete sales data"
  on public.sales_data for delete using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

-- ====================================================================
-- 7. AI Alerts Table
-- ====================================================================
create table public.ai_alerts (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid references public.tenants(id) on delete cascade not null,
  visit_record_id uuid references public.visit_records(id) on delete cascade not null,
  alert_type text not null,
  description text not null,
  is_resolved boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.ai_alerts enable row level security;

create policy "Admins can view ai alerts"
  on public.ai_alerts for select using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );

create policy "Admins can update ai alerts"
  on public.ai_alerts for update using (
    tenant_id = (select tenant_id from public.profiles where id = auth.uid()) and
    (select role from public.profiles where id = auth.uid()) = 'admin'
  );
-- Insert/Delete handled by service role (Edge functions)

-- ====================================================================
-- Deferred Policies
-- ====================================================================
create policy "Users can view their own tenant"
  on public.tenants for select using (
    id = (select tenant_id from public.profiles where id = auth.uid())
  );

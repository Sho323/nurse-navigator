-- ============================================================
-- CONS-000: Consent management foundation
-- ============================================================

create table if not exists public.consents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  consent_type text not null check (consent_type in ('ai_assistance', 'data_sharing', 'research')),
  status text not null check (status in ('granted', 'revoked', 'pending', 'expired')),
  consented_by_kind text not null default 'patient' check (consented_by_kind in ('patient', 'representative', 'staff')),
  consented_by_user_id uuid references public.profiles(id) on delete set null,
  policy_version text not null default 'v1',
  source text not null default 'in_person' check (source in ('in_person', 'phone', 'paper', 'system')),
  notes text,
  consented_at timestamp with time zone default timezone('utc'::text, now()) not null,
  revoked_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint consents_patient_type_unique unique (patient_id, consent_type)
);

create index if not exists consents_tenant_patient_idx
  on public.consents (tenant_id, patient_id);

create index if not exists consents_tenant_type_status_idx
  on public.consents (tenant_id, consent_type, status);

alter table public.consents enable row level security;

drop policy if exists "Users can view consents in tenant" on public.consents;
create policy "Users can view consents in tenant"
  on public.consents for select
  using (
    tenant_id = public.get_my_tenant_id()
  );

drop policy if exists "Staff can insert consents in tenant" on public.consents;
create policy "Staff can insert consents in tenant"
  on public.consents for insert
  with check (
    tenant_id = public.get_my_tenant_id()
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'nurse')
  );

drop policy if exists "Staff can update consents in tenant" on public.consents;
create policy "Staff can update consents in tenant"
  on public.consents for update
  using (
    tenant_id = public.get_my_tenant_id()
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'nurse')
  )
  with check (
    tenant_id = public.get_my_tenant_id()
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'nurse')
  );

create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  consent_id uuid not null references public.consents(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  patient_id uuid not null references public.patients(id) on delete cascade,
  consent_type text not null check (consent_type in ('ai_assistance', 'data_sharing', 'research')),
  action text not null check (action in ('grant', 'revoke', 'update')),
  consent_status_before text check (consent_status_before in ('granted', 'revoked', 'pending', 'expired')),
  consent_status_after text not null check (consent_status_after in ('granted', 'revoked', 'pending', 'expired')),
  consented_by_kind text check (consented_by_kind in ('patient', 'representative', 'staff')),
  performed_by_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists consent_events_tenant_patient_idx
  on public.consent_events (tenant_id, patient_id, created_at desc);

create index if not exists consent_events_consent_idx
  on public.consent_events (consent_id, created_at desc);

alter table public.consent_events enable row level security;

drop policy if exists "Users can view consent events in tenant" on public.consent_events;
create policy "Users can view consent events in tenant"
  on public.consent_events for select
  using (
    tenant_id = public.get_my_tenant_id()
  );

drop policy if exists "Staff can insert consent events in tenant" on public.consent_events;
create policy "Staff can insert consent events in tenant"
  on public.consent_events for insert
  with check (
    tenant_id = public.get_my_tenant_id()
    and (select role from public.profiles where id = auth.uid()) in ('admin', 'nurse')
  );

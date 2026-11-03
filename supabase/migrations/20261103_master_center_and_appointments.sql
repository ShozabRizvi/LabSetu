-- =====================================================================================
-- Master Lab Center, Authority Account & Schema Alignment Migration
-- File: supabase/migrations/20261103_master_center_and_appointments.sql
-- =====================================================================================

-- 1. Ensure public.lab_centers table exists
create table if not exists public.lab_centers (
  id uuid primary key default gen_random_uuid(),
  center_name text not null default 'LabSetu Central Diagnostic Lab',
  name text default 'LabSetu Central Reference Lab',
  code text default 'LAB-1001',
  address text default 'Health City, Sector 44, Gurugram, Haryana',
  phone text default '+91 98765 43210',
  email text default 'shozab64@gmail.com',
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.lab_centers enable row level security;
drop policy if exists "Lab centers read all" on public.lab_centers;
create policy "Lab centers read all" on public.lab_centers for select using (true);
drop policy if exists "Lab centers modify all" on public.lab_centers;
create policy "Lab centers modify all" on public.lab_centers for all using (true) with check (true);

-- 2. Insert or update Master Lab Center (Anchor FK cb17e71d-cb76-49e6-a202-4a82c94de5d8)
insert into public.lab_centers (id, center_name, name, code, is_active, email)
values (
  'cb17e71d-cb76-49e6-a202-4a82c94de5d8',
  'LabSetu Central Diagnostic Lab',
  'LabSetu Central Reference Lab',
  'LAB-1001',
  true,
  'shozab64@gmail.com'
)
on conflict (id) do update set
  is_active = true,
  center_name = excluded.center_name,
  email = excluded.email;

-- 3. Ensure Authority Profile exists for shozab64@gmail.com (e1f0bc09-7826-490c-8162-fb0a69d81713)
insert into public.profiles (id, email, full_name, role)
values (
  'e1f0bc09-7826-490c-8162-fb0a69d81713',
  'shozab64@gmail.com',
  'Dr. Shozab Rizvi',
  'authority'
)
on conflict (id) do update set
  role = 'authority',
  email = 'shozab64@gmail.com',
  full_name = 'Dr. Shozab Rizvi';

-- 4. Ensure appointments table has all columns & assistant_data JSONB
alter table public.appointments add column if not exists center_id uuid references public.lab_centers(id);
alter table public.appointments add column if not exists patient_id uuid;
alter table public.appointments add column if not exists department text;
alter table public.appointments add column if not exists appointment_date text;
alter table public.appointments add column if not exists slot_start time;
alter table public.appointments add column if not exists slot_end time;
alter table public.appointments add column if not exists status text default 'booked';
alter table public.appointments add column if not exists visit_type text default 'lab_visit';
alter table public.appointments add column if not exists booking_source text default 'CENTRAL_PORTAL';
alter table public.appointments add column if not exists purpose text;
alter table public.appointments add column if not exists assistant_data jsonb default '{}'::jsonb;
alter table public.appointments add column if not exists created_at timestamptz default now();
alter table public.appointments add column if not exists updated_at timestamptz default now();

-- 5. Backfill existing appointments without center_id to Master Lab Center
update public.appointments
set center_id = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'
where center_id is null;

-- 6. Realtime publication for appointments
do $$
begin
  alter publication supabase_realtime add table public.appointments;
exception when others then null;
end $$;

-- 7. Reload schema cache for PostgREST
notify pgrst, 'reload schema';

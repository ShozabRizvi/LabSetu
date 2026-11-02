-- =====================================================================================
-- LabSetu Complete Database Schema Migration
-- File: supabase/migrations/20261102_complete_schema.sql
-- =====================================================================================
-- Run this script in your Supabase SQL Editor if you are pointing to a fresh database.
-- It creates all required tables, columns, indexes, RLS policies, and triggers.

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  display_name text,
  uhid text,
  phone text,
  role text default 'citizen',
  center_id uuid,
  is_active boolean default true,
  address text,
  gender text,
  blood_group text,
  age integer,
  emergency_contact text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists uhid text;
alter table public.profiles alter column center_id drop not null;

-- 2. PATIENTS TABLE
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  patient_code text,
  full_name text,
  phone text,
  email text,
  center_id uuid,
  is_active boolean default true,
  age_years integer,
  sex text,
  blood_group text,
  emergency_contact text,
  address text,
  notes text,
  created_at timestamptz default now()
);

-- 3. DEPENDENTS / FAMILY MEMBERS TABLE
create table if not exists public.dependents (
  id text primary key,
  primary_user_id uuid,
  full_name text,
  relation text,
  gender text,
  age integer,
  uhid text,
  blood_group text,
  created_at timestamptz default now()
);

create table if not exists public.family_members (
  id text primary key,
  primary_user_id uuid,
  full_name text,
  relation text,
  gender text,
  age integer,
  uhid text,
  blood_group text,
  created_at timestamptz default now()
);

-- 4. APPOINTMENTS TABLE
create table if not exists public.appointments (
  id text primary key default ('APT-' || floor(random() * 90000 + 10000)::text),
  center_id uuid,
  patient_id uuid,
  patient_name text,
  patient_phone text,
  patient_email text,
  uhid text,
  department text,
  appointment_date text,
  date text,
  slot text,
  time_slot text,
  status text default 'Confirmed',
  type text default 'walk_in',
  visit_type text default 'lab_visit',
  purpose text,
  notes text,
  created_at timestamptz default now()
);

-- 5. REPORTS TABLE
create table if not exists public.reports (
  id text primary key default ('REP-' || floor(random() * 90000 + 10000)::text),
  center_id uuid,
  patient_id uuid,
  patient_code text,
  uhid text,
  patient_name text,
  test_name text,
  test_type text,
  status text default 'signed',
  doctor text default 'Dr. Shozab Rizvi',
  date text default to_char(current_date, 'YYYY-MM-DD'),
  parameters jsonb default '[]'::jsonb,
  impressions text,
  critical boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 6. BILLS TABLE
create table if not exists public.bills (
  id text primary key default ('BILL-' || floor(random() * 90000 + 10000)::text),
  center_id uuid,
  patient_id uuid,
  uhid text,
  patient_name text,
  bill_number text,
  total_amount numeric default 0,
  paid_amount numeric default 0,
  due_amount numeric default 0,
  payment_status text default 'due',
  payment_mode text default 'UPI',
  date text default to_char(current_date, 'YYYY-MM-DD'),
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

-- 7. ENABLE ROW LEVEL SECURITY (RLS) WITH OPEN POLICIES FOR APP USAGE
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.dependents enable row level security;
alter table public.family_members enable row level security;
alter table public.appointments enable row level security;
alter table public.reports enable row level security;
alter table public.bills enable row level security;

-- Profiles: Allow read/write for owners & service
drop policy if exists "Public profiles read" on public.profiles;
create policy "Public profiles read" on public.profiles for select using (true);
drop policy if exists "Profiles update by owner" on public.profiles;
create policy "Profiles update by owner" on public.profiles for update using (auth.uid() = id or auth.uid() is not null);
drop policy if exists "Profiles insert" on public.profiles;
create policy "Profiles insert" on public.profiles for insert with check (true);

-- Patients: Allow authenticated/anon read & write
drop policy if exists "Patients all operations" on public.patients;
create policy "Patients all operations" on public.patients for all using (true) with check (true);

-- Dependents: Allow read & write
drop policy if exists "Dependents all operations" on public.dependents;
create policy "Dependents all operations" on public.dependents for all using (true) with check (true);

drop policy if exists "Family members all operations" on public.family_members;
create policy "Family members all operations" on public.family_members for all using (true) with check (true);

-- Appointments: Allow read & write
drop policy if exists "Appointments all operations" on public.appointments;
create policy "Appointments all operations" on public.appointments for all using (true) with check (true);

-- Reports: Allow read & write
drop policy if exists "Reports all operations" on public.reports;
create policy "Reports all operations" on public.reports for all using (true) with check (true);

-- Bills: Allow read & write
drop policy if exists "Bills all operations" on public.bills;
create policy "Bills all operations" on public.bills for all using (true) with check (true);

-- 8. TRIGGER FOR NEW AUTH SIGNUPS
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, uhid)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Patient'), 
    'UHID-' || to_char(current_date, 'YYYY') || '-' || floor(random() * (9999-1000+1) + 1000)::text
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = excluded.email,
    uhid = coalesce(profiles.uhid, excluded.uhid);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime on dashboard tables
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.bills;

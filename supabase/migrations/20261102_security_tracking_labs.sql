-- =====================================================================================
-- LabSetu Migration: Security Questions, Delivery Tracking, Geolocation Labs & Invites
-- File: supabase/migrations/20261102_security_tracking_labs.sql
-- =====================================================================================

-- 1. Security Questions columns on profiles table
alter table public.profiles add column if not exists security_question_1 text;
alter table public.profiles add column if not exists security_answer_1 text;
alter table public.profiles add column if not exists security_question_2 text;
alter table public.profiles add column if not exists security_answer_2 text;

-- 2. Delivery Tracking columns on appointments table
alter table public.appointments add column if not exists tracking_status text default 'Order Placed';
alter table public.appointments add column if not exists estimated_delivery_time text;
alter table public.appointments add column if not exists phlebotomist_details jsonb default '{
  "name": "Suresh Kumar",
  "phone": "+91 98765 43210",
  "photo": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150",
  "badge": "Vaccinated · NABL Certified"
}'::jsonb;
alter table public.appointments add column if not exists tracking_milestones jsonb default '[]'::jsonb;
alter table public.appointments add column if not exists assigned_lab_id text;
alter table public.appointments add column if not exists patient_latitude numeric;
alter table public.appointments add column if not exists patient_longitude numeric;

-- 3. Regional Labs Database for Geolocation Matching
create table if not exists public.labs (
  id text primary key,
  name text not null,
  accreditation text not null,
  nabl boolean default true,
  latitude numeric not null,
  longitude numeric not null,
  address text not null,
  city text not null,
  state text not null,
  supported_tests jsonb default '["cbc", "lipid", "thyroid", "sugar", "lft", "kft"]'::jsonb,
  rating numeric default 4.8,
  review_count text default '1,200',
  home_pickup boolean default true,
  created_at timestamptz default now()
);

-- Seed initial accredited labs
insert into public.labs (id, name, accreditation, nabl, latitude, longitude, address, city, state, supported_tests, rating, review_count, home_pickup)
values
  ('lab-central', 'LabSetu Central Reference Lab', 'NABL & ICMR Accredited (ISO 15189)', true, 28.4595, 77.0266, 'Sector 14 Healthcare Hub, Gurugram', 'Gurugram', 'Haryana', '["cbc", "lipid", "thyroid", "sugar", "lft", "kft", "hba1c"]'::jsonb, 4.9, '1,420', true),
  ('lab-maxpath', 'MaxPath Precision Laboratories', 'NABL Certified & CAP Accredited', true, 28.4721, 77.0428, 'MG Road Medical Arcade, Gurugram', 'Gurugram', 'Haryana', '["cbc", "lipid", "sugar", "thyroid", "vitd", "b12"]'::jsonb, 4.8, '890', true),
  ('lab-apex', 'Apex Clinical Diagnostics', 'NABL Accredited Category A', true, 28.5355, 77.3910, 'Sector 62 Institutional Area, Noida', 'Noida', 'Uttar Pradesh', '["cbc", "lipid", "thyroid", "sugar", "rtpcr"]'::jsonb, 4.7, '740', true),
  ('lab-delhi-south', 'Metropolis South Reference Lab', 'NABL & CAP Gold Standard', true, 28.5244, 77.2066, 'Hauz Khas Enclave, New Delhi', 'New Delhi', 'Delhi', '["cbc", "lipid", "thyroid", "sugar", "hormones"]'::jsonb, 4.9, '2,150', true)
on conflict (id) do nothing;

-- 4. Staff & Doctor Email Invitation Workflow Table
create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  role text not null, -- 'doctor' | 'employee' | 'receptionist' | 'technician'
  access_level text default 'Full Access',
  status text default 'Pending Activation', -- 'Pending Activation' | 'Active' | 'Revoked'
  invited_at timestamptz default now(),
  activated_at timestamptz
);

-- RLS policies
alter table public.labs enable row level security;
drop policy if exists "Labs readable by all" on public.labs;
create policy "Labs readable by all" on public.labs for select using (true);

alter table public.staff_invites enable row level security;
drop policy if exists "Staff invites operations" on public.staff_invites;
create policy "Staff invites operations" on public.staff_invites for all using (true) with check (true);

-- Realtime publication for tracking
alter publication supabase_realtime add table public.staff_invites;
alter publication supabase_realtime add table public.labs;

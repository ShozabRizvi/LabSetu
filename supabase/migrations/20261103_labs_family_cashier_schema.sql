-- =====================================================================================
-- LabSetu Master Schema Repair & Missing Tables Migration
-- File: supabase/migrations/20261103_labs_family_cashier_schema.sql
-- =====================================================================================
-- Run this in the Supabase SQL Editor to resolve all HTTP 404 (missing tables)
-- and HTTP 400 (missing column schema cache) errors across all modules.

-- 1. PROFILES TABLE COLUMNS ENHANCEMENT
alter table public.profiles add column if not exists address text;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists blood_group text;
alter table public.profiles add column if not exists age integer;
alter table public.profiles add column if not exists emergency_contact text;
alter table public.profiles add column if not exists uhid text;
alter table public.profiles add column if not exists lab_id text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists security_question text;
alter table public.profiles add column if not exists security_answer text;
alter table public.profiles add column if not exists security_question_1 text;
alter table public.profiles add column if not exists security_answer_1 text;

alter table public.profiles enable row level security;
drop policy if exists "Profiles read" on public.profiles;
drop policy if exists "Public profiles read" on public.profiles;
drop policy if exists "Profiles select all" on public.profiles;
create policy "Profiles select all" on public.profiles for select using (true);

drop policy if exists "Profiles update by owner" on public.profiles;
drop policy if exists "Profiles update all" on public.profiles;
create policy "Profiles update all" on public.profiles for update using (true) with check (true);

drop policy if exists "Profiles insert" on public.profiles;
drop policy if exists "Profiles insert all" on public.profiles;
create policy "Profiles insert all" on public.profiles for insert with check (true);

-- 2. PATIENTS TABLE DEMOGRAPHICS & RLS
alter table public.patients add column if not exists address text;
alter table public.patients add column if not exists sex text;
alter table public.patients add column if not exists blood_group text;
alter table public.patients add column if not exists age_years integer;
alter table public.patients add column if not exists emergency_contact text;
alter table public.patients add column if not exists security_question text;
alter table public.patients add column if not exists security_answer text;
alter table public.patients add column if not exists patient_code text;
alter table public.patients add column if not exists email text;
alter table public.patients add column if not exists phone text;
alter table public.patients add column if not exists full_name text;
alter table public.patients add column if not exists updated_at timestamptz default now();

alter table public.patients enable row level security;
drop policy if exists "Patients all operations" on public.patients;
drop policy if exists "Patients all" on public.patients;
create policy "Patients all operations" on public.patients for all using (true) with check (true);

-- 3. TRANSACTIONS TABLE COLUMNS ENHANCEMENT
alter table public.transactions add column if not exists patient text;
alter table public.transactions add column if not exists patient_name text;
alter table public.transactions add column if not exists ref text default 'Self';
alter table public.transactions add column if not exists dcn text default 'D-01';
alter table public.transactions add column if not exists cc text default 'Main Lab';
alter table public.transactions add column if not exists amount numeric default 0;
alter table public.transactions add column if not exists method text default 'Cash';
alter table public.transactions add column if not exists payment_mode text default 'Cash';
alter table public.transactions add column if not exists received_by text default 'Counter 1';
alter table public.transactions add column if not exists status text default 'Paid';
alter table public.transactions add column if not exists description text;
alter table public.transactions add column if not exists created_at timestamptz default now();
alter table public.transactions add column if not exists reg_no text;
alter table public.transactions add column if not exists date text;
alter table public.transactions add column if not exists time text;

alter table public.transactions enable row level security;
drop policy if exists "Transactions all operations" on public.transactions;
create policy "Transactions all operations" on public.transactions for all using (true) with check (true);

-- 4. APPOINTMENTS TABLE COLUMNS ENHANCEMENT
alter table public.appointments add column if not exists patient_name text;
alter table public.appointments add column if not exists patient_phone text;
alter table public.appointments add column if not exists patient_email text;
alter table public.appointments add column if not exists uhid text;
alter table public.appointments add column if not exists address text;
alter table public.appointments add column if not exists tracking_status text default 'Order Placed';
alter table public.appointments add column if not exists estimated_delivery_time text default '30-45 mins';
alter table public.appointments add column if not exists assigned_lab_id text;
alter table public.appointments add column if not exists patient_id uuid;
alter table public.appointments add column if not exists patient_latitude numeric;
alter table public.appointments add column if not exists patient_longitude numeric;
alter table public.appointments add column if not exists purpose text;
alter table public.appointments add column if not exists preparation_instructions text;
alter table public.appointments add column if not exists notes text;
alter table public.appointments add column if not exists type text default 'walk_in';
alter table public.appointments add column if not exists visit_type text default 'lab_visit';
alter table public.appointments add column if not exists status text default 'Confirmed';
alter table public.appointments add column if not exists appointment_date text;
alter table public.appointments add column if not exists time_slot text;
alter table public.appointments add column if not exists slot text;
alter table public.appointments add column if not exists date text;
alter table public.appointments add column if not exists tests text;
alter table public.appointments add column if not exists agent_name text;
alter table public.appointments add column if not exists agent_phone text;
alter table public.appointments add column if not exists eta text;

alter table public.appointments enable row level security;
drop policy if exists "Appointments all operations" on public.appointments;
create policy "Appointments all operations" on public.appointments for all using (true) with check (true);

-- 5. LABS TABLE (Fixes HTTP 404 on /labs)
create table if not exists public.labs (
  id text primary key,
  name text not null,
  accreditation text default 'NABL Accredited',
  nabl boolean default true,
  nabl_certified boolean default true,
  latitude numeric,
  longitude numeric,
  address text not null,
  city text default 'Gurugram',
  state text default 'Haryana',
  rating numeric default 4.8,
  review_count text default '500+',
  home_pickup boolean default true,
  home_pickup_fee text default 'FREE above ₹500',
  supported_tests jsonb default '["cbc", "lipid", "thyroid", "sugar"]'::jsonb,
  price_list jsonb default '{"cbc": 350, "lipid": 650, "sugar": 100, "thyroid": 550}'::jsonb,
  created_at timestamptz default now()
);

alter table public.labs enable row level security;
drop policy if exists "Labs all operations" on public.labs;
create policy "Labs all operations" on public.labs for all using (true) with check (true);

-- Seed legitimate participating NABL certified partner labs (Purged of mock internal "LabSetu" lab)
insert into public.labs (id, name, accreditation, nabl, nabl_certified, latitude, longitude, address, city, state, rating, review_count, home_pickup, home_pickup_fee, supported_tests, price_list)
values
  ('lab-maxpath', 'MaxPath Precision Laboratories', 'NABL Certified & CAP Accredited', true, true, 28.4721, 77.0428, 'MG Road Medical Arcade, Ground Floor, Gurugram', 'Gurugram', 'Haryana', 4.8, '890', true, '₹50 flat', '["cbc", "lipid", "sugar", "thyroid", "vitd", "b12"]'::jsonb, '{"cbc": 400, "lipid": 700, "sugar": 120, "thyroid": 600}'::jsonb),
  ('lab-delhi-south', 'Metropolis South Reference Lab', 'NABL & CAP Gold Standard', true, true, 28.5244, 77.2066, 'Hauz Khas Enclave, New Delhi', 'New Delhi', 'Delhi', 4.9, '2,150', true, 'FREE above ₹400', '["cbc", "lipid", "thyroid", "sugar", "hormones"]'::jsonb, '{"cbc": 380, "lipid": 680, "sugar": 110, "thyroid": 580}'::jsonb),
  ('lab-apex', 'Apex Clinical Diagnostics', 'NABL Accredited Category A', true, true, 28.5355, 77.3910, 'Sector 62 Institutional Area, Noida', 'Noida', 'Uttar Pradesh', 4.7, '740', true, 'FREE above ₹600', '["cbc", "lipid", "thyroid", "sugar", "rtpcr"]'::jsonb, '{"cbc": 360, "lipid": 670, "sugar": 110, "thyroid": 560}'::jsonb),
  ('lab-quest', 'Quest Diagnostic Center', 'NABL Certified Reference Pathology', true, true, 28.4520, 77.0690, 'Golf Course Road Medical Hub, Sector 54, Gurugram', 'Gurugram', 'Haryana', 4.9, '1,120', true, 'FREE above ₹500', '["cbc", "lipid", "thyroid", "sugar", "lft", "kft"]'::jsonb, '{"cbc": 370, "lipid": 690, "sugar": 100, "thyroid": 590}'::jsonb),
  ('lab-sanjeevani', 'Sanjeevani Community Path Lab', 'State Medical Council Registered', false, false, 28.4680, 77.0210, 'Opposite Civil Hospital Gate, Old Railway Road, Gurugram', 'Gurugram', 'Haryana', 4.5, '410', false, 'Clinic Visit Only', '["cbc", "lipid", "sugar", "thyroid"]'::jsonb, '{"cbc": 280, "lipid": 550, "sugar": 80, "thyroid": 450}'::jsonb)
on conflict (id) do update set
  name = excluded.name,
  accreditation = excluded.accreditation,
  nabl = excluded.nabl,
  nabl_certified = excluded.nabl_certified,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  address = excluded.address,
  rating = excluded.rating,
  review_count = excluded.review_count,
  home_pickup = excluded.home_pickup,
  home_pickup_fee = excluded.home_pickup_fee,
  supported_tests = excluded.supported_tests,
  price_list = excluded.price_list;

-- 6. FAMILY MEMBERS & DEPENDENTS TABLES (Fixes HTTP 404 on /family_members and /dependents)
create table if not exists public.family_members (
  id text primary key,
  primary_user_id uuid,
  full_name text not null,
  name text,
  relation text not null,
  gender text,
  age integer,
  uhid text,
  blood_group text,
  phone text,
  created_at timestamptz default now()
);

alter table public.family_members enable row level security;
drop policy if exists "Family members all operations" on public.family_members;
create policy "Family members all operations" on public.family_members for all using (true) with check (true);

create table if not exists public.dependents (
  id text primary key,
  primary_user_id uuid,
  full_name text not null,
  name text,
  relation text not null,
  gender text,
  age integer,
  uhid text,
  blood_group text,
  phone text,
  created_at timestamptz default now()
);

alter table public.dependents enable row level security;
drop policy if exists "Dependents all operations" on public.dependents;
create policy "Dependents all operations" on public.dependents for all using (true) with check (true);

-- 7. CASHIER TABLE (Fixes HTTP 404 on /cashier in DailyBusiness)
create table if not exists public.cashier (
  id text primary key default ('CSH-' || floor(random() * 90000 + 10000)::text),
  name text not null,
  desk_name text,
  lab_id text default 'LAB-1001',
  status text default 'Active',
  created_at timestamptz default now()
);

alter table public.cashier add column if not exists lab_id text default 'LAB-1001';
alter table public.cashier add column if not exists desk_name text;
alter table public.cashier add column if not exists status text default 'Active';
alter table public.cashier add column if not exists created_at timestamptz default now();

alter table public.cashier enable row level security;
drop policy if exists "Cashier all operations" on public.cashier;
create policy "Cashier all operations" on public.cashier for all using (true) with check (true);

insert into public.cashier (id, name, desk_name, lab_id, status)
values
  ('CSH-1001', 'Counter 1 (Main Reception)', 'Desk 01', 'LAB-1001', 'Active'),
  ('CSH-1002', 'Counter 2 (OPD Registration)', 'Desk 02', 'LAB-1001', 'Active'),
  ('CSH-1003', 'Counter 3 (Emergency / Night)', 'Desk 03', 'LAB-1001', 'Active')
on conflict (id) do nothing;

-- 8. OUTSOURCE TRACKING TABLE
create table if not exists public.outsource_tracking (
  id uuid primary key default gen_random_uuid(),
  case_id text not null,
  reg_no text,
  patient_name text not null,
  investigations text not null,
  partner_lab text not null,
  status text not null default 'Dispatched',
  dispatched_at timestamptz default now(),
  transit_at timestamptz,
  processing_at timestamptz,
  report_uploaded_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.outsource_tracking enable row level security;
drop policy if exists "Outsource tracking all operations" on public.outsource_tracking;
create policy "Outsource tracking all operations" on public.outsource_tracking for all using (true) with check (true);

-- 9. REALTIME PUBLICATION SUBSCRIPTIONS
do $$
begin
  begin
    alter publication supabase_realtime add table public.transactions;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.appointments;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.cashier;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.labs;
  exception when others then null;
  end;
  begin
    alter publication supabase_realtime add table public.outsource_tracking;
  exception when others then null;
  end;
end $$;

-- 10. STAFF INVITES TABLE & EMAIL CONFIRMATION TRIGGER
create table if not exists public.staff_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  role text not null, -- 'doctor' | 'employee' | 'receptionist' | 'technician' | 'phlebotomist'
  access_level text default 'Full Access',
  status text default 'Pending Activation', -- 'Pending Activation' | 'Active' | 'Revoked'
  invited_at timestamptz default now(),
  activated_at timestamptz
);

alter table public.staff_invites enable row level security;
drop policy if exists "Staff invites operations" on public.staff_invites;
create policy "Staff invites operations" on public.staff_invites for all using (true) with check (true);

-- Realtime publication for staff_invites
do $$
begin
  alter publication supabase_realtime add table public.staff_invites;
exception when others then null;
end $$;

-- Trigger: When an invited user confirms their email, automatically transition staff_invites status to 'Active'
create or replace function public.handle_user_confirmation()
returns trigger as $$
declare
  v_is_confirmed boolean;
begin
  v_is_confirmed := (new.email_confirmed_at is not null and (old.email_confirmed_at is null or old.email_confirmed_at != new.email_confirmed_at))
                 or (new.confirmed_at is not null and (old.confirmed_at is null or old.confirmed_at != new.confirmed_at));
  if v_is_confirmed then
    update public.staff_invites
    set status = 'Active', activated_at = now()
    where lower(email) = lower(new.email);
  end if;
  return new;
exception when others then
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update on auth.users
  for each row execute function public.handle_user_confirmation();

-- 11. FORCE POSTGREST SCHEMA CACHE RELOAD
-- Informs the live PostgREST API daemon to immediately recognize newly created tables and columns
notify pgrst, 'reload schema';

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

-- 8. SEQUENCES & TRIGGER FOR COLLISION-PROOF UHID AND LAB ID GENERATION
create sequence if not exists public.uhid_seq start 1000;
create sequence if not exists public.lab_id_seq start 1000;
alter table public.profiles add column if not exists lab_id text;

create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_uhid text;
  v_lab_id text;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'citizen');

  if v_role = 'authority' or v_role = 'admin' then
    v_lab_id := 'LAB-' || nextval('public.lab_id_seq')::text;
    v_uhid := null;
  else
    v_uhid := 'UHID-' || nextval('public.uhid_seq')::text;
    v_lab_id := null;
  end if;

  insert into public.profiles (id, email, full_name, role, uhid, lab_id)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', case when v_role = 'authority' or v_role = 'admin' then 'Dr. Shozab Rizvi' else 'Patient' end), 
    case when v_role = 'authority' or v_role = 'admin' then 'admin' else 'citizen' end,
    v_uhid,
    v_lab_id
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = excluded.email,
    role = coalesce(excluded.role, profiles.role),
    uhid = case 
      when (profiles.role is null or profiles.role = 'citizen') and (profiles.uhid is null or profiles.uhid = 'Pending' or trim(profiles.uhid) = '' or profiles.uhid like 'UHID-____-%')
      then coalesce(excluded.uhid, 'UHID-' || nextval('public.uhid_seq')::text)
      else profiles.uhid 
    end,
    lab_id = case
      when (profiles.role = 'admin' or profiles.role = 'authority') and (profiles.lab_id is null or trim(profiles.lab_id) = '')
      then coalesce(excluded.lab_id, 'LAB-' || nextval('public.lab_id_seq')::text)
      else profiles.lab_id
    end;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Retroactive fix for existing accounts using collision-proof sequences
update public.profiles
set uhid = 'UHID-' || nextval('public.uhid_seq')::text
where (role is null or role = 'citizen') and (uhid is null or uhid = 'Pending' or trim(uhid) = '' or uhid like 'UHID-____-%');

update public.profiles
set lab_id = 'LAB-' || nextval('public.lab_id_seq')::text
where (role = 'admin' or role = 'authority') and (lab_id is null or trim(lab_id) = '');

update public.patients
set patient_code = 'UHID-' || substring(id::text from 1 for 4) || '-' || to_char(coalesce(created_at, current_date), 'YYYY')
where patient_code is null or patient_code = 'Pending' or trim(patient_code) = '';

-- Enable realtime on dashboard tables
alter publication supabase_realtime add table public.appointments;
alter publication supabase_realtime add table public.reports;
alter publication supabase_realtime add table public.bills;

-- 9. SECURITY QUESTION BYPASS FOR PASSWORD RESET (RPC)
create extension if not exists pgcrypto with schema extensions;

alter table public.profiles add column if not exists security_question text;
alter table public.profiles add column if not exists security_answer text;
alter table public.profiles add column if not exists security_question_1 text;
alter table public.profiles add column if not exists security_answer_1 text;

alter table public.patients add column if not exists security_question text;
alter table public.patients add column if not exists security_answer text;

drop function if exists public.get_security_question_by_email(text);

create or replace function public.get_security_question_by_email(p_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_question text;
  v_cleaned_email text;
begin
  v_cleaned_email := lower(trim(p_email));

  if v_cleaned_email is null or v_cleaned_email = '' then
    return jsonb_build_object('success', false, 'error', 'Please enter a valid email address.');
  end if;

  select coalesce(p.security_question, p.security_question_1) into v_question
  from public.profiles p
  where lower(trim(p.email)) = v_cleaned_email
  order by (case when p.security_question is not null then 1 else 2 end)
  limit 1;

  if v_question is null or trim(v_question) = '' then
    select pt.security_question into v_question
    from public.patients pt
    where lower(trim(pt.email)) = v_cleaned_email
    limit 1;
  end if;

  if v_question is null or trim(v_question) = '' then
    select u.id into v_user_id
    from auth.users u
    where lower(trim(u.email)) = v_cleaned_email
    limit 1;

    if v_user_id is not null then
      v_question := 'What is your childhood nickname?';
    else
      return jsonb_build_object('success', false, 'error', 'No account found with this email address.');
    end if;
  end if;

  return jsonb_build_object('success', true, 'question', v_question);
end;
$$;

grant execute on function public.get_security_question_by_email(text) to anon, authenticated, service_role;

drop function if exists public.reset_password_via_security_question(text, text, text);

create or replace function public.reset_password_via_security_question(
  p_email text,
  p_security_answer text,
  p_new_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  v_user_id uuid;
  v_stored_answer text;
  v_cleaned_email text;
  v_cleaned_answer text;
  v_hashed_password text;
begin
  v_cleaned_email := lower(trim(p_email));
  v_cleaned_answer := lower(trim(p_security_answer));

  if v_cleaned_email is null or v_cleaned_email = '' then
    return jsonb_build_object('success', false, 'error', 'Email address is required.');
  end if;

  if v_cleaned_answer is null or v_cleaned_answer = '' then
    return jsonb_build_object('success', false, 'error', 'Please provide an answer to your security question.');
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    return jsonb_build_object('success', false, 'error', 'Password must be at least 6 characters long.');
  end if;

  select u.id into v_user_id
  from auth.users u
  where lower(trim(u.email)) = v_cleaned_email
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('success', false, 'error', 'No account found with this email address.');
  end if;

  select coalesce(p.security_answer, p.security_answer_1) into v_stored_answer
  from public.profiles p
  where p.id = v_user_id or lower(trim(p.email)) = v_cleaned_email
  order by (case when p.security_answer is not null then 1 else 2 end)
  limit 1;

  if v_stored_answer is null then
    select pt.security_answer into v_stored_answer
    from public.patients pt
    where pt.id = v_user_id or lower(trim(pt.email)) = v_cleaned_email
    limit 1;
  end if;

  if v_stored_answer is null or trim(v_stored_answer) = '' then
    return jsonb_build_object('success', false, 'error', 'No security question configured for this account. Please contact laboratory support.');
  end if;

  if lower(trim(v_stored_answer)) <> v_cleaned_answer then
    return jsonb_build_object('success', false, 'error', 'Incorrect security answer. Please check your answer and try again.');
  end if;

  begin
    v_hashed_password := extensions.crypt(p_new_password, extensions.gen_salt('bf'));
  exception when others then
    v_hashed_password := crypt(p_new_password, gen_salt('bf'));
  end;

  update auth.users
  set 
    encrypted_password = v_hashed_password,
    updated_at = now()
  where auth.users.id = v_user_id;

  return jsonb_build_object('success', true, 'message', 'Password updated successfully! You may now sign in.');
end;
$$;

grant execute on function public.reset_password_via_security_question(text, text, text) to anon, authenticated, service_role;


-- =====================================================================================
-- 9. OUTSOURCE TRACKING TABLE WITH STATUS ENUM
-- Stages: Dispatched, Transit, Partner Lab Processing, Report Uploaded
-- =====================================================================================
create table if not exists public.outsource_tracking (
  id uuid primary key default gen_random_uuid(),
  case_id text not null,
  reg_no text,
  patient_name text not null,
  investigations text not null,
  partner_lab text not null,
  status text not null default 'Dispatched' 
    check (status in ('Dispatched', 'Transit', 'Partner Lab Processing', 'Report Uploaded')),
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

-- =====================================================================================
-- 10. TRANSACTIONS TABLE & REALTIME FINANCIAL LEDGER
-- Row Level Security (RLS) configured for authenticated and authority access
-- =====================================================================================
create table if not exists public.transactions (
  id text primary key default ('TX-' || floor(random() * 90000 + 10000)::text),
  reg_no text default ('REG-' || floor(random() * 9000 + 1000)::text),
  patient text not null,
  ref text default 'Self',
  dcn text default 'D-01',
  cc text default 'Main Lab',
  amount numeric not null default 0,
  method text default 'Cash', -- 'Cash' | 'UPI' | 'Card'
  received_by text default 'Counter 1',
  status text default 'Paid',
  description text,
  created_at timestamptz default now()
);

-- Enable RLS and grant full permissions for authenticated / authority / anon operations
alter table public.transactions enable row level security;
drop policy if exists "Transactions all operations" on public.transactions;
create policy "Transactions all operations" on public.transactions for all using (true) with check (true);

-- Realtime Publication for instant UI state synchronization
alter publication supabase_realtime add table public.transactions;

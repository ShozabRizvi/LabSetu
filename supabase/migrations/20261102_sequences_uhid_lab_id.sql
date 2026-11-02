-- =====================================================================================
-- LabSetu Migration: Sequence-Backed Collision-Proof UHID & Lab ID Generation
-- File: supabase/migrations/20261102_sequences_uhid_lab_id.sql
-- =====================================================================================

-- 1. Create custom Postgres Sequences starting at 1000
create sequence if not exists public.uhid_seq start 1000;
create sequence if not exists public.lab_id_seq start 1000;

-- 2. Ensure columns and constraints exist on profiles table
alter table public.profiles add column if not exists uhid text;
alter table public.profiles add column if not exists lab_id text;
alter table public.profiles alter column center_id drop not null;
alter table public.patients add column if not exists patient_code text;

-- Add unique constraint on lab_id if not present
do $$
begin
  if not exists (
    select 1 from pg_constraint 
    where conname = 'profiles_lab_id_unique' and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles add constraint profiles_lab_id_unique unique (lab_id);
  end if;
exception when others then
  null;
end $$;

-- 3. Update the handle_new_user() trigger function
-- Logic: Assign sequence-backed UHID-XXXX for citizens and LAB-XXXX for authority/admin
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

-- 4. Re-bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. Retroactively update existing accounts to sequence-backed numbers
update public.profiles
set uhid = 'UHID-' || nextval('public.uhid_seq')::text
where (role is null or role = 'citizen') and (uhid is null or uhid = 'Pending' or trim(uhid) = '' or uhid like 'UHID-____-%');

update public.profiles
set lab_id = 'LAB-' || nextval('public.lab_id_seq')::text
where (role = 'admin' or role = 'authority') and (lab_id is null or trim(lab_id) = '');

-- Synchronize patients table
update public.patients
set patient_code = 'UHID-' || nextval('public.uhid_seq')::text
where patient_code is null or patient_code = 'Pending' or trim(patient_code) = '' or patient_code like 'UHID-____-%';


-- =====================================================================================
-- 6. OUTSOURCE TRACKING TABLE WITH STATUS ENUM
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

-- Seed initial test cases if empty
insert into public.outsource_tracking (case_id, reg_no, patient_name, investigations, partner_lab, status, dispatched_at, transit_at)
values
  ('OUT-101', 'REG-1048', 'Deepak Chopra', 'Biopsy / Histopathology (Large Specimen)', 'Metropolis Reference Lab', 'Transit', now() - interval '2 days', now() - interval '1 day'),
  ('OUT-102', 'REG-1042', 'Pooja Bhatt', 'Karyotyping Genetic Scan', 'Oncquest Central Lab', 'Partner Lab Processing', now() - interval '3 days', now() - interval '2 days'),
  ('OUT-103', 'REG-1036', 'Rahul Saxena', 'Autoimmune Profile (ANA Blot 17)', 'Lal PathLabs Reference', 'Report Uploaded', now() - interval '5 days', now() - interval '4 days')
on conflict do nothing;

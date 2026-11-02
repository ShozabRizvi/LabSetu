-- =====================================================================================
-- LabSetu Migration: UHID Generation from Auth UID Prefix & Retroactive Ghost Fix
-- File: supabase/migrations/20261102_uhid_trigger_uid_prefix.sql
-- =====================================================================================

-- 1. Ensure columns exist on profiles and patients tables
alter table public.profiles add column if not exists uhid text;
alter table public.profiles alter column center_id drop not null;
alter table public.patients add column if not exists patient_code text;

-- 2. Update the handle_new_user() trigger function
-- Logic: Extract the first 4 characters of auth.users.id (UUID) and format as UHID-<4-char-uid>-YYYY
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, uhid)
  values (
    new.id, 
    new.email, 
    coalesce(new.raw_user_meta_data->>'full_name', 'Patient'), 
    'UHID-' || substring(new.id::text from 1 for 4) || '-' || to_char(current_date, 'YYYY')
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, profiles.full_name),
    email = excluded.email,
    uhid = case 
      when profiles.uhid is null or profiles.uhid = 'Pending' or trim(profiles.uhid) = '' 
      then excluded.uhid 
      else profiles.uhid 
    end;
  return new;
end;
$$ language plpgsql security definer;

-- 3. Re-bind trigger to auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. One-Time Retroactive SQL Update for Existing Ghost/Test Accounts (e.g. rshozab64@gmail.com)
update public.profiles
set uhid = 'UHID-' || substring(id::text from 1 for 4) || '-' || to_char(coalesce(created_at, current_date), 'YYYY')
where uhid is null or uhid = 'Pending' or trim(uhid) = '';

-- 5. Synchronize existing patients table records where patient_code is missing
update public.patients
set patient_code = 'UHID-' || substring(id::text from 1 for 4) || '-' || to_char(coalesce(created_at, current_date), 'YYYY')
where patient_code is null or patient_code = 'Pending' or trim(patient_code) = '';

-- 6. Verification query to confirm zero remaining 'Pending' or null UHIDs
-- select id, email, full_name, uhid, role from public.profiles order by created_at desc;

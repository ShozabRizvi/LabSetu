-- =====================================================================================
-- LabSetu Migration: Automate Unique UHID & Profile Assignment on Sign-up
-- File: supabase/migrations/20261102_handle_new_user.sql
-- =====================================================================================

-- 1. Ensure profiles table supports UHID column and does not enforce center_id for citizens
alter table public.profiles add column if not exists uhid text;
alter table public.profiles alter column center_id drop not null;

-- 2. Trigger Function: Automatically insert profile with unique UHID using first 4 chars of Auth UID
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

-- 3. Trigger: Automatically invoke handle_new_user on every new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4. Retroactive fix for existing accounts with null, empty, or 'Pending' UHID
update public.profiles
set uhid = 'UHID-' || substring(id::text from 1 for 4) || '-' || to_char(coalesce(created_at, current_date), 'YYYY')
where uhid is null or uhid = 'Pending' or trim(uhid) = '';

-- Also synchronize public.patients table for existing accounts
update public.patients
set patient_code = 'UHID-' || substring(id::text from 1 for 4) || '-' || to_char(coalesce(created_at, current_date), 'YYYY')
where patient_code is null or patient_code = 'Pending' or trim(patient_code) = '';

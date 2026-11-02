-- =====================================================================================
-- LabSetu Migration: Automate Unique UHID & Profile Assignment on Sign-up
-- File: supabase/migrations/20261102_handle_new_user.sql
-- =====================================================================================

-- 1. Ensure profiles table supports UHID column and does not enforce center_id for citizens
alter table public.profiles add column if not exists uhid text;
alter table public.profiles alter column center_id drop not null;

-- 2. Trigger Function: Automatically insert profile with unique UHID and full_name
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

-- 3. Trigger: Automatically invoke handle_new_user on every new user registration
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

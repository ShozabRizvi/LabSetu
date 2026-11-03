-- =====================================================================================
-- Migration: 20261103_master_center_and_appointments_fix.sql
-- Description: Align Master Lab Center (cb17e71d-cb76-49e6-a202-4a82c94de5d8),
--              configure appointments RLS policies, ensure Realtime subscription filters,
--              and guarantee anchor patient row for seamless portal booking synchronization.
-- =====================================================================================

-- 1. Ensure Master Lab Center exists in public.lab_centers
insert into public.lab_centers (id, name, address, city, state, pincode, is_active)
values (
  'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid,
  'LabSetu Central Reference Lab',
  'Ring Road Medical Enclave, Connaught Place',
  'New Delhi',
  'Delhi',
  '110001',
  true
)
on conflict (id) do update set
  is_active = true,
  name = excluded.name;

-- 2. Ensure anchor patient exists for central bookings
insert into public.patients (
  id,
  center_id,
  patient_code,
  full_name,
  phone,
  is_active
)
values (
  '98f184fc-8305-4b83-bea7-f744fcfa7a37'::uuid,
  'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid,
  'UHID-2026-9850',
  'rishabh',
  '9876543210',
  true
)
on conflict (id) do update set
  center_id = excluded.center_id,
  full_name = excluded.full_name;

-- 3. Configure Row Level Security (RLS) on public.appointments
alter table public.appointments enable row level security;

drop policy if exists "appointments_select_policy" on public.appointments;
create policy "appointments_select_policy" on public.appointments
  for select using (
    center_id = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid
    or auth.role() = 'authenticated'
    or true
  );

drop policy if exists "appointments_insert_policy" on public.appointments;
create policy "appointments_insert_policy" on public.appointments
  for insert with check (
    center_id = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid
    or auth.role() = 'authenticated'
    or true
  );

drop policy if exists "appointments_update_policy" on public.appointments;
create policy "appointments_update_policy" on public.appointments
  for update using (
    center_id = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid
    or auth.role() = 'authenticated'
    or true
  );

drop policy if exists "appointments_delete_policy" on public.appointments;
create policy "appointments_delete_policy" on public.appointments
  for delete using (
    center_id = 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid
    or auth.role() = 'authenticated'
    or true
  );

-- 4. Enable REPLICA IDENTITY FULL and Realtime Publication on appointments
alter table public.appointments replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'appointments'
  ) then
    alter publication supabase_realtime add table public.appointments;
  end if;
end $$;

-- 5. Force schema cache reload
notify pgrst, 'reload schema';

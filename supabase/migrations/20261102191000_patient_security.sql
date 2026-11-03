-- Additive security repair. Apply after the existing schema and agentic workflow migration.
-- Privileges come only from administrator-managed app_metadata, never user_metadata.
begin;

create or replace function public.assistant_staff_scope(center uuid)
returns boolean language sql stable security invoker set search_path = public
as $$ select coalesce(auth.jwt()->'app_metadata'->>'role' in ('authority','admin','staff')
  and auth.jwt()->'app_metadata'->>'lab_id' = center::text, false) $$;

-- Remove all permissive legacy policies, including policies from previous deployments.
do $$ declare item record; begin
  for item in select schemaname, tablename, policyname from pg_policies
    where schemaname='public' and tablename in ('profiles','patients','appointments','reports','bills','dependents','family_members')
  loop execute format('drop policy %I on %I.%I', item.policyname,item.schemaname,item.tablename); end loop;
end $$;

revoke all on public.profiles,public.patients,public.appointments,public.reports,public.bills,public.dependents,public.family_members from anon;
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.reports enable row level security;
alter table public.bills enable row level security;
alter table public.dependents enable row level security;
alter table public.family_members enable row level security;

create policy profiles_read on public.profiles for select to authenticated using (id=auth.uid() or public.assistant_staff_scope(center_id));
create policy profiles_update on public.profiles for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
-- No client may assign staff privileges, laboratory scope, identity or UHID.
revoke insert,update,delete on public.profiles from authenticated;
grant update(full_name,display_name,phone,address,gender,blood_group,age,emergency_contact) on public.profiles to authenticated;

create policy patients_read on public.patients for select to authenticated using (id=auth.uid() or public.assistant_staff_scope(center_id));
create policy patients_insert on public.patients for insert to authenticated with check (id=auth.uid() and center_id is null);
create policy patients_update on public.patients for update to authenticated using (id=auth.uid()) with check (id=auth.uid());
revoke update,delete on public.patients from authenticated;
grant update(full_name,phone,address,blood_group,emergency_contact) on public.patients to authenticated;

create policy appointments_read on public.appointments for select to authenticated using (patient_id=auth.uid() or public.assistant_staff_scope(center_id));
create policy bills_read on public.bills for select to authenticated using (patient_id=auth.uid() or public.assistant_staff_scope(center_id));
-- Patient report content, including legacy records, must pass the authenticated API approval/payment gate.
create policy reports_staff_read on public.reports for select to authenticated using (public.assistant_staff_scope(center_id));
-- Managed records are written exclusively by backend transactions; legacy staff forms remain scoped.
create policy appointments_staff_legacy on public.appointments for all to authenticated using (assistant_data is null and public.assistant_staff_scope(center_id)) with check (assistant_data is null and public.assistant_staff_scope(center_id));
create policy bills_staff_legacy on public.bills for all to authenticated using (assistant_data is null and public.assistant_staff_scope(center_id)) with check (assistant_data is null and public.assistant_staff_scope(center_id));
create policy reports_staff_legacy on public.reports for all to authenticated using (assistant_data is null and public.assistant_staff_scope(center_id)) with check (assistant_data is null and public.assistant_staff_scope(center_id));
create policy dependents_owner on public.dependents for all to authenticated using (primary_user_id=auth.uid()) with check (primary_user_id=auth.uid());
create policy family_owner on public.family_members for all to authenticated using (primary_user_id=auth.uid()) with check (primary_user_id=auth.uid());

-- The sign-up trigger assigns patient defaults; staff provisioning is an administrator operation.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id,email,full_name,uhid,role)
  values(new.id,new.email,coalesce(new.raw_user_meta_data->>'full_name','Patient'),
    'UHID-'||to_char(current_date,'YYYY')||'-'||replace(new.id::text,'-',''),'citizen')
  on conflict(id) do nothing;
  return new;
end $$;

commit;

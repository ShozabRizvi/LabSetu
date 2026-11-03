-- The legacy patient support/preferences UI already uses these resource names.
-- This adds private persistence without granting doctor access or creating clinical consent claims.
begin;

create table if not exists public.labsetu_support_tickets (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null default 'General' check (char_length(category) between 1 and 100),
  subject text not null check (char_length(subject) between 1 and 300),
  description text not null default '' check (char_length(description) <= 4000),
  status text not null default 'open' check (status in ('open','in_progress','resolved','closed')),
  response text check (char_length(response) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_owner_created on public.labsetu_support_tickets(user_id,created_at desc);

create table if not exists public.labsetu_privacy_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  check (id=user_id),
  check (jsonb_typeof(settings)='object'),
  check ((settings - array['smsAlerts','whatsappAlerts','shareWithTreatingDoctor','anonymousResearchConsent'])='{}'::jsonb),
  check (not (settings ? 'smsAlerts') or jsonb_typeof(settings->'smsAlerts')='boolean'),
  check (not (settings ? 'whatsappAlerts') or jsonb_typeof(settings->'whatsappAlerts')='boolean'),
  check (not (settings ? 'shareWithTreatingDoctor') or jsonb_typeof(settings->'shareWithTreatingDoctor')='boolean'),
  check (not (settings ? 'anonymousResearchConsent') or jsonb_typeof(settings->'anonymousResearchConsent')='boolean')
);

alter table public.labsetu_support_tickets enable row level security;
alter table public.labsetu_privacy_settings enable row level security;
revoke all on public.labsetu_support_tickets,public.labsetu_privacy_settings from anon;
grant select,insert,update,delete on public.labsetu_support_tickets,public.labsetu_privacy_settings to authenticated;

do $$ declare item record; begin
  for item in select schemaname,tablename,policyname from pg_policies
    where schemaname='public' and tablename in ('labsetu_support_tickets','labsetu_privacy_settings')
  loop execute format('drop policy %I on %I.%I',item.policyname,item.schemaname,item.tablename); end loop;
end $$;

create policy support_owner on public.labsetu_support_tickets for all to authenticated
  using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy privacy_owner on public.labsetu_privacy_settings for all to authenticated
  using (user_id=auth.uid() and id=auth.uid()) with check (user_id=auth.uid() and id=auth.uid());

-- Patient sync can submit a question, but cannot manufacture a staff reply or resolution.
create or replace function public.guard_patient_support_ticket()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
  if current_user='authenticated' then
    if tg_op='INSERT' then
      if new.status <> 'open' or new.response is not null then
        raise exception 'Only staff can resolve or respond to support tickets.' using errcode='42501';
      end if;
      new.created_at=now();
    elsif new.id is distinct from old.id or new.user_id is distinct from old.user_id
      or new.status is distinct from old.status or new.response is distinct from old.response then
      raise exception 'Protected support ticket fields cannot be changed.' using errcode='42501';
    else new.created_at=old.created_at;
    end if;
  end if;
  new.updated_at=now();
  return new;
end $$;
drop trigger if exists patient_support_ticket_guard on public.labsetu_support_tickets;
create trigger patient_support_ticket_guard before insert or update on public.labsetu_support_tickets
  for each row execute function public.guard_patient_support_ticket();

comment on column public.labsetu_privacy_settings.settings is
  'Notification and consent preferences only. These values do not grant access to protected reports or authorise a physician.';
commit;

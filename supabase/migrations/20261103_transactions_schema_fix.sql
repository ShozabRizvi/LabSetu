-- =====================================================================================
-- Migration: 20261103_transactions_schema_fix.sql
-- Description: Permanently resolve HTTP 400 Bad Request on transactions table queries,
--              add missing columns, configure RLS policies, enable Supabase Realtime,
--              and provide tables for staff_invites and outsource_tracking.
-- =====================================================================================

-- 1. Ensure public.transactions has all required columns
create table if not exists public.transactions (
  id text primary key default ('TX-' || floor(random() * 90000 + 10000)::text),
  center_id uuid default 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid,
  amount numeric not null default 0,
  payment_mode text default 'Cash',
  created_at timestamptz default now()
);

-- Add all missing columns idempotently
alter table public.transactions add column if not exists created_at timestamptz default now();
alter table public.transactions add column if not exists reg_no text default ('REG-' || floor(random() * 9000 + 1000)::text);
alter table public.transactions add column if not exists patient text default 'Walk-in Patient';
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
alter table public.transactions add column if not exists date text default to_char(current_date, 'YYYY-MM-DD');
alter table public.transactions add column if not exists time text default to_char(now(), 'HH24:MI');
alter table public.transactions add column if not exists center_id uuid default 'cb17e71d-cb76-49e6-a202-4a82c94de5d8'::uuid;
alter table public.transactions add column if not exists bill_id text;
alter table public.transactions add column if not exists created_by uuid;

-- 2. Configure Row Level Security (RLS) for public.transactions
alter table public.transactions enable row level security;

drop policy if exists "Transactions select policy" on public.transactions;
create policy "Transactions select policy" on public.transactions 
  for select using (true);

drop policy if exists "Transactions insert policy" on public.transactions;
create policy "Transactions insert policy" on public.transactions 
  for insert with check (true);

drop policy if exists "Transactions update policy" on public.transactions;
create policy "Transactions update policy" on public.transactions 
  for update using (true);

drop policy if exists "Transactions delete policy" on public.transactions;
create policy "Transactions delete policy" on public.transactions 
  for delete using (true);

-- 3. Add public.transactions to Supabase Realtime publication
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'transactions'
  ) then
    alter publication supabase_realtime add table public.transactions;
  end if;
end $$;

-- 4. Create public.staff_invites to prevent 404 on employee / doctor invitation management
create table if not exists public.staff_invites (
  id text primary key default ('inv-' || floor(random() * 90000 + 10000)::text),
  name text not null,
  email text not null,
  role text not null default 'receptionist',
  access_level text default 'Standard',
  status text default 'Pending Activation',
  invited_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table public.staff_invites enable row level security;
drop policy if exists "staff_invites_all" on public.staff_invites;
create policy "staff_invites_all" on public.staff_invites for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'staff_invites'
  ) then
    alter publication supabase_realtime add table public.staff_invites;
  end if;
end $$;

-- 5. Create public.outsource_tracking to prevent 404 on B2B outsourcing
create table if not exists public.outsource_tracking (
  id uuid primary key default gen_random_uuid(),
  case_id text,
  reg_no text,
  patient_name text,
  investigations text,
  partner_lab text,
  status text default 'Dispatched',
  dispatched_at timestamptz default now(),
  transit_at timestamptz,
  processing_at timestamptz,
  report_uploaded_at timestamptz,
  created_at timestamptz default now()
);

alter table public.outsource_tracking enable row level security;
drop policy if exists "outsource_tracking_all" on public.outsource_tracking;
create policy "outsource_tracking_all" on public.outsource_tracking for all using (true) with check (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'outsource_tracking'
  ) then
    alter publication supabase_realtime add table public.outsource_tracking;
  end if;
end $$;

-- 6. Reload PostgREST schema cache
notify pgrst, 'reload schema';

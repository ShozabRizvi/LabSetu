-- =====================================================================================
-- LabSetu Migration: Transactions Table & Realtime Ledger
-- File: supabase/migrations/20261102_transactions_schema.sql
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

-- Seed initial transactions for current calendar day
insert into public.transactions (id, reg_no, patient, ref, dcn, cc, amount, method, received_by, status, description, created_at)
values
  ('TX-2041', 'REG-1049', 'Riya Sharma', 'Self', 'D-01', 'Main Lab', 850, 'UPI', 'Counter 1 (Main Reception)', 'Paid', 'Complete Blood Count (CBC)', now()),
  ('TX-2040', 'REG-1050', 'Aarav Singh', 'Dr. Smith', 'D-01', 'Main Lab', 600, 'Cash', 'Counter 1 (Main Reception)', 'Paid', 'Lipid Profile', now() - interval '1 hour'),
  ('TX-2039', 'REG-1051', 'Meera Verma', 'Dr. Jones', 'D-02', 'Branch A', 250, 'Card', 'Counter 2', 'Paid', 'Fasting Blood Sugar', now() - interval '2 hours')
on conflict (id) do nothing;

-- Enable RLS
alter table public.transactions enable row level security;
drop policy if exists "Transactions all operations" on public.transactions;
create policy "Transactions all operations" on public.transactions for all using (true) with check (true);

-- Realtime Publication for instant UI state synchronization
alter publication supabase_realtime add table public.transactions;

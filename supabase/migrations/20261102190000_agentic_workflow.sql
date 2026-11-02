-- Additive assistant integration. Existing appointments, bills and reports remain canonical.
-- Apply after 20261102_complete_schema.sql. No demonstration data is inserted here.
BEGIN;

CREATE TABLE IF NOT EXISTS public.assistant_tests (
  id text PRIMARY KEY,
  lab_id text NOT NULL,
  price_paise bigint NOT NULL CHECK (price_paise > 0),
  assistant_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (assistant_data->>'id' = id),
  CHECK (assistant_data->>'currency' = 'INR'),
  CHECK ((assistant_data->>'pricePaise')::bigint = price_paise)
);
CREATE TABLE IF NOT EXISTS public.assistant_slots (
  id text PRIMARY KEY,
  lab_id text NOT NULL,
  starts_at timestamptz NOT NULL,
  capacity integer NOT NULL CHECK (capacity BETWEEN 1 AND 1000),
  assistant_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lab_id, starts_at),
  CHECK (assistant_data->>'id' = id)
);

ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assistant_data jsonb;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assistant_patient_key text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assistant_lab_id text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assistant_slot_id text REFERENCES public.assistant_slots(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS assistant_idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS assistant_booking_idempotency ON public.appointments(assistant_patient_key,assistant_idempotency_key) WHERE assistant_data IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS assistant_patient_active_slot ON public.appointments(assistant_patient_key,assistant_slot_id) WHERE assistant_data IS NOT NULL AND status <> 'cancelled';
CREATE INDEX IF NOT EXISTS assistant_patient_appointments ON public.appointments(assistant_patient_key) WHERE assistant_data IS NOT NULL;
CREATE INDEX IF NOT EXISTS assistant_laboratory_appointments ON public.appointments(assistant_lab_id) WHERE assistant_data IS NOT NULL;

ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS assistant_data jsonb;
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS assistant_booking_id text REFERENCES public.appointments(id);
ALTER TABLE public.bills ADD COLUMN IF NOT EXISTS assistant_patient_key text;
CREATE UNIQUE INDEX IF NOT EXISTS assistant_invoice_per_booking ON public.bills(assistant_booking_id) WHERE assistant_booking_id IS NOT NULL;

ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assistant_data jsonb;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assistant_booking_id text REFERENCES public.appointments(id);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assistant_patient_key text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assistant_approved_by text;
CREATE UNIQUE INDEX IF NOT EXISTS assistant_report_per_booking ON public.reports(assistant_booking_id) WHERE assistant_booking_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.assistant_samples (
  booking_id text PRIMARY KEY REFERENCES public.appointments(id),
  status text NOT NULL CHECK (status IN ('awaiting_collection','collected','processing','processing_complete')),
  assistant_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.assistant_payments (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.bills(id),
  order_id text UNIQUE,
  status text NOT NULL CHECK (status IN ('creating','created','pending','authorized','captured','paid','failed','cancelled','creation_failed','reconciliation_required')),
  assistant_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS assistant_one_captured_payment ON public.assistant_payments(invoice_id) WHERE status IN ('captured','paid');
CREATE TABLE IF NOT EXISTS public.assistant_receipts (
  id text PRIMARY KEY,
  invoice_id text NOT NULL UNIQUE REFERENCES public.bills(id),
  payment_id text NOT NULL UNIQUE REFERENCES public.assistant_payments(id),
  assistant_data jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Nonclinical orchestration records: metadata and secure upload locations, not uploaded binary content.
CREATE TABLE IF NOT EXISTS public.assistant_records (
  collection text NOT NULL CHECK (collection IN ('prescriptions','conversations','confirmations','notifications','toolExecutions','auditEvents','paymentWebhookEvents')),
  id text NOT NULL,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection,id)
);

-- Backend-only tables. No anon/authenticated policies; access is through the validated API.
ALTER TABLE public.assistant_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assistant_records ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.assistant_tests, public.assistant_slots, public.assistant_samples, public.assistant_payments, public.assistant_receipts, public.assistant_records FROM anon, authenticated;

COMMIT;

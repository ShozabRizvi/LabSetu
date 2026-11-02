import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { createPgStore, createSyntheticState, SYNTHETIC_LAB_ID, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createPaymentService } from '../src/assistant/payments.js';

const patient = { id: SYNTHETIC_PATIENT_ID, role: 'citizen', name: 'Synthetic SQL Patient' };
const staff = { id: '00000000-0000-4000-8000-000000000003', role: 'authority', labId: SYNTHETIC_LAB_ID, canApproveReports: true };

test('PostgreSQL engine: additive schema, canonical row persistence, clinical workflow, payment and foreign-key constraints', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA auth;
    CREATE TABLE auth.users(id uuid PRIMARY KEY, email text, raw_user_meta_data jsonb DEFAULT '{}'::jsonb);
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    CREATE FUNCTION auth.jwt() RETURNS jsonb LANGUAGE sql STABLE AS $$ SELECT coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb $$;
    CREATE PUBLICATION supabase_realtime;`);
  const baseline = await readFile(new URL('../../supabase/migrations/20261102_complete_schema.sql', import.meta.url), 'utf8');
  const assistant = await readFile(new URL('../../supabase/migrations/20261102190000_agentic_workflow.sql', import.meta.url), 'utf8');
  const security = await readFile(new URL('../../supabase/migrations/20261102191000_patient_security.sql', import.meta.url), 'utf8');
  await db.exec(baseline);
  // Match Supabase's API role grants before the additive migrations tighten them.
  await db.exec('GRANT USAGE ON SCHEMA public,auth TO anon,authenticated; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO anon,authenticated;');
  await db.exec(assistant);
  await db.exec(security);
  // PGlite exposes one PostgreSQL session. This adapter serializes connections to model a pool.
  let pending = Promise.resolve();
  const pool = {
    async connect() {
      const previous = pending;
      let release;
      pending = new Promise((resolve) => { release = resolve; });
      await previous;
      return { query: (sql, values) => db.query(sql, values), release };
    }
  };
  const store = createPgStore(pool);
  assert.deepEqual(await store.read((state) => state.tests), {}, 'A PostgreSQL connection never auto-seeds synthetic catalogue data.');
  await store.transaction((state) => Object.assign(state, createSyntheticState()));
  const workflow = createWorkflowService({ store });
  const [slot] = await workflow.availability();
  const booking = await workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'postgres-journey' });
  assert.equal(booking.registrationToken.appointmentId, booking.id);
  assert.equal(booking.registrationToken.facilityId, SYNTHETIC_LAB_ID);
  const canonical = await db.query('SELECT a.patient_id,a.center_id,a.patient_name,b.patient_id AS bill_patient_id,b.total_amount,r.patient_id AS report_patient_id,r.status FROM public.appointments a JOIN public.bills b ON b.assistant_booking_id=a.id JOIN public.reports r ON r.assistant_booking_id=a.id WHERE a.id=$1', [booking.id]);
  assert.equal(canonical.rows[0].patient_id, patient.id);
  assert.equal(canonical.rows[0].center_id, SYNTHETIC_LAB_ID);
  assert.equal(canonical.rows[0].bill_patient_id, patient.id);
  assert.equal(canonical.rows[0].report_patient_id, patient.id);
  assert.equal(Number(canonical.rows[0].total_amount), 350);
  assert.equal(canonical.rows[0].status, 'awaiting_results');
  for (const status of ['collected', 'processing', 'processing_complete']) await workflow.staffTransition(staff, booking.id, { entity: 'sample', status });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results: [{ testId: 'cbc', name: 'Hemoglobin', value: '13.5' }] });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  await assert.rejects(workflow.report(patient, booking.id), (error) => error.code === 'payment_required');
  const payments = createPaymentService({ store, workflow, config: { demoMode: true, paymentMode: 'simulated' } });
  const order = await payments.createOrder(patient, booking.id, 'postgres-payment-request');
  await payments.simulate(patient, order.id, 'captured');
  const report = await workflow.report(patient, booking.id);
  assert.equal(report.results[0].value, '13.5');
  const paid = await db.query('SELECT payment_status,paid_amount,due_amount FROM public.bills WHERE id=$1', [booking.invoiceId]);
  assert.equal(paid.rows[0].payment_status, 'paid');
  assert.equal(Number(paid.rows[0].paid_amount), 350);
  assert.equal(Number(paid.rows[0].due_amount), 0);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.assistant_receipts')).rows[0].count, 1);
  assert.equal((await db.query('SELECT assistant_approved_by FROM public.reports WHERE assistant_booking_id=$1', [booking.id])).rows[0].assistant_approved_by, staff.id);
  await assert.rejects(db.query("INSERT INTO public.assistant_samples(booking_id,status,assistant_data) VALUES('missing-booking','collected','{}')"), (error) => error.code === '23503');
  await assert.rejects(db.query("INSERT INTO public.assistant_receipts(id,invoice_id,payment_id,assistant_data) SELECT 'duplicate-receipt',invoice_id,payment_id,'{}' FROM public.assistant_receipts LIMIT 1"), (error) => error.code === '23505');
  await assert.rejects(db.query("UPDATE public.assistant_tests SET price_paise=-1 WHERE id='cbc'"), (error) => error.code === '23514');
  const originalPrice = (await workflow.testDetails('cbc')).pricePaise;
  await assert.rejects(store.transaction((state) => { state.tests.cbc.pricePaise = -1; }), (error) => error.code === '23514');
  assert.equal((await workflow.testDetails('cbc')).pricePaise, originalPrice, 'A failed PostgreSQL write rolls back its payload and canonical columns.');
  const restarted = createWorkflowService({ store: createPgStore(pool) });
  const persistedBooking = await restarted.booking(patient, booking.id);
  assert.equal(persistedBooking.invoice.status, 'paid');
  assert.equal(persistedBooking.registrationToken.id, booking.registrationToken.id);

  // Actual PostgreSQL RLS/column grants, rather than mocked SQL contract assertions.
  await db.exec('SET ROLE authenticated');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [patient.id, JSON.stringify({ sub: patient.id, role: 'authenticated' })]);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.appointments')).rows[0].count, 1);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.bills')).rows[0].count, 1);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.reports')).rows[0].count, 0, 'Patient cannot bypass PDF/payment policy with a direct report query.');
  assert.equal((await db.query("UPDATE public.bills SET payment_status='paid' WHERE id=$1 RETURNING id", [booking.invoiceId])).rows.length, 0, 'Patients cannot mark their bills paid directly.');
  await assert.rejects(db.query('SELECT * FROM public.assistant_records'), (error) => error.code === '42501');
  await assert.rejects(db.query("UPDATE public.profiles SET role='authority' WHERE id=$1", [patient.id]), (error) => error.code === '42501');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", ['00000000-0000-4000-8000-000000000002', JSON.stringify({ role: 'authenticated', user_metadata: { role: 'authority', lab_id: SYNTHETIC_LAB_ID } })]);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.appointments')).rows[0].count, 0);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.bills')).rows[0].count, 0);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.reports')).rows[0].count, 0, 'Self-editable user_metadata cannot become staff permission.');
  await db.query("SELECT set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)", [staff.id, JSON.stringify({ sub: staff.id, role: 'authenticated', app_metadata: { role: 'authority', lab_id: SYNTHETIC_LAB_ID } })]);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM public.reports')).rows[0].count, 1);
  assert.equal((await db.query("UPDATE public.reports SET status='draft' WHERE assistant_booking_id=$1 RETURNING id", [booking.id])).rows.length, 0, 'Even staff cannot bypass the controlled assistant report state machine.');
  await db.exec('RESET ROLE; SET ROLE anon');
  await assert.rejects(db.query('SELECT * FROM public.appointments'), (error) => error.code === '42501');
  await db.exec('RESET ROLE');
});

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PGlite } from '@electric-sql/pglite';
import { createPgStore } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createPaymentService } from '../src/assistant/payments.js';

const patientId = '00000000-0000-4000-8000-000000000001';
const labId = '00000000-0000-4000-8000-000000000010';
const patient = { id: patientId, role: 'citizen', name: 'Synthetic PostgreSQL Fixture' };
const staff = { id: '00000000-0000-4000-8000-000000000003', role: 'authority', labId, canApproveReports: true };

test('deployed UUID schema adapter persists assistant operations through canonical records', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    CREATE TYPE appointment_status AS ENUM ('booked','confirmed','checked_in','completed','cancelled','no_show');
    CREATE TYPE visit_type AS ENUM ('new','follow_up');
    CREATE TYPE case_status AS ENUM ('registered','sample_collected','processing','reported','closed','cancelled');
    CREATE TYPE payment_status AS ENUM ('UNPAID','PARTIAL','PAID','REFUNDED','CANCELLED');
    CREATE TYPE report_status AS ENUM ('DRAFT','GENERATED','VERIFIED','SIGNED','CANCELLED');
    CREATE TABLE lab_centers(id uuid PRIMARY KEY);
    CREATE TABLE patients(id uuid PRIMARY KEY);
    INSERT INTO lab_centers VALUES('${labId}');
    INSERT INTO patients VALUES('${patientId}');
    CREATE TABLE assistant_tests(id uuid PRIMARY KEY, center_id uuid NOT NULL REFERENCES lab_centers(id), test_name text NOT NULL, category text, price numeric, parameters jsonb, assistant_data jsonb, created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now());
    CREATE TABLE assistant_slots(id uuid PRIMARY KEY, center_id uuid REFERENCES lab_centers(id), slot_time text NOT NULL, max_capacity integer, current_bookings integer, is_active boolean, assistant_data jsonb, created_at timestamptz DEFAULT now());
    CREATE TABLE appointments(id uuid PRIMARY KEY, center_id uuid NOT NULL REFERENCES lab_centers(id), patient_id uuid NOT NULL REFERENCES patients(id), department text NOT NULL, appointment_date date NOT NULL, slot_start time NOT NULL, slot_end time NOT NULL CHECK(slot_end > slot_start), visit_type visit_type NOT NULL, booking_source text NOT NULL, status appointment_status NOT NULL, purpose text, assistant_data jsonb, created_at timestamptz DEFAULT now());
    CREATE TABLE patient_cases(id uuid PRIMARY KEY, center_id uuid NOT NULL REFERENCES lab_centers(id), patient_id uuid NOT NULL REFERENCES patients(id), case_no text NOT NULL, appointment_id uuid REFERENCES appointments(id), case_status case_status NOT NULL DEFAULT 'registered', priority text NOT NULL DEFAULT 'ROUTINE', created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now(), UNIQUE(center_id,case_no));
    CREATE TABLE bills(id uuid PRIMARY KEY, center_id uuid NOT NULL REFERENCES lab_centers(id), case_id uuid NOT NULL UNIQUE REFERENCES patient_cases(id), bill_no text NOT NULL, subtotal numeric NOT NULL, discount_amount numeric NOT NULL, tax_amount numeric NOT NULL, total_amount numeric, paid_amount numeric NOT NULL, due_amount numeric, payment_status payment_status NOT NULL, assistant_data jsonb, UNIQUE(center_id,bill_no));
    CREATE TABLE assistant_samples(id uuid PRIMARY KEY, appointment_id uuid REFERENCES appointments(id), patient_id uuid REFERENCES patients(id), sample_type text NOT NULL, collection_status text, assistant_data jsonb);
    CREATE TABLE reports(id uuid PRIMARY KEY, center_id uuid NOT NULL REFERENCES lab_centers(id), case_id uuid NOT NULL REFERENCES patient_cases(id), report_no text NOT NULL, status report_status NOT NULL, title text NOT NULL, report_json jsonb NOT NULL, disclaimer text NOT NULL, verified_at timestamptz, created_by uuid, assistant_data jsonb, UNIQUE(center_id,report_no));
    CREATE TABLE assistant_payments(id uuid PRIMARY KEY, bill_id uuid REFERENCES bills(id), patient_id uuid REFERENCES patients(id), amount numeric NOT NULL, payment_method text, transaction_id text, status text, assistant_data jsonb);
    CREATE TABLE assistant_receipts(id uuid PRIMARY KEY, payment_id uuid REFERENCES assistant_payments(id), receipt_number text NOT NULL UNIQUE, receipt_url text, assistant_data jsonb);
    CREATE TABLE assistant_records(id uuid PRIMARY KEY, patient_id uuid, record_type text, summary text, payload jsonb, assistant_data jsonb, created_at timestamptz DEFAULT now());
  `);
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
  const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  await store.transaction((state) => {
    state.tests['fixture-cbc'] = {
      id: 'fixture-cbc', name: 'Synthetic CBC Fixture', code: 'FIXTURE-CBC',
      pricePaise: 35000, currency: 'INR', labId, active: true,
      parameters: [{ name: 'Hemoglobin', unit: 'g/dL' }]
    };
    state.slots['fixture-slot'] = {
      id: 'fixture-slot', labId, date, startTime: '09:00', endTime: '10:00',
      startsAt: `${date}T09:00:00+05:30`, capacity: 2, active: true
    };
  });
  const workflow = createWorkflowService({ store, config: { requirePaymentForReport: false } });
  const [slot] = await workflow.availability(date);
  const booking = await workflow.book(patient, {
    testIds: ['fixture-cbc'], slotId: slot.id, idempotencyKey: 'fixture-booking'
  });

  assert.equal(booking.registrationToken.appointmentId, booking.id);
  const canonical = await db.query(`SELECT a.patient_id,a.center_id,a.status,c.case_status,b.total_amount
    FROM appointments a JOIN patient_cases c ON c.appointment_id=a.id JOIN bills b ON b.case_id=c.id`);
  assert.deepEqual(canonical.rows[0], {
    patient_id: patientId, center_id: labId, status: 'confirmed', case_status: 'registered', total_amount: '350.00'
  });
  assert.equal((await workflow.availability(date))[0].remaining, 1);
  assert.equal((await createWorkflowService({ store: createPgStore(pool), config: { requirePaymentForReport: false } }).booking(patient, booking.id)).invoice.totalPaise, 35000);

  const otherPatientId = '00000000-0000-4000-8000-000000000002';
  await db.query('INSERT INTO patients VALUES($1::uuid)', [otherPatientId]);
  await db.query(`INSERT INTO appointments(id,center_id,patient_id,department,appointment_date,slot_start,slot_end,visit_type,booking_source,status)
    VALUES('00000000-0000-4000-8000-000000000099',$1::uuid,$2::uuid,'Laboratory Diagnostics',$3::date,'09:00','10:00','new','patient_portal','booked')`,
  [labId, otherPatientId, date]);
  assert.equal((await workflow.availability(date)).length, 0, 'Non-assistant canonical appointments also consume the published slot capacity.');
  await assert.rejects(workflow.book({ id: otherPatientId, role: 'citizen', name: 'Synthetic second patient' }, {
    testIds: ['fixture-cbc'], slotId: slot.id, idempotencyKey: 'fixture-full-slot'
  }), (error) => error.code === 'slot_full');

  for (const status of ['collected', 'processing', 'processing_complete']) {
    await workflow.staffTransition(staff, booking.id, { entity: 'sample', status });
  }
  await workflow.staffTransition(staff, booking.id, {
    entity: 'report', status: 'draft',
    results: [{ testId: 'fixture-cbc', name: 'Hemoglobin', value: '13.5' }]
  });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  assert.equal((await db.query('SELECT status,report_json FROM reports')).rows[0].status, 'VERIFIED');
  assert.equal((await db.query('SELECT case_status FROM patient_cases')).rows[0].case_status, 'reported');

  const reconciliation = (error) => error.status === 409 && error.code === 'record_reconciliation_required';
  await t.test('canonical test names, prices and parameter configuration are read without rewriting booked snapshots', async () => {
    const original = (await db.query('SELECT test_name,price,parameters FROM assistant_tests')).rows[0];
    try {
      await db.query('UPDATE assistant_tests SET test_name=$1,price=$2,parameters=$3::jsonb', ['Repriced isolated fixture', '375.25', JSON.stringify([{ name: 'Updated fixture parameter', unit: 'fixture-unit' }])]);
      const test = await workflow.testDetails('fixture-cbc');
      assert.equal(test.name, 'Repriced isolated fixture');
      assert.equal(test.pricePaise, 37525);
      assert.equal(test.parameters[0].name, 'Updated fixture parameter');
      const persisted = await workflow.booking(patient, booking.id);
      assert.equal(persisted.tests[0].name, 'Synthetic CBC Fixture');
      assert.equal(persisted.tests[0].parameters[0].name, 'Hemoglobin');
      assert.equal(persisted.invoice.totalPaise, 35000);
      assert.equal((await db.query('SELECT assistant_data FROM assistant_tests')).rows[0].assistant_data.pricePaise, 35000, 'A read never silently rewrites catalogue metadata.');
    } finally { await db.query('UPDATE assistant_tests SET test_name=$1,price=$2,parameters=$3::jsonb', [original.test_name, original.price, JSON.stringify(original.parameters)]); }
  });
  await t.test('canonical capacity and slot deactivation govern availability', async () => {
    try {
      await db.query('UPDATE assistant_slots SET max_capacity=3,is_active=true');
      assert.equal((await workflow.availability(date))[0].remaining, 1);
      await db.query('UPDATE assistant_slots SET is_active=false');
      assert.deepEqual(await workflow.availability(date), []);
      await assert.rejects(workflow.book({ id: otherPatientId, role: 'citizen' }, { testIds: ['fixture-cbc'], slotId: slot.id, idempotencyKey: 'deactivated-slot-request' }), (error) => error.code === 'slot_unavailable');
    } finally { await db.query('UPDATE assistant_slots SET max_capacity=2,is_active=true'); }
  });
  await t.test('canonical report revocation and changed results block approved snapshot access', async () => {
    const original = (await db.query('SELECT report_json FROM reports')).rows[0].report_json;
    try {
      await db.query("UPDATE reports SET status='CANCELLED'");
      await assert.rejects(workflow.report(patient, booking.id), reconciliation);
      await db.query("UPDATE reports SET status='VERIFIED',report_json='[]'::jsonb");
      await assert.rejects(workflow.report(patient, booking.id), reconciliation);
    } finally { await db.query("UPDATE reports SET status='VERIFIED',report_json=$1::jsonb", [JSON.stringify(original)]); }
    assert.equal((await workflow.report(patient, booking.id)).results[0].value, '13.5');
  });
  await t.test('canonical patient ownership changes cannot reuse another patient snapshot', async () => {
    try {
      await db.query('UPDATE appointments SET patient_id=$1::uuid WHERE assistant_data IS NOT NULL', [otherPatientId]);
      await assert.rejects(workflow.booking(patient, booking.id), reconciliation);
      await assert.rejects(workflow.booking({ id: otherPatientId, role: 'citizen' }, booking.id), reconciliation);
    } finally { await db.query('UPDATE appointments SET patient_id=$1::uuid WHERE assistant_data IS NOT NULL', [patientId]); }
  });
  await t.test('canonical invoice payment and amount disagreements require staff reconciliation', async () => {
    try {
      await db.query("UPDATE bills SET payment_status='PAID',paid_amount=350,due_amount=0");
      await assert.rejects(workflow.invoice(patient, booking.id), reconciliation);
      await db.query("UPDATE bills SET payment_status='UNPAID',paid_amount=0,due_amount=350,total_amount=351");
      await assert.rejects(workflow.invoice(patient, booking.id), reconciliation);
    } finally { await db.query("UPDATE bills SET payment_status='UNPAID',paid_amount=0,due_amount=350,total_amount=350"); }
  });
  await t.test('cancellation frees capacity counted from canonical appointments and preserves the void invoice', async () => {
    const collectionDate = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
    const published = await workflow.publishSlot(staff, { confirmed: true, date: collectionDate, startTime: '13:00', endTime: '13:30', startsAt: `${collectionDate}T13:00:00+05:30`, capacity: 2, active: true });
    const other = { id: otherPatientId, role: 'citizen', name: 'Isolated cancellation fixture' };
    const appointment = await workflow.book(other, { testIds: ['fixture-cbc'], slotId: published.id, idempotencyKey: 'canonical-cancellation-fixture' });
    assert.equal((await workflow.availability(collectionDate))[0].remaining, 1);
    await workflow.cancel(other, appointment.id);
    assert.equal((await workflow.availability(collectionDate))[0].remaining, 2);
    assert.equal((await workflow.invoice(other, appointment.id)).status, 'void');
  });
  await t.test('payment and receipt persistence remain consistent with canonical billing ownership', async () => {
    const payments = createPaymentService({ store, workflow, config: { demoMode: true, paymentMode: 'simulated' } });
    const order = await payments.createOrder(patient, booking.id, 'deployed-isolated-simulated-payment');
    await payments.simulate(patient, order.id, 'captured');
    assert.equal((await workflow.invoice(patient, booking.id)).status, 'paid');
    assert.equal((await payments.receipt(patient, booking.id)).verified, false);
    assert.equal((await db.query('SELECT payment_status FROM bills WHERE assistant_data->>\'bookingId\'=$1', [booking.id])).rows[0].payment_status, 'PAID');
  });
});

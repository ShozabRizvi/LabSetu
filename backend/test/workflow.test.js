import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMemoryStore, createFileStore, createSyntheticState, SYNTHETIC_LAB_ID, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';

const patient = { id: SYNTHETIC_PATIENT_ID, role: 'citizen', name: 'Synthetic Patient' };
const otherPatient = { id: '00000000-0000-4000-8000-000000000002', role: 'citizen' };
const staff = { id: '00000000-0000-4000-8000-000000000003', role: 'authority', labId: SYNTHETIC_LAB_ID, canApproveReports: true };
const errorCode = (code) => (error) => error.code === code;
function fixture(config = {}) {
  const store = createMemoryStore(createSyntheticState());
  return { store, workflow: createWorkflowService({ store, config }) };
}
async function book(workflow, actor = patient, idempotencyKey = 'synthetic-booking-1', testIds = ['cbc', 'thyroid', 'glucose']) {
  const [slot] = await workflow.availability();
  return workflow.book(actor, { testIds, slotId: slot.id, idempotencyKey });
}
async function processSample(workflow, bookingId) {
  for (const status of ['collected', 'processing', 'processing_complete']) await workflow.staffTransition(staff, bookingId, { entity: 'sample', status });
}
const results = [{ testId: 'cbc', name: 'Hemoglobin', value: '13.5' }, { testId: 'thyroid', name: 'TSH', value: '2.1' }, { testId: 'glucose', name: 'Glucose', value: '88' }];

test('synthetic catalogue is explicitly labelled and carries no fabricated clinical results', async () => {
  const { workflow, store } = fixture();
  const tests = await workflow.searchTests('CBC');
  assert.equal(tests.length, 1);
  assert.equal(tests[0].id, 'cbc');
  assert.equal(tests[0].synthetic, true);
  assert.deepEqual(await store.read((state) => state.reports), {});
  assert.equal((await workflow.searchTests('सीबीसी'))[0].id, 'cbc');
});

test('catalogue prices and invoice totals come from persisted integer paise', async () => {
  const { workflow, store } = fixture();
  const booking = await book(workflow);
  assert.equal(booking.invoice.totalPaise, 100000);
  assert.equal(booking.invoice.currency, 'INR');
  assert.equal(booking.invoice.items.length, 3);
  assert.equal((await store.read((state) => state.invoices[booking.invoiceId])).totalPaise, 100000);
  assert.equal((await workflow.prices(['cbc'])).totalPaise, 35000);
});

test('discount and tax use deterministic paise rounding and immutable invoice snapshot', async () => {
  const { workflow, store } = fixture({ discountBps: 333, taxBps: 1800 });
  await store.transaction((state) => { state.tests.cbc.pricePaise = 101; });
  const booking = await book(workflow, patient, 'rounding', ['cbc']);
  assert.equal(booking.invoice.discountPaise, 3);
  assert.equal(booking.invoice.taxPaise, 18);
  assert.equal(booking.invoice.totalPaise, 116);
  await store.transaction((state) => { state.tests.cbc.pricePaise = 999999; });
  assert.equal((await workflow.invoice(patient, booking.id)).totalPaise, 116);
});

test('missing or invalid prices reject booking without partially saving an appointment', async () => {
  const { workflow, store } = fixture();
  await store.transaction((state) => { delete state.tests.cbc.pricePaise; });
  await assert.rejects(book(workflow), errorCode('price_unavailable'));
  assert.equal(await store.read((state) => Object.keys(state.appointments).length), 0);
  assert.equal(await store.read((state) => Object.keys(state.invoices).length), 0);
});

test('booking atomically rejects a changed confirmation quote and includes configured tax/discount in prices', async () => {
  const { workflow, store } = fixture({ discountBps: 500, taxBps: 1800 });
  const quote = await workflow.prices(['cbc']);
  const [slot] = await workflow.availability();
  assert.equal(quote.totalPaise, 39235);
  await store.transaction((state) => { state.tests.cbc.pricePaise = 40000; });
  await assert.rejects(workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'changed-quote', expectedQuote: quote }), errorCode('quote_changed'));
  assert.deepEqual(await workflow.appointments(patient), []);
  const refreshed = await workflow.prices(['cbc']);
  const booking = await workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'new-quote', expectedQuote: refreshed });
  assert.equal(booking.invoice.totalPaise, refreshed.totalPaise);
});

test('booking validation rejects unavailable tests, duplicate tests, and invalid identifiers', async () => {
  const { workflow } = fixture();
  await assert.rejects(book(workflow, patient, 'missing', ['missing-test']), errorCode('test_unavailable'));
  await assert.rejects(book(workflow, patient, 'duplicate', ['cbc', 'cbc']), errorCode('invalid_tests'));
  await assert.rejects(workflow.booking(patient, "' OR 1=1 --"), errorCode('invalid_identifier'));
});

test('only a signed-in patient may create their booking', async () => {
  const { workflow } = fixture();
  await assert.rejects(book(workflow, null), errorCode('unauthenticated'));
  await assert.rejects(book(workflow, staff), errorCode('patient_only'));
});

test('idempotent booking retry returns one appointment and one invoice', async () => {
  const { workflow, store } = fixture();
  const [slot] = await workflow.availability();
  const input = { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'same-key' };
  const [first, second] = await Promise.all([workflow.book(patient, input), workflow.book(patient, input)]);
  assert.equal(first.id, second.id);
  assert.equal(first.invoiceId, second.invoiceId);
  assert.equal(first.registrationToken.id, second.registrationToken.id);
  assert.equal(await store.read((state) => Object.keys(state.invoices).length), 1);
  await assert.rejects(workflow.book(patient, { ...input, testIds: ['glucose'] }), errorCode('idempotency_conflict'));
});

test('booking creates one persisted time-bound token and prevents a second active patient token', async () => {
  const { workflow, store } = fixture();
  const slots = await workflow.availability();
  const booking = await workflow.book(patient, { testIds: ['cbc'], slotId: slots[0].id, idempotencyKey: 'token-booking-one' });
  const token = booking.registrationToken;
  assert.equal(token.appointmentId, booking.id);
  assert.equal(token.patientId, patient.id);
  assert.equal(token.facilityId, SYNTHETIC_LAB_ID);
  assert.equal(token.status, 'registered');
  assert.equal(token.queuePosition, 1);
  assert.ok(Date.parse(token.expiresAt) > Date.parse(booking.slot.startsAt));
  assert.equal((await store.read((state) => state.appointments[booking.id].registrationToken.id)), token.id);
  await assert.rejects(
    workflow.book(patient, { testIds: ['cbc'], slotId: slots[1].id, idempotencyKey: 'token-booking-two' }),
    errorCode('active_registration_token')
  );
});

test('concurrent token creation is unique and the staff dashboard shares queue position', async () => {
  const { workflow } = fixture();
  const [slot] = await workflow.availability();
  const bookings = await Promise.all([
    workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'queue-patient-one' }),
    workflow.book(otherPatient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'queue-patient-two' })
  ]);
  assert.notEqual(bookings[0].registrationToken.tokenNumber, bookings[1].registrationToken.tokenNumber);
  assert.deepEqual(bookings.map((item) => item.registrationToken.queuePosition).sort(), [1, 2]);
  const dashboard = await workflow.appointments(staff);
  assert.deepEqual(
    dashboard.map((item) => item.registrationToken.tokenNumber).sort(),
    bookings.map((item) => item.registrationToken.tokenNumber).sort()
  );
});

test('authorised staff can call, complete, cancel or expire tokens but patients cannot change them', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await assert.rejects(
    workflow.staffTransition(patient, booking.id, { entity: 'token', status: 'called' }),
    errorCode('staff_only')
  );
  await workflow.staffTransition(staff, booking.id, { entity: 'token', status: 'called' });
  assert.equal((await workflow.booking(patient, booking.id)).registrationToken.status, 'called');
  await workflow.staffTransition(staff, booking.id, { entity: 'token', status: 'completed' });
  const completed = await workflow.booking(patient, booking.id);
  assert.equal(completed.registrationToken.status, 'completed');
  assert.equal(completed.registrationToken.queuePosition, null);
});

test('same patient cannot duplicate a slot with a different request key', async () => {
  const { workflow } = fixture();
  await book(workflow);
  await assert.rejects(book(workflow, patient, 'second-key'), errorCode('duplicate_booking'));
});

test('capacity reservations are atomic under concurrent requests', async () => {
  const { workflow, store } = fixture();
  const [slot] = await workflow.availability();
  await store.transaction((state) => { state.slots[slot.id].capacity = 1; });
  const attempts = await Promise.allSettled([workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'one' }), workflow.book(otherPatient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'two' })]);
  assert.equal(attempts.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(attempts.find((item) => item.status === 'rejected').reason.code, 'slot_full');
  assert.equal((await workflow.availability()).some((item) => item.id === slot.id), false);
});

test('availability validates dates and never invents unpublished slots', async () => {
  const { workflow, store } = fixture();
  for (const date of ['2026-02-30', '2026-99-99', '0000-01-01', 'tomorrow']) await assert.rejects(workflow.availability(date), errorCode('invalid_date'));
  await store.transaction((state) => { state.slots = {}; });
  assert.deepEqual(await workflow.availability(), []);
});

test('past and malformed persisted slots cannot be booked', async () => {
  const { workflow, store } = fixture();
  const [slot] = await workflow.availability();
  for (const startsAt of ['2000-01-01T00:00:00Z', 'invalid-time']) {
    await store.transaction((state) => { state.slots[slot.id].startsAt = startsAt; });
    await assert.rejects(workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'invalid-slot' }), errorCode('slot_unavailable'));
  }
});

test('cross-patient and cross-laboratory reads are consistently denied', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  for (const actor of [otherPatient, { ...staff, labId: 'other-laboratory' }]) {
    for (const method of ['booking', 'invoice', 'sample', 'reportStatus', 'report']) await assert.rejects(workflow[method](actor, booking.id), errorCode('record_not_found'));
    await assert.rejects(workflow.invoiceDetails(actor, booking.invoiceId), errorCode('record_not_found'));
    assert.deepEqual(await workflow.appointments(actor), []);
  }
});

test('patients cannot alter collection, processing or medical results', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  for (const entity of ['sample', 'report', 'appointment']) await assert.rejects(workflow.staffTransition(patient, booking.id, { entity, status: 'approved' }), errorCode('staff_only'));
});

test('sample workflow accepts only the controlled collection-to-processing state machine', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'sample', status: 'processing_complete' }), errorCode('invalid_transition'));
  await processSample(workflow, booking.id);
  assert.equal((await workflow.sample(patient, booking.id)).status, 'processing_complete');
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'sample', status: 'collected' }), errorCode('invalid_transition'));
});

test('report draft requires completed sample processing and real staff-entered values', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results }), errorCode('sample_incomplete'));
  await processSample(workflow, booking.id);
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results: [{ testId: 'cbc', name: 'Invented parameter', value: '5' }] }), errorCode('invalid_results'));
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results });
  const report = await workflow.staffReport(staff, booking.id);
  assert.equal(report.results[0].enteredBy, staff.id);
  assert.equal(report.results[0].unit, 'g/dL');
  assert.equal(report.status, 'draft');
});

test('all configured result parameters are required before verification', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await processSample(workflow, booking.id);
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results: results.slice(0, 1) });
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' }), errorCode('results_incomplete'));
});

test('report approval requires explicit clinical permission and produces a readiness notification', async () => {
  const { workflow, store } = fixture();
  const booking = await book(workflow);
  await processSample(workflow, booking.id);
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await assert.rejects(workflow.staffTransition({ ...staff, canApproveReports: false }, booking.id, { entity: 'report', status: 'approved' }), errorCode('approval_permission_required'));
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  assert.equal((await workflow.staffReport(staff, booking.id)).approvedBy, staff.id);
  assert.equal((await workflow.notifications(patient)).length, 1);
  assert.equal((await workflow.notifications(otherPatient)).length, 0);
  assert.equal(await store.read((state) => Object.values(state.auditEvents).some((event) => event.action === 'report.approved')), true);
});

test('draft and unapproved report values are never exposed through patient status or booking', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await processSample(workflow, booking.id);
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results });
  assert.equal((await workflow.booking(patient, booking.id)).report.results, undefined);
  assert.equal((await workflow.reportStatus(patient, booking.id)).results, undefined);
  await assert.rejects(workflow.report(patient, booking.id), errorCode('report_not_approved'));
  await assert.rejects(workflow.staffReport(patient, booking.id), errorCode('staff_only'));
});

test('booked clinical parameter configuration and test names remain stable after catalogue edits', async () => {
  const { workflow, store } = fixture({ requirePaymentForReport: false });
  const booking = await book(workflow, patient, 'stable-clinical-config', ['cbc']);
  await store.transaction((state) => { state.tests.cbc.name = 'Changed catalogue name'; state.tests.cbc.parameters = [{ name: 'Other parameter', unit: 'other', referenceRange: 'new interval' }]; });
  assert.equal((await workflow.booking(patient, booking.id)).tests[0].name, 'Complete Blood Count');
  await processSample(workflow, booking.id);
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results: results.slice(0, 1) });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  const report = await workflow.report(patient, booking.id);
  assert.equal(report.tests[0].name, 'Complete Blood Count');
  assert.equal(report.results[0].name, 'Hemoglobin');
  assert.equal(report.results[0].unit, 'g/dL');
});

test('approved report access follows verified invoice payment and cannot be edited afterwards', async () => {
  const { workflow, store } = fixture();
  const booking = await book(workflow);
  await processSample(workflow, booking.id);
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  assert.equal((await workflow.reportStatus(patient, booking.id)).accessAllowed, false);
  await assert.rejects(workflow.report(patient, booking.id), errorCode('payment_required'));
  await store.transaction((state) => { state.invoices[booking.invoiceId].status = 'paid'; }); // Emulates only trusted payment-service capture event.
  const report = await workflow.report(patient, booking.id);
  assert.equal(report.results.length, 3);
  assert.equal(report.synthetic, true);
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results }), errorCode('invalid_transition'));
});

test('optional pay-at-booking policy preserves approval and can disable payment access gate explicitly', async () => {
  const { workflow } = fixture({ paymentTiming: 'at_booking', requirePaymentForReport: false });
  const booking = await book(workflow);
  assert.equal(booking.invoice.paymentTiming, 'at_booking');
  await assert.rejects(workflow.report(patient, booking.id), errorCode('report_not_approved'));
});

test('early cancellation is idempotent, voids invoice, and frees capacity', async () => {
  const { workflow } = fixture();
  const booking = await book(workflow);
  await assert.rejects(workflow.cancel(otherPatient, booking.id), errorCode('record_not_found'));
  assert.equal((await workflow.cancel(patient, booking.id)).invoice.status, 'void');
  assert.equal((await workflow.cancel(patient, booking.id)).status, 'cancelled');
  assert.equal((await workflow.booking(patient, booking.id)).registrationToken.status, 'cancelled');
  assert.equal((await workflow.availability()).find((slot) => slot.id === booking.slotId).remaining, 3);
  await assert.rejects(workflow.staffTransition(staff, booking.id, { entity: 'sample', status: 'collected' }), errorCode('booking_cancelled'));
});

test('collected samples and outstanding payment attempts require staff-assisted cancellation', async () => {
  const { workflow, store } = fixture();
  const booking = await book(workflow);
  await store.transaction((state) => { state.payments.test = { invoiceId: booking.invoiceId, status: 'pending' }; });
  await assert.rejects(workflow.cancel(patient, booking.id), errorCode('cancellation_unavailable'));
  await store.transaction((state) => { state.payments.test.status = 'failed'; });
  await workflow.staffTransition(staff, booking.id, { entity: 'sample', status: 'collected' });
  await assert.rejects(workflow.cancel(patient, booking.id), errorCode('cancellation_unavailable'));
});

test('failed state mutation rolls back every change', async () => {
  const { store } = fixture();
  await assert.rejects(store.transaction((state) => { state.tests.cbc.pricePaise = 1; throw new Error('rollback'); }), /rollback/);
  assert.equal(await store.read((state) => state.tests.cbc.pricePaise), 35000);
});

test('file-backed demo persists bookings/invoices across restart without overwriting existing records', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'labsetu-synthetic-workflow-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'state.json');
  const first = createWorkflowService({ store: createFileStore(file) });
  const booking = await book(first);
  const restarted = createWorkflowService({ store: createFileStore(file, { seed: createSyntheticState() }) });
  assert.equal((await restarted.booking(patient, booking.id)).invoice.totalPaise, 100000);
  assert.equal((await restarted.appointments(patient)).length, 1);
});

test('independent file-store instances serialize reservations and avoid lost writes', async (t) => {
  const directory = await mkdtemp(path.join(tmpdir(), 'labsetu-synthetic-concurrency-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const file = path.join(directory, 'state.json');
  const store = createFileStore(file);
  const first = createWorkflowService({ store });
  const second = createWorkflowService({ store: createFileStore(file) });
  const [slot] = await first.availability();
  await store.transaction((state) => { state.slots[slot.id].capacity = 1; });
  const attempts = await Promise.allSettled([first.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'instance-1' }), second.book(otherPatient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'instance-2' })]);
  assert.equal(attempts.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal((await first.appointments(staff)).length, 1);
});

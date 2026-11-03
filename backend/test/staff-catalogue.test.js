import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PGlite } from '@electric-sql/pglite';
import { createMemoryStore, createPgStore, SYNTHETIC_LAB_ID, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createAssistantRouter } from '../src/assistant/router.js';
import { assistantConfig, demoAuthorityId } from '../src/assistant/config.js';

const staff = { id: demoAuthorityId, role: 'authority', labId: SYNTHETIC_LAB_ID };
const otherStaff = { ...staff, id: '00000000-0000-4000-8000-000000000004', labId: '00000000-0000-4000-8000-000000000011' };
const patient = { id: SYNTHETIC_PATIENT_ID, role: 'citizen' };
const request = () => ({ confirmed: true, name: 'Isolated laboratory test fixture', code: 'FIXTURE-TEST', aliases: ['isolated fixture'], pricePaise: 12550, currency: 'INR', parameters: [{ name: 'Fixture measurement', unit: 'fixture-unit' }], description: 'Isolated software test data.', active: true });
const slotRequest = () => {
  const date = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  return { confirmed: true, date, startTime: '09:00', endTime: '09:30', startsAt: `${date}T09:00:00+05:30`, capacity: 2, active: true };
};
const errorCode = (code) => (error) => error.code === code;
const fixture = () => { const store = createMemoryStore(); return { store, workflow: createWorkflowService({ store }) }; };

test('only scoped laboratory staff can publish or list catalogue and slots', async () => {
  const { workflow } = fixture();
  for (const actor of [null, patient, { ...staff, labId: undefined }]) {
    for (const operation of [() => workflow.publishTest(actor, request()), () => workflow.publishSlot(actor, slotRequest()), () => workflow.staffCatalogue(actor)]) await assert.rejects(operation());
  }
  const test = await workflow.publishTest(staff, request());
  const slot = await workflow.publishSlot(staff, slotRequest());
  assert.match(test.id, /^[0-9a-f-]{36}$/);
  assert.match(slot.id, /^[0-9a-f-]{36}$/);
  assert.equal(test.labId, staff.labId);
  assert.equal(test.synthetic, false);
  assert.deepEqual(await workflow.staffCatalogue(otherStaff), { tests: [], slots: [] });
  await assert.rejects(workflow.publishTest(otherStaff, request(), test.id), errorCode('test_not_found'));
  await assert.rejects(workflow.publishSlot(otherStaff, slotRequest(), slot.id), errorCode('slot_not_found'));
});

test('publication requires explicit confirmation and rejects client identity or arbitrary fields', async () => {
  const { workflow, store } = fixture();
  for (const body of [{ ...request(), confirmed: false }, { ...request(), confirmed: undefined }, { ...request(), id: 'caller-id' }, { ...request(), labId: otherStaff.labId }, { ...request(), synthetic: false }]) await assert.rejects(workflow.publishTest(staff, body));
  for (const body of [{ ...slotRequest(), confirmed: false }, { ...slotRequest(), currentBookings: 0 }, { ...slotRequest(), labId: otherStaff.labId }]) await assert.rejects(workflow.publishSlot(staff, body));
  assert.deepEqual(await store.read((state) => state.tests), {});
  assert.deepEqual(await store.read((state) => state.slots), {});
});

test('invalid prices, aliases and clinical metadata are rejected without inventing units or reference ranges', async () => {
  const { workflow } = fixture();
  for (const change of [{ pricePaise: 0 }, { pricePaise: -1 }, { pricePaise: 1.5 }, { pricePaise: '12550' }, { pricePaise: Number.MAX_SAFE_INTEGER }, { currency: 'USD' }, { name: '' }, { code: 'bad code' }, { active: 'true' }, { aliases: ['same', 'Same'] }, { parameters: [{ name: 'Measurement' }] }, { parameters: [{ name: 'Measurement', unit: 'u', inventedField: true }] }, { parameters: [{ name: 'Measurement', unit: 'u' }, { name: 'measurement', unit: 'u' }] }]) await assert.rejects(workflow.publishTest(staff, { ...request(), ...change }));
  const published = await workflow.publishTest(staff, request());
  assert.equal(published.parameters[0].referenceRange, undefined);
  assert.equal(published.parameters[0].unit, 'fixture-unit');
});

test('concurrent duplicate tests and collection times are prevented atomically within one laboratory', async () => {
  const { workflow } = fixture();
  const tests = await Promise.allSettled([workflow.publishTest(staff, request()), workflow.publishTest(staff, request())]);
  assert.equal(tests.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(tests.find((item) => item.status === 'rejected').reason.code, 'duplicate_test');
  const slots = await Promise.allSettled([workflow.publishSlot(staff, slotRequest()), workflow.publishSlot(staff, slotRequest())]);
  assert.equal(slots.filter((item) => item.status === 'fulfilled').length, 1);
  assert.equal(slots.find((item) => item.status === 'rejected').reason.code, 'duplicate_slot');
  assert.ok(await workflow.publishTest(otherStaff, request()));
  assert.ok(await workflow.publishSlot(otherStaff, slotRequest()));
});

test('slot publication validates calendar dates, future time, explicit timezone, end time and capacity', async () => {
  const { workflow } = fixture();
  for (const change of [{ date: '2027-02-30' }, { startsAt: '2027-02-30T09:00:00+05:30' }, { startsAt: slotRequest().startsAt.replace('+05:30', '') }, { startsAt: slotRequest().startsAt.replace('+05:30', '+14:30') }, { startsAt: slotRequest().startsAt.replace('09:00', '10:00') }, { startTime: '25:00' }, { endTime: '09:00' }, { endTime: '08:00' }, { capacity: 0 }, { capacity: 1001 }, { capacity: 1.2 }, { active: 'true' }, { date: '2000-01-01', startsAt: '2000-01-01T09:00:00+05:30' }]) await assert.rejects(workflow.publishSlot(staff, { ...slotRequest(), ...change }));
  assert.deepEqual(await workflow.availability(), []);
});

test('staff edits preserve booked prices, clinical parameter snapshots, and existing slot schedules', async () => {
  const { workflow } = fixture();
  const test = await workflow.publishTest(staff, request());
  const slot = await workflow.publishSlot(staff, slotRequest());
  const booking = await workflow.book(patient, { testIds: [test.id], slotId: slot.id, idempotencyKey: 'staff-publishing-booking' });
  await workflow.publishTest(staff, { ...request(), pricePaise: 99900, name: 'Edited fixture test', parameters: [{ name: 'New fixture measurement', unit: 'new-unit', referenceRange: 'Staff-entered fixture interval' }] }, test.id);
  const persisted = await workflow.booking(patient, booking.id);
  assert.equal(persisted.invoice.totalPaise, 12550);
  assert.equal(persisted.tests[0].parameters[0].name, 'Fixture measurement');
  assert.equal(persisted.tests[0].name, request().name);
  await assert.rejects(workflow.publishSlot(staff, { ...slotRequest(), startTime: '10:00', endTime: '10:30', startsAt: slotRequest().startsAt.replace('09:00', '10:00') }, slot.id), errorCode('slot_schedule_immutable'));
  const secondPatient = { ...patient, id: '00000000-0000-4000-8000-000000000002' };
  await workflow.book(secondPatient, { testIds: [test.id], slotId: slot.id, idempotencyKey: 'staff-publishing-second-booking' });
  await assert.rejects(workflow.publishSlot(staff, { ...slotRequest(), capacity: 1 }, slot.id), errorCode('capacity_below_bookings'));
  await workflow.publishSlot(staff, { ...slotRequest(), capacity: 3, active: false }, slot.id);
  await workflow.publishTest(staff, { ...request(), active: false }, test.id);
  assert.deepEqual(await workflow.searchTests(), []);
  assert.deepEqual(await workflow.availability(), []);
  assert.equal((await workflow.staffCatalogue(staff)).tests[0].active, false);
  assert.equal((await workflow.booking(patient, booking.id)).status, 'confirmed');
});

test('demo-published catalogue stays labelled synthetic and real publication has an audit trail', async () => {
  const { workflow, store } = fixture();
  const synthetic = createWorkflowService({ store: createMemoryStore(), config: { demoMode: true } });
  assert.equal((await synthetic.publishTest(staff, request())).synthetic, true);
  assert.equal((await synthetic.publishSlot(staff, slotRequest())).synthetic, true);
  const test = await workflow.publishTest(staff, request());
  assert.equal(await store.read((state) => Object.values(state.auditEvents).some((event) => event.actorId === staff.id && event.action === 'catalogue.test_published' && event.resourceId === test.id)), true);
});

test('availability never advertises capacity that booking rejects when a canonical counter lags reservations', async () => {
  const { workflow, store } = fixture();
  const test = await workflow.publishTest(staff, request());
  const slot = await workflow.publishSlot(staff, { ...slotRequest(), capacity: 1 });
  await workflow.book(patient, { testIds: [test.id], slotId: slot.id, idempotencyKey: 'conservative-capacity-fixture' });
  await store.transaction((state) => { state.slots[slot.id].currentBookings = 0; });
  assert.deepEqual(await workflow.availability(slot.date), []);
  await assert.rejects(workflow.book({ id: '00000000-0000-4000-8000-000000000002', role: 'citizen' }, { testIds: [test.id], slotId: slot.id, idempotencyKey: 'full-capacity-fixture' }), errorCode('slot_full'));
});

test('staff catalogue HTTP endpoints enforce authentication, patient denial and confirmation', async (t) => {
  const secret = 'synthetic-staff-publishing-secret-at-least-32-characters';
  const config = { ...assistantConfig({}), demoMode: true, aiProvider: 'demo', jwtSecret: secret };
  const app = express();
  app.use('/api/assistant', createAssistantRouter({ config, store: createMemoryStore() }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const token = (id) => jwt.sign({}, secret, { algorithm: 'HS256', audience: 'labsetu-demo', issuer: 'labsetu-local', subject: id, expiresIn: '5m' });
  const call = (route, method, body, actor) => fetch(`http://127.0.0.1:${server.address().port}/api/assistant${route}`, { method, headers: { 'content-type': 'application/json', ...(actor ? { authorization: `Bearer ${token(actor)}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  for (const [route, method, body] of [['/staff/catalogue', 'GET'], ['/staff/tests', 'POST', request()], ['/staff/tests/some-test', 'PUT', request()], ['/staff/slots', 'POST', slotRequest()], ['/staff/slots/some-slot', 'PUT', slotRequest()]]) {
    assert.equal((await call(route, method, body)).status, 401);
    assert.equal((await call(route, method, body, patient.id)).status, 403);
  }
  assert.equal((await call('/staff/tests', 'POST', { ...request(), confirmed: false }, staff.id)).status, 409);
  assert.equal((await call('/staff/tests', 'POST', request(), staff.id)).status, 200);
  assert.equal((await call('/staff/slots', 'POST', slotRequest(), staff.id)).status, 200);
  const response = await call('/staff/catalogue', 'GET', undefined, staff.id);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).data.tests.length, 1);
});

test('staff publication persists validated catalogue and schedule using the PostgreSQL store', async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  // Isolated schema contract fixture: no live laboratory data or environment changes.
  await db.exec(`CREATE TABLE assistant_tests(id text PRIMARY KEY,lab_id text,price_paise bigint CHECK(price_paise>0),assistant_data jsonb);
    CREATE TABLE assistant_slots(id text PRIMARY KEY,lab_id text,starts_at timestamptz,capacity integer,assistant_data jsonb,UNIQUE(lab_id,starts_at));
    CREATE TABLE appointments(id text PRIMARY KEY,assistant_data jsonb); CREATE TABLE bills(id text PRIMARY KEY,assistant_data jsonb);
    CREATE TABLE reports(id text PRIMARY KEY,assistant_data jsonb); CREATE TABLE assistant_samples(booking_id text PRIMARY KEY,assistant_data jsonb);
    CREATE TABLE assistant_payments(id text PRIMARY KEY,assistant_data jsonb); CREATE TABLE assistant_receipts(id text PRIMARY KEY,assistant_data jsonb);
    CREATE TABLE assistant_records(collection text,id text,payload jsonb,PRIMARY KEY(collection,id));`);
  let pending = Promise.resolve();
  const pool = { async connect() { const previous = pending; let release; pending = new Promise((resolve) => { release = resolve; }); await previous; return { query: (sql, values) => db.query(sql, values), release }; } };
  const workflow = createWorkflowService({ store: createPgStore(pool) });
  const test = await workflow.publishTest(staff, request());
  const slot = await workflow.publishSlot(staff, slotRequest());
  const restarted = createWorkflowService({ store: createPgStore(pool) });
  assert.equal((await restarted.testDetails(test.id)).pricePaise, 12550);
  assert.equal((await restarted.availability())[0].id, slot.id);
  await restarted.publishTest(staff, { ...request(), pricePaise: 13000 }, test.id);
  await restarted.publishSlot(staff, { ...slotRequest(), capacity: 4 }, slot.id);
  assert.equal((await db.query('SELECT price_paise FROM assistant_tests')).rows[0].price_paise, 13000);
  assert.equal((await db.query('SELECT capacity FROM assistant_slots')).rows[0].capacity, 4);
  assert.equal((await db.query('SELECT count(*)::integer AS count FROM assistant_records')).rows[0].count, 4);
});

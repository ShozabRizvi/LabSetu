import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { createPaymentService } from '../src/assistant/payments.js';

const patient = { id: 'patient-1', role: 'citizen' };
const otherPatient = { id: 'patient-2', role: 'citizen' };
const staff = { id: 'staff-1', role: 'authority', labId: 'lab-1' };
const hmac = (body, key = 'test-secret') => createHmac('sha256', key).update(body).digest('hex');

function fixture(options = {}) {
  let state = {
    appointments: { 'APT-1': { id: 'APT-1', patientId: patient.id, labId: 'lab-1', invoiceId: 'INV-1', status: 'confirmed', reportStatus: 'approved' } },
    invoices: { 'INV-1': { id: 'INV-1', bookingId: 'APT-1', patientId: patient.id, labId: 'lab-1', totalPaise: 125050, currency: 'INR', status: 'unpaid' } },
    reports: {}, payments: {}, receipts: {}, auditEvents: {}, paymentWebhookEvents: {}
  };
  let queue = Promise.resolve();
  const store = {
    read: async (fn) => fn(structuredClone(state)),
    transaction(fn) {
      const run = queue.then(async () => {
        const next = structuredClone(state);
        const result = await fn(next);
        state = next;
        return structuredClone(result);
      });
      queue = run.catch(() => {});
      return run;
    }
  };
  const workflow = { invoice: async () => state.invoices['INV-1'] };
  const requests = [];
  let entity = { id: 'pay_test1', order_id: 'order_test1', amount: 125050, currency: 'INR', status: 'captured', captured: true };
  const fetchImpl = async (url, request) => {
    requests.push({ url, ...request });
    return { ok: true, json: async () => url.endsWith('/orders') ? { id: 'order_test1', amount: 125050, currency: 'INR' } : structuredClone(entity) };
  };
  const config = { demoMode: true, paymentMode: 'simulated', ...options };
  return {
    service: createPaymentService({ store, workflow, config, fetchImpl }), store, requests,
    state: () => structuredClone(state), setEntity: (patch) => { entity = { ...entity, ...patch }; },
    provider: (override) => createPaymentService({ store, workflow, config: { ...config, paymentMode: 'razorpay_test', razorpayKeyId: 'rzp_test_key1', razorpayKeySecret: 'test-secret', razorpayWebhookSecret: 'hook-secret' }, fetchImpl: override || fetchImpl })
  };
}

test('simulated payment uses invoice paise, is idempotent, and receipt never claims provider verification', async () => {
  const f = fixture();
  const order = await f.service.createOrder(patient, 'APT-1', 'request-0001');
  assert.equal(order.amountPaise, 125050);
  assert.equal(order.mode, 'simulated');
  assert.match(order.label, /SIMULATED/);
  assert.equal((await f.service.createOrder(patient, 'APT-1', 'request-0001')).id, order.id);
  const paid = await f.service.simulate(patient, order.id, 'captured');
  assert.equal(paid.status, 'captured');
  assert.equal(paid.receipt.verified, false);
  assert.equal(f.state().invoices['INV-1'].status, 'paid');
  assert.equal((await f.service.receipt(patient, 'APT-1')).id, paid.receipt.id);
  await f.service.simulate(patient, order.id, 'captured');
  await f.service.simulate(patient, order.id, 'failed');
  assert.equal(Object.keys(f.state().receipts).length, 1);
  assert.equal((await f.service.status(patient, 'APT-1')).paid, true);
  assert.equal(f.requests.length, 0);
});

test('patient ownership and explicit demo restriction are enforced', async () => {
  const f = fixture();
  await assert.rejects(f.service.createOrder(otherPatient, 'APT-1', 'request-0001'), { status: 404 });
  await assert.rejects(f.service.createOrder(staff, 'APT-1', 'request-0001'), { status: 404 });
  await assert.rejects(f.service.status(otherPatient, 'APT-1'), { status: 404 });
  await assert.rejects(f.service.receipt(otherPatient, 'APT-1'), { status: 404 });
  const disabled = fixture({ demoMode: false });
  await assert.rejects(disabled.service.createOrder(patient, 'APT-1', 'request-0001'), { code: 'PAYMENT_CONFIGURATION' });
});

test('payment opens only at configured stage and never before approval by default', async () => {
  const f = fixture();
  await f.store.transaction((state) => { state.appointments['APT-1'].reportStatus = 'draft'; });
  await assert.rejects(f.service.createOrder(patient, 'APT-1', 'request-0001'), { code: 'REPORT_NOT_READY' });
  const early = fixture({ paymentStage: 'booking' });
  await early.store.transaction((state) => { state.appointments['APT-1'].reportStatus = 'draft'; });
  assert.equal((await early.service.createOrder(patient, 'APT-1', 'request-0001')).status, 'pending');
});

test('invalid or void authoritative invoices cannot create payment orders', async () => {
  for (const change of [{ totalPaise: null }, { totalPaise: 0 }, { totalPaise: 4.5 }, { currency: 'USD' }, { status: 'void' }]) {
    const f = fixture();
    await f.store.transaction((state) => Object.assign(state.invoices['INV-1'], change));
    await assert.rejects(f.service.createOrder(patient, 'APT-1', 'request-0001'));
    assert.equal(Object.keys(f.state().payments).length, 0);
  }
});

test('Razorpay live keys and absent credentials are rejected', async () => {
  for (const razorpayKeyId of ['rzp_live_key1', '', 'nonsense']) {
    const f = fixture({ paymentMode: 'razorpay_test', razorpayKeyId, razorpayKeySecret: 'secret' });
    await assert.rejects(f.service.createOrder(patient, 'APT-1', 'request-0001'), { code: 'PAYMENT_CONFIGURATION' });
    assert.equal(f.requests.length, 0);
  }
});

test('provider order amount is generated from saved invoice and signature alone cannot mark invoice paid', async () => {
  const f = fixture();
  const service = f.provider();
  const order = await service.createOrder(patient, 'APT-1', 'request-0001');
  assert.deepEqual(JSON.parse(f.requests[0].body), { amount: 125050, currency: 'INR', receipt: order.id.slice(0, 40), notes: { invoice_id: 'INV-1' } });
  f.setEntity({ status: 'authorized', captured: false });
  const pending = await service.verify(patient, { orderId: order.orderId, paymentId: 'pay_test1', signature: hmac('order_test1|pay_test1') });
  assert.equal(pending.status, 'pending');
  assert.equal(f.state().invoices['INV-1'].status, 'unpaid');
  await assert.rejects(service.receipt(patient, 'APT-1'), { status: 404 });
});

test('invalid checkout signatures never call provider or pay invoice', async () => {
  const f = fixture();
  const service = f.provider();
  const order = await service.createOrder(patient, 'APT-1', 'request-0001');
  for (const signature of ['bad', 'f'.repeat(64), undefined]) {
    await assert.rejects(service.verify(patient, { orderId: order.orderId, paymentId: 'pay_test1', signature }), { code: 'INVALID_PAYMENT_SIGNATURE' });
  }
  assert.equal(f.requests.length, 1);
  assert.equal(f.state().invoices['INV-1'].status, 'unpaid');
});

test('provider captured payment must match order, payment, amount, and currency', async () => {
  for (const patch of [{ amount: 1 }, { order_id: 'order_other' }, { currency: 'USD' }, { id: 'pay_other' }]) {
    const f = fixture();
    const service = f.provider();
    await service.createOrder(patient, 'APT-1', 'request-0001');
    f.setEntity(patch);
    await assert.rejects(service.verify(patient, { orderId: 'order_test1', paymentId: 'pay_test1', signature: hmac('order_test1|pay_test1') }), { code: 'PAYMENT_MISMATCH' });
    assert.equal(f.state().invoices['INV-1'].status, 'unpaid');
  }
});

test('provider captured payment creates one verified TEST receipt', async () => {
  const f = fixture();
  const service = f.provider();
  await service.createOrder(patient, 'APT-1', 'request-0001');
  const body = { orderId: 'order_test1', paymentId: 'pay_test1', signature: hmac('order_test1|pay_test1') };
  const paid = await service.verify(patient, body);
  assert.equal(paid.status, 'captured');
  assert.equal(paid.receipt.verified, true);
  assert.match(paid.receipt.label, /TEST/);
  assert.equal((await service.verify(patient, body)).receipt.id, paid.receipt.id);
  assert.equal(Object.keys(f.state().receipts).length, 1);
  await assert.rejects(service.simulate(patient, paid.id, 'captured'), { code: 'SIMULATION_DISABLED' });
});

test('a changed invoice cannot be marked paid by an older payment order', async () => {
  const f = fixture();
  const service = f.provider();
  await service.createOrder(patient, 'APT-1', 'request-0001');
  await f.store.transaction((state) => { state.invoices['INV-1'].totalPaise += 100; });
  await assert.rejects(service.verify(patient, { orderId: 'order_test1', paymentId: 'pay_test1', signature: hmac('order_test1|pay_test1') }), { code: 'INVOICE_CHANGED' });
  assert.equal(f.state().invoices['INV-1'].status, 'unpaid');
});

test('webhooks require original bytes and valid signature, and deduplicate deliveries', async () => {
  const f = fixture();
  const service = f.provider();
  await service.createOrder(patient, 'APT-1', 'request-0001');
  const raw = Buffer.from(JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_test1', order_id: 'order_test1' } } } }));
  await assert.rejects(service.webhook(JSON.parse(raw), hmac(raw, 'hook-secret'), 'evt-1'), { code: 'INVALID_WEBHOOK_BODY' });
  await assert.rejects(service.webhook(raw, 'bad', 'evt-1'), { code: 'INVALID_WEBHOOK_SIGNATURE' });
  assert.equal((await service.webhook(raw, hmac(raw, 'hook-secret'), 'evt-1')).status, 'captured');
  const count = f.requests.length;
  assert.equal((await service.webhook(raw, hmac(raw, 'hook-secret'), 'evt-1')).duplicate, true);
  assert.equal(f.requests.length, count);
  assert.equal(Object.keys(f.state().receipts).length, 1);
});

test('out-of-order failed webhook never regresses a captured invoice', async () => {
  const f = fixture();
  const service = f.provider();
  await service.createOrder(patient, 'APT-1', 'request-0001');
  const raw = (event) => Buffer.from(JSON.stringify({ event, payload: { payment: { entity: { id: 'pay_test1', order_id: 'order_test1' } } } }));
  const captured = raw('payment.captured');
  await service.webhook(captured, hmac(captured, 'hook-secret'), 'evt-1');
  f.setEntity({ status: 'failed', captured: false });
  const failed = raw('payment.failed');
  assert.equal((await service.webhook(failed, hmac(failed, 'hook-secret'), 'evt-2')).status, 'captured');
  assert.equal(f.state().invoices['INV-1'].status, 'paid');
  assert.equal(Object.keys(f.state().receipts).length, 1);
});

test('failed simulation keeps invoice unpaid and allows an explicit new retry', async () => {
  const f = fixture();
  const order = await f.service.createOrder(patient, 'APT-1', 'request-0001');
  assert.equal((await f.service.simulate(patient, order.id, 'failed')).status, 'failed');
  assert.equal(f.state().invoices['INV-1'].status, 'unpaid');
  const retry = await f.service.createOrder(patient, 'APT-1', 'request-0002');
  assert.notEqual(retry.id, order.id);
  assert.equal((await f.service.simulate(patient, retry.id, 'captured')).status, 'captured');
});

test('uncertain provider creation is durably blocked against duplicate outbound retries', async () => {
  const f = fixture();
  let requests = 0;
  const service = f.provider(async () => { requests += 1; throw new Error('timeout'); });
  await assert.rejects(service.createOrder(patient, 'APT-1', 'request-0001'), { code: 'PAYMENT_PROVIDER_UNAVAILABLE' });
  await assert.rejects(service.createOrder(patient, 'APT-1', 'request-0001'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  await assert.rejects(service.createOrder(patient, 'APT-1', 'request-0002'), { code: 'PAYMENT_RECONCILIATION_REQUIRED' });
  assert.equal(requests, 1);
  assert.equal(Object.values(f.state().payments)[0].status, 'reconciliation_required');
});

test('concurrent repeated order requests create at most one provider order', async () => {
  const f = fixture();
  const service = f.provider();
  const results = await Promise.allSettled([
    service.createOrder(patient, 'APT-1', 'request-0001'), service.createOrder(patient, 'APT-1', 'request-0001')
  ]);
  assert.equal(results.filter((item) => item.status === 'fulfilled').length >= 1, true);
  assert.equal(f.requests.length, 1);
  assert.equal(Object.keys(f.state().payments).length, 1);
});

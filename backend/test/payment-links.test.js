import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { createMemoryStore, createSyntheticState, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createPaymentService } from '../src/assistant/payments.js';

const actor = { id: SYNTHETIC_PATIENT_ID, role: 'citizen' };
const other = { id: '00000000-0000-4000-8000-000000000002', role: 'citizen' };
const code = (value) => (error) => error.code === value;

async function fixture({ mode = 'razorpay_link_test', mutateLink = (value) => value, mutatePayment = (value) => value, synthetic = !mode.endsWith('_live') } = {}) {
  const seed = createSyntheticState();
  // Explicit live-mode contract fixture; the provider below is always stubbed.
  if (!synthetic) for (const item of Object.values(seed.tests)) item.synthetic = false;
  const store = createMemoryStore(seed);
  const workflow = createWorkflowService({ store });
  const [slot] = await workflow.availability();
  const booking = await workflow.book(actor, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'link-fixture-booking' });
  const requests = [];
  let paid = false;
  let link;
  const config = { paymentMode: mode, paymentStage: 'booking', razorpayKeyId: mode.endsWith('_live') ? 'rzp_live_synthetic' : 'rzp_test_synthetic', razorpayKeySecret: 'synthetic-provider-secret', razorpayWebhookSecret: 'synthetic-webhook-secret' };
  const payments = createPaymentService({ store, workflow, config, fetchImpl: async (url, options) => {
    requests.push({ url, options });
    const entity = { id: 'pay_synthetic', order_id: 'order_synthetic', amount: 35000, currency: 'INR', status: 'captured', captured: true };
    if (url.endsWith('/payment_links')) {
      const body = JSON.parse(options.body);
      link = mutateLink({ id: 'plink_synthetic', amount: body.amount, currency: body.currency, reference_id: body.reference_id, accept_partial: false, short_url: 'https://rzp.io/rzp/synthetic', amount_paid: 0, status: 'created' });
      return Response.json(link);
    }
    if (url.endsWith('/payment_links/plink_synthetic')) return Response.json(mutateLink({ ...link, status: paid ? 'paid' : 'created', amount_paid: paid ? 35000 : 0, ...(paid ? { order_id: 'order_synthetic' } : {}) }));
    if (url.endsWith('/orders/order_synthetic/payments')) return Response.json({ items: [entity] });
    if (url.endsWith('/payments/pay_synthetic')) return Response.json(mutatePayment(entity));
    throw new Error('Unexpected synthetic provider URL');
  } });
  return { store, booking, payments, requests, config, setPaid: () => { paid = true; } };
}

test('hosted link is generated only by provider using persisted invoice amount, without notifications or patient data', async () => {
  const f = await fixture();
  const payment = await f.payments.createOrder(actor, f.booking.id, 'link-create-request');
  assert.equal(payment.paymentLinkId, 'plink_synthetic');
  assert.equal(payment.paymentUrl, 'https://rzp.io/rzp/synthetic');
  assert.equal(payment.label, 'Razorpay TEST MODE');
  assert.equal(payment.status, 'pending');
  const body = JSON.parse(f.requests[0].options.body);
  assert.deepEqual(body, { amount: 35000, currency: 'INR', accept_partial: false, reference_id: payment.id, description: 'LabSetu laboratory invoice', notify: { sms: false, email: false }, reminder_enable: false });
  assert.equal((await f.store.read((s) => s.payments[payment.id])).paymentUrl, payment.paymentUrl);
  assert.equal((await f.payments.status(actor, f.booking.id)).paid, false);
});

test('explicit live-link mode checks live credentials and keeps live receipts distinct from test receipts', async () => {
  const f = await fixture({ mode: 'razorpay_link_live' });
  const payment = await f.payments.createOrder(actor, f.booking.id, 'live-link-create-request');
  assert.equal(payment.label, 'Razorpay payment link');
  f.setPaid();
  const receipt = await f.payments.receipt(actor, f.booking.id);
  assert.equal(receipt.verified, true);
  assert.equal(receipt.label, 'Razorpay verified payment receipt');
  assert.equal(receipt.mode, 'razorpay_link_live');
  // All provider calls in this test are isolated fixtures; no actual payment is initiated.
  const wrongKey = createPaymentService({ store: f.store, workflow: {}, config: { ...f.config, razorpayKeyId: 'rzp_test_synthetic' } });
  await assert.rejects(wrongKey.createOrder(actor, f.booking.id, 'wrong-mode-request'), code('PAYMENT_CONFIGURATION'));
});

test('live links are denied for demo mode and synthetic booked tests without calling the provider', async () => {
  const f = await fixture({ mode: 'razorpay_link_live', synthetic: true });
  await assert.rejects(f.payments.createOrder(actor, f.booking.id, 'synthetic-live-request'), code('SYNTHETIC_PAYMENT_DENIED'));
  const demo = createPaymentService({ store: f.store, workflow: {}, config: { ...f.config, demoMode: true } });
  await assert.rejects(demo.createOrder(actor, f.booking.id, 'demo-live-request'), code('PAYMENT_CONFIGURATION'));
  assert.equal(f.requests.length, 0);
});

test('link creation never trusts an arbitrary, insecure or credential-bearing redirect URL', async () => {
  for (const short_url of ['https://example.test/pay', 'http://rzp.io/pay', 'https://rzp.io.evil.test/pay', 'https://user:secret@rzp.io/pay', 'javascript:alert(1)']) {
    const f = await fixture({ mutateLink: (link) => ({ ...link, short_url }) });
    await assert.rejects(f.payments.createOrder(actor, f.booking.id, 'untrusted-link-request'), code('PAYMENT_LINK_INVALID'));
    assert.equal((await f.store.read((s) => Object.values(s.payments)[0])).status, 'reconciliation_required');
    await assert.rejects(f.payments.createOrder(actor, f.booking.id, 'second-link-request'), code('PAYMENT_RECONCILIATION_REQUIRED'));
    assert.equal(f.requests.length, 1);
  }
});

test('mismatched provider link reference, amount, currency, or partial-payment policy fails closed', async () => {
  for (const change of [{ amount: 1 }, { currency: 'USD' }, { reference_id: 'other-invoice' }, { accept_partial: true }, { id: 'arbitrary-id' }, { status: 'paid', amount_paid: 35000 }]) {
    const f = await fixture({ mutateLink: (link) => ({ ...link, ...change }) });
    await assert.rejects(f.payments.createOrder(actor, f.booking.id, 'mismatched-link-request'), code('PAYMENT_LINK_MISMATCH'));
    assert.equal((await f.store.read((s) => s.invoices[f.booking.invoiceId])).status, 'unpaid');
  }
});

test('server refresh verifies paid link plus captured payment and creates one persistent receipt', async () => {
  const f = await fixture();
  const first = await f.payments.createOrder(actor, f.booking.id, 'verified-link-request');
  const retry = await f.payments.createOrder(actor, f.booking.id, 'another-confirmation');
  assert.equal(retry.id, first.id);
  assert.equal(f.requests.length, 1);
  f.setPaid();
  const result = await f.payments.status(actor, f.booking.id);
  assert.equal(result.paid, true);
  assert.equal(result.payments[0].providerPaymentId, 'pay_synthetic');
  assert.equal((await f.store.read((s) => s.invoices[f.booking.invoiceId])).status, 'paid');
  const receipt = await f.payments.receipt(actor, f.booking.id);
  assert.equal(receipt.verified, true);
  assert.match(receipt.label, /TEST/);
  assert.equal(await f.store.read((s) => Object.keys(s.receipts).length), 1);
  assert.ok(f.requests.some((request) => request.url.endsWith('/payments/pay_synthetic')));
});

test('captured payment must match link order, payment id, amount and currency before invoice is paid', async () => {
  for (const change of [{ order_id: 'order_other' }, { id: 'pay_other' }, { amount: 100 }, { currency: 'USD' }, { captured: false }, { status: 'authorized' }, { amount_refunded: 35000 }, { refund_status: 'processed' }]) {
    const f = await fixture({ mutatePayment: (entity) => ({ ...entity, ...change }) });
    await f.payments.createOrder(actor, f.booking.id, 'capture-mismatch-request');
    f.setPaid();
    await assert.rejects(f.payments.status(actor, f.booking.id));
    assert.equal((await f.store.read((s) => s.invoices[f.booking.invoiceId])).status, 'unpaid');
    assert.equal(await f.store.read((s) => Object.keys(s.receipts).length), 0);
  }
});

test('cross-patient payment refresh and creation are denied before provider calls', async () => {
  const f = await fixture();
  await f.payments.createOrder(actor, f.booking.id, 'scoped-link-request');
  const count = f.requests.length;
  await assert.rejects(f.payments.status(other, f.booking.id), code('BOOKING_NOT_FOUND'));
  await assert.rejects(f.payments.createOrder(other, f.booking.id, 'other-patient-link-request'));
  assert.equal(f.requests.length, count);
});

test('signed payment-link webhooks re-fetch provider evidence and deduplicate deliveries', async () => {
  const f = await fixture();
  await f.payments.createOrder(actor, f.booking.id, 'webhook-link-request');
  const raw = Buffer.from(JSON.stringify({ event: 'payment_link.paid', payload: { payment_link: { entity: { id: 'plink_synthetic', status: 'paid' } } } }));
  const signature = createHmac('sha256', f.config.razorpayWebhookSecret).update(raw).digest('hex');
  await assert.rejects(f.payments.webhook(raw, '0'.repeat(64), 'link-event'), code('INVALID_WEBHOOK_SIGNATURE'));
  // A signed event that claims payment cannot override current unpaid provider state.
  assert.equal((await f.payments.webhook(raw, signature, 'link-event-unpaid')).status, 'pending');
  assert.equal((await f.store.read((s) => s.invoices[f.booking.invoiceId])).status, 'unpaid');
  f.setPaid();
  assert.equal((await f.payments.webhook(raw, signature, 'link-event-paid')).status, 'captured');
  const count = f.requests.length;
  assert.equal((await f.payments.webhook(raw, signature, 'link-event-paid')).duplicate, true);
  assert.equal(f.requests.length, count);
});

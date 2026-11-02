import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';

// All provider traffic is fixed to Razorpay's API. User/tool input never controls a URL.
const API = 'https://api.razorpay.com/v1';
const now = () => new Date().toISOString();
const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(value);
const providerId = (value, prefix) => typeof value === 'string' && new RegExp(`^${prefix}_[A-Za-z0-9]+$`).test(value);

function fail(status, code, message) {
  throw Object.assign(new Error(message), { status, code });
}

function checkSignature(message, signature, secret) {
  if (typeof signature !== 'string' || !/^[a-fA-F0-9]{64}$/.test(signature)) return false;
  const expected = createHmac('sha256', secret).update(message).digest();
  const actual = Buffer.from(signature, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function authorise(actor, booking, { paymentAction = false } = {}) {
  if (!actor?.id) fail(401, 'UNAUTHENTICATED', 'Authentication is required.');
  if (!booking) fail(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
  const owner = actor.role === 'citizen' && actor.id === booking.patientId;
  const staff = actor.role === 'authority' && actor.labId === booking.labId;
  if (!owner && (!staff || paymentAction)) fail(404, 'BOOKING_NOT_FOUND', 'Booking not found.');
}

function audit(state, actorId, action, resourceId) {
  state.auditEvents ||= {};
  const id = randomUUID();
  state.auditEvents[id] = { id, actorId, action, resourceId, createdAt: now() };
}

function publicPayment(payment, keyId) {
  const { id, orderId, bookingId, invoiceId, amountPaise, currency, status, mode, providerPaymentId, createdAt, updatedAt } = payment;
  return { id, orderId, bookingId, invoiceId, amountPaise, currency, status, mode,
    simulated: mode === 'simulated', label: mode === 'simulated' ? 'SIMULATED TEST PAYMENT — no money charged' : 'Razorpay TEST MODE',
    ...(mode === 'razorpay_test' ? { keyId } : {}), ...(providerPaymentId ? { providerPaymentId } : {}), createdAt, updatedAt };
}

export function createPaymentService({ store, workflow, config = {}, fetchImpl = globalThis.fetch }) {
  const mode = config.paymentMode || 'disabled';
  const stage = config.paymentStage || 'report_ready';
  const keyId = config.razorpayKeyId || '';
  const keySecret = config.razorpayKeySecret || '';
  const webhookSecret = config.razorpayWebhookSecret || '';

  function configured() {
    if (!['report_ready', 'booking'].includes(stage)) fail(503, 'PAYMENT_CONFIGURATION', 'Payment timing is not configured correctly.');
    if (mode === 'simulated') {
      if (config.demoMode !== true) fail(503, 'PAYMENT_CONFIGURATION', 'Simulated payments are available only in explicit local demo mode.');
    } else if (mode === 'razorpay_test') {
      if (!/^rzp_test_[A-Za-z0-9]+$/.test(keyId) || !keySecret) {
        fail(503, 'PAYMENT_CONFIGURATION', 'Razorpay TEST credentials are required. Live payments are disabled.');
      }
    } else fail(503, 'PAYMENTS_DISABLED', 'Payments are not configured.');
  }

  async function provider(path, options = {}) {
    configured();
    let response;
    try {
      response = await fetchImpl(`${API}${path}`, {
        ...options,
        headers: { authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`, 'content-type': 'application/json' },
        signal: AbortSignal.timeout(12000)
      });
    } catch {
      fail(503, 'PAYMENT_PROVIDER_UNAVAILABLE', 'The payment provider could not be reached. Check payment status before retrying.');
    }
    if (!response.ok) fail(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider could not complete this request.');
    try { return await response.json(); } catch { fail(502, 'PAYMENT_PROVIDER_ERROR', 'The payment provider returned an invalid response.'); }
  }

  function records(state) {
    state.payments ||= {};
    state.receipts ||= {};
    state.paymentWebhookEvents ||= {};
  }

  function invoiceFor(state, booking) {
    const invoice = state.invoices?.[booking.invoiceId];
    if (!invoice || invoice.patientId !== booking.patientId || invoice.bookingId !== booking.id) fail(409, 'INVOICE_UNAVAILABLE', 'The booking invoice is unavailable.');
    if (!Number.isSafeInteger(invoice.totalPaise) || invoice.totalPaise <= 0 || invoice.currency !== 'INR') fail(409, 'INVALID_INVOICE', 'A valid INR invoice total is required.');
    if (invoice.status === 'void' || booking.status === 'cancelled') fail(409, 'BOOKING_CANCELLED', 'Payment is unavailable for a cancelled booking.');
    return invoice;
  }

  async function createOrder(actor, bookingId, idempotencyKey) {
    configured();
    if (!validId(bookingId) || typeof idempotencyKey !== 'string' || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) {
      fail(400, 'INVALID_PAYMENT_REQUEST', 'A valid booking and idempotency key are required.');
    }
    // Materialise an invoice using authoritative workflow pricing, never a browser amount.
    await workflow.invoice(actor, bookingId);
    const reservation = await store.transaction((state) => {
      records(state);
      const booking = state.appointments?.[bookingId];
      authorise(actor, booking, { paymentAction: true });
      const invoice = invoiceFor(state, booking);
      const sameKey = Object.values(state.payments).find((item) => item.patientId === actor.id && item.idempotencyKey === idempotencyKey);
      if (sameKey && sameKey.bookingId !== bookingId) fail(409, 'IDEMPOTENCY_CONFLICT', 'This request key has already been used for another booking.');
      const existing = sameKey || Object.values(state.payments).find((item) => item.invoiceId === invoice.id && !['failed', 'creation_failed'].includes(item.status));
      if (existing) {
        if (['creating', 'reconciliation_required'].includes(existing.status)) fail(409, 'PAYMENT_RECONCILIATION_REQUIRED', 'An order request is pending provider reconciliation. Do not create another payment. Contact the laboratory.');
        return { payment: existing, create: false };
      }
      if (invoice.status === 'paid') fail(409, 'INVOICE_ALREADY_PAID', 'This invoice is already paid.');
      const reportStatus = state.reports?.[bookingId]?.status || booking.reportStatus;
      if (stage === 'report_ready' && !['approved', 'released'].includes(reportStatus)) fail(409, 'REPORT_NOT_READY', 'Payment opens after an authorised professional approves your report.');
      const id = `PAY-${randomUUID()}`;
      const payment = { id, bookingId, invoiceId: invoice.id, patientId: booking.patientId, labId: booking.labId,
        idempotencyKey, amountPaise: invoice.totalPaise, currency: invoice.currency, mode, status: 'creating', createdAt: now(), updatedAt: now() };
      state.payments[id] = payment;
      audit(state, actor.id, 'payment.order_requested', id);
      return { payment, create: true };
    });
    if (!reservation.create) return publicPayment(reservation.payment, keyId);
    let order;
    try {
      order = mode === 'simulated'
        ? { id: `sim_order_${randomUUID().replaceAll('-', '')}`, amount: reservation.payment.amountPaise, currency: 'INR' }
        : await provider('/orders', { method: 'POST', body: JSON.stringify({ amount: reservation.payment.amountPaise, currency: reservation.payment.currency,
          receipt: reservation.payment.id.slice(0, 40), notes: { invoice_id: reservation.payment.invoiceId } }) });
      if ((mode === 'razorpay_test' && !providerId(order.id, 'order')) || order.amount !== reservation.payment.amountPaise || order.currency !== reservation.payment.currency) {
        fail(502, 'PAYMENT_PROVIDER_MISMATCH', 'The payment order did not match the verified invoice.');
      }
    } catch (error) {
      await store.transaction((state) => {
        const payment = state.payments[reservation.payment.id];
        payment.status = 'reconciliation_required';
        payment.updatedAt = now();
        audit(state, actor.id, 'payment.order_reconciliation_required', payment.id);
      });
      throw error;
    }
    return store.transaction((state) => {
      const payment = state.payments[reservation.payment.id];
      payment.orderId = order.id;
      payment.status = 'pending';
      payment.updatedAt = now();
      return publicPayment(payment, keyId);
    });
  }

  async function locate(actor, orderId) {
    if (!providerId(orderId, 'order')) fail(400, 'INVALID_ORDER', 'A valid provider order identifier is required.');
    return store.read((state) => {
      const payment = Object.values(state.payments || {}).find((item) => item.orderId === orderId && item.mode === 'razorpay_test');
      if (!payment) fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
      authorise(actor, state.appointments?.[payment.bookingId], { paymentAction: true });
      return payment;
    });
  }

  function validateProviderPayment(payment, entity) {
    if (!entity || !providerId(entity.id, 'pay') || entity.order_id !== payment.orderId || entity.amount !== payment.amountPaise || entity.currency !== payment.currency) {
      fail(409, 'PAYMENT_MISMATCH', 'The provider payment does not match this invoice.');
    }
  }

  async function applyPayment(paymentId, entity, actorId, { eventId, eventHash } = {}) {
    return store.transaction((state) => {
      records(state);
      if (eventId && state.paymentWebhookEvents[eventId]) return { duplicate: true };
      const payment = state.payments[paymentId];
      if (!payment) fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
      if (payment.mode === 'razorpay_test') validateProviderPayment(payment, entity);
      const booking = state.appointments[payment.bookingId];
      const invoice = invoiceFor(state, booking);
      if (invoice.id !== payment.invoiceId || invoice.totalPaise !== payment.amountPaise || invoice.currency !== payment.currency) {
        fail(409, 'INVOICE_CHANGED', 'The invoice changed after the payment order was created. Contact the laboratory for reconciliation.');
      }
      const another = Object.values(state.payments).find((item) => item.id !== payment.id && item.providerPaymentId === entity.id);
      if (another) fail(409, 'PAYMENT_ALREADY_ASSOCIATED', 'This provider payment is already associated with another order.');
      const wasCaptured = payment.status === 'captured';
      const captured = entity.status === 'captured' && entity.captured === true;
      if (captured) {
        payment.status = 'captured';
        if (!wasCaptured) payment.providerPaymentId = entity.id;
        payment.paidAt ||= now();
        invoice.status = 'paid';
        invoice.paidAt ||= payment.paidAt;
        let receipt = Object.values(state.receipts).find((item) => item.invoiceId === invoice.id);
        if (!receipt) {
          const id = `RCP-${randomUUID()}`;
          receipt = { id, bookingId: booking.id, invoiceId: invoice.id, patientId: booking.patientId, paymentId: payment.id,
            providerPaymentId: entity.id, amountPaise: payment.amountPaise, currency: payment.currency, paidAt: payment.paidAt, mode: payment.mode,
            verified: payment.mode === 'razorpay_test', verification: payment.mode === 'razorpay_test' ? 'razorpay_capture_verified' : 'simulated_test_payment',
            label: payment.mode === 'simulated' ? 'SIMULATED TEST RECEIPT — no money charged' : 'Razorpay TEST payment receipt' };
          state.receipts[id] = receipt;
        }
        payment.receiptId = receipt.id;
        if (!wasCaptured) audit(state, actorId, payment.mode === 'simulated' ? 'payment.simulated_capture' : 'payment.capture_verified', payment.id);
      } else if (!wasCaptured) {
        payment.status = entity.status === 'failed' ? 'failed' : 'pending';
        payment.providerPaymentId = entity.id;
        audit(state, actorId, `payment.${payment.status}`, payment.id);
      }
      payment.updatedAt = now();
      if (eventId) state.paymentWebhookEvents[eventId] = { id: eventId, hash: eventHash, paymentId, createdAt: now() };
      return { ...publicPayment(payment, keyId), ...(payment.receiptId ? { receipt: state.receipts[payment.receiptId] } : {}) };
    });
  }

  async function verify(actor, { orderId, paymentId, signature } = {}) {
    configured();
    if (mode !== 'razorpay_test') fail(409, 'PAYMENT_MODE_MISMATCH', 'Provider verification is available only in Razorpay TEST mode.');
    if (!providerId(paymentId, 'pay')) fail(400, 'INVALID_PAYMENT', 'A valid payment identifier is required.');
    const payment = await locate(actor, orderId);
    // The order identifier is retrieved from our store, not accepted as an authoritative browser value.
    if (!checkSignature(`${payment.orderId}|${paymentId}`, signature, keySecret)) fail(400, 'INVALID_PAYMENT_SIGNATURE', 'Payment signature verification failed.');
    const entity = await provider(`/payments/${paymentId}`);
    validateProviderPayment(payment, entity);
    if (entity.id !== paymentId) fail(409, 'PAYMENT_MISMATCH', 'The provider returned a different payment.');
    return applyPayment(payment.id, entity, actor.id);
  }

  async function webhook(rawBody, signature, eventId) {
    configured();
    if (mode !== 'razorpay_test' || !webhookSecret) fail(503, 'WEBHOOK_NOT_CONFIGURED', 'The Razorpay TEST webhook is not configured.');
    if (!Buffer.isBuffer(rawBody)) fail(400, 'INVALID_WEBHOOK_BODY', 'The original webhook request bytes are required.');
    if (!checkSignature(rawBody, signature, webhookSecret)) fail(400, 'INVALID_WEBHOOK_SIGNATURE', 'Webhook signature verification failed.');
    const hash = createHash('sha256').update(rawBody).digest('hex');
    const id = typeof eventId === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(eventId) ? eventId : hash;
    const duplicate = await store.read((state) => state.paymentWebhookEvents?.[id]);
    if (duplicate) return { accepted: true, duplicate: true };
    let event;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch { fail(400, 'INVALID_WEBHOOK_JSON', 'The webhook payload must be valid JSON.'); }
    if (!['payment.captured', 'payment.authorized', 'payment.failed', 'order.paid'].includes(event.event)) return { accepted: true, ignored: true };
    const entity = event.payload?.payment?.entity;
    if (!providerId(entity?.id, 'pay') || !providerId(entity?.order_id, 'order')) fail(400, 'INVALID_WEBHOOK_PAYMENT', 'The webhook is missing a valid payment reference.');
    const payment = await store.read((state) => Object.values(state.payments || {}).find((item) => item.orderId === entity.order_id && item.mode === 'razorpay_test'));
    if (!payment) return { accepted: true, ignored: true };
    // Re-fetch current state, because signed webhook events can arrive out of order.
    const current = await provider(`/payments/${entity.id}`);
    validateProviderPayment(payment, current);
    if (current.id !== entity.id) fail(409, 'PAYMENT_MISMATCH', 'The provider returned a different payment.');
    const result = await applyPayment(payment.id, current, 'razorpay_webhook', { eventId: id, eventHash: hash });
    return { accepted: true, duplicate: result.duplicate === true, status: result.status };
  }

  async function status(actor, bookingId) {
    if (!validId(bookingId)) fail(400, 'INVALID_BOOKING', 'A valid booking identifier is required.');
    return store.read((state) => {
      authorise(actor, state.appointments?.[bookingId]);
      const payments = Object.values(state.payments || {}).filter((item) => item.bookingId === bookingId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { mode, payments: payments.map((item) => publicPayment(item, keyId)), paid: payments.some((item) => item.status === 'captured') };
    });
  }

  async function receipt(actor, bookingId) {
    if (!validId(bookingId)) fail(400, 'INVALID_BOOKING', 'A valid booking identifier is required.');
    return store.read((state) => {
      authorise(actor, state.appointments?.[bookingId]);
      const result = Object.values(state.receipts || {}).find((item) => item.bookingId === bookingId);
      if (!result) fail(404, 'RECEIPT_NOT_AVAILABLE', 'A receipt is available after verified payment or an explicitly simulated test payment.');
      return result;
    });
  }

  async function simulate(actor, paymentId, outcome) {
    configured();
    if (mode !== 'simulated') fail(403, 'SIMULATION_DISABLED', 'Simulated payments are disabled.');
    if (!validId(paymentId) || !['captured', 'failed'].includes(outcome)) fail(400, 'INVALID_SIMULATION', 'Select a valid simulated payment outcome.');
    const payment = await store.read((state) => {
      const value = state.payments?.[paymentId];
      if (!value || value.mode !== 'simulated') fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
      authorise(actor, state.appointments?.[value.bookingId], { paymentAction: true });
      if (!value.orderId) fail(409, 'ORDER_NOT_READY', 'The payment order is not ready.');
      return value;
    });
    return applyPayment(paymentId, { id: payment.providerPaymentId || `sim_pay_${randomUUID().replaceAll('-', '')}`, status: outcome, captured: outcome === 'captured' }, actor.id);
  }

  return { createOrder, verify, webhook, status, receipt, simulate };
}

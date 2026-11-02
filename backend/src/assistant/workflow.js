import { randomUUID } from 'node:crypto';

export function fail(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  throw error;
}

const validId = (value) => typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,159}$/.test(value);
export function requireId(value, field = 'id') {
  if (!validId(value)) fail(400, 'invalid_identifier', `${field} is invalid.`);
  return value;
}
export function requireActor(actor) {
  if (!actor || !validId(actor.id) || !['citizen', 'authority'].includes(actor.role)) fail(401, 'unauthenticated', 'Sign in with a valid account.');
  if (actor.role === 'authority' && !validId(actor.labId)) fail(403, 'laboratory_scope_required', 'A trusted laboratory scope is required.');
}
export function owns(actor, record) {
  requireActor(actor);
  if (!record || (actor.role === 'citizen' ? record.patientId !== actor.id : record.labId !== actor.labId)) fail(404, 'record_not_found', 'This record was not found in your account.');
  return record;
}
export function recordAudit(state, actor, action, resourceId, metadata = {}) {
  const id = randomUUID();
  state.auditEvents[id] = { id, actorId: actor.id, role: actor.role, action, resourceId, metadata, createdAt: new Date().toISOString() };
}

const normalise = (value) => String(value || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const nowIso = () => new Date().toISOString();
function visibleTest(test) { return test && test.active !== false; }
function testIdsChecked(state, ids) {
  if (!Array.isArray(ids) || !ids.length || ids.length > 20 || ids.some((id) => !validId(id)) || new Set(ids).size !== ids.length) fail(400, 'invalid_tests', 'Select between 1 and 20 different catalogue tests.');
  return ids.map((id) => {
    const test = state.tests[id];
    if (!visibleTest(test)) fail(404, 'test_unavailable', 'A selected test is unavailable. Please choose again.');
    if (!Number.isSafeInteger(test.pricePaise) || test.pricePaise <= 0 || test.currency !== 'INR') fail(409, 'price_unavailable', 'A selected test has no valid configured price. Contact the laboratory.');
    return test;
  });
}
const requireCitizen = (actor) => { requireActor(actor); if (actor.role !== 'citizen') fail(403, 'patient_only', 'This action requires a patient account.'); };
function bookingFromState(state, actor, id) { requireId(id, 'bookingId'); return owns(actor, state.appointments[id]); }
function bookedTests(state, booking) { return booking.bookedTests || booking.testIds.map((id) => state.tests[id]).filter(Boolean); }
function aggregate(state, booking) {
  const token = booking.registrationToken;
  const expired = token && ['registered', 'called'].includes(token.status) && Date.parse(token.expiresAt) <= Date.now();
  const tokenStatus = expired ? 'expired' : token?.status;
  const queuePosition = tokenStatus && ['registered', 'called'].includes(tokenStatus)
    ? Object.values(state.appointments).filter((other) => {
      const current = other.registrationToken;
      return other.labId === booking.labId && other.slotId === booking.slotId
        && ['registered', 'called'].includes(current?.status) && Date.parse(current.expiresAt) > Date.now()
        && current.sequence < token.sequence;
    }).length + 1
    : null;
  return {
    ...booking,
    registrationToken: token ? { ...token, status: tokenStatus, queuePosition } : null,
    tests: bookedTests(state, booking),
    slot: state.slots[booking.slotId],
    invoice: state.invoices[booking.invoiceId],
    sample: state.samples[booking.id],
    report: reportMetadata(state.reports[booking.id])
  };
}
function reportMetadata(report) {
  if (!report) return { status: 'awaiting_results' };
  // Clinical values are supplied exclusively by the separately authorized report retrieval path.
  const { results: _results, ...metadata } = report;
  return metadata;
}
function basisPoints(value, label) {
  const parsed = value === undefined ? 0 : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 10000) throw new Error(`${label} must be an integer from 0 to 10000.`);
  return parsed;
}

export function createWorkflowService({ store, config = {} }) {
  const discountBps = basisPoints(config.discountBps, 'discountBps');
  const taxBps = basisPoints(config.taxBps, 'taxBps');
  const paymentTiming = config.paymentTiming || (config.paymentStage === 'booking' ? 'at_booking' : 'after_report');
  const requirePaymentForReport = config.requirePaymentForReport !== false;
  if (!['after_report', 'at_booking'].includes(paymentTiming)) throw new Error('paymentTiming must be after_report or at_booking.');
  function calculateAmounts(tests) {
    const items = tests.map((test) => ({ testId: test.id, name: test.name, quantity: 1, unitPricePaise: test.pricePaise, totalPaise: test.pricePaise }));
    const subtotalPaise = items.reduce((sum, item) => sum + item.totalPaise, 0);
    const discountPaise = Math.round(subtotalPaise * discountBps / 10000);
    const taxPaise = Math.round((subtotalPaise - discountPaise) * taxBps / 10000);
    const totalPaise = subtotalPaise - discountPaise + taxPaise;
    if (![subtotalPaise, discountPaise, taxPaise, totalPaise].every(Number.isSafeInteger) || totalPaise <= 0) fail(409, 'invalid_invoice', 'The configured prices cannot produce a valid invoice. Contact the laboratory.');
    return { items, subtotalPaise, discountPaise, taxPaise, discountBps, taxBps, totalPaise };
  }
  function makeInvoice(state, actor, booking, tests) {
    const amounts = calculateAmounts(tests);
    const invoice = { id: `INV-${randomUUID()}`, bookingId: booking.id, patientId: actor.id, patientName: booking.patientName, labId: booking.labId, currency: 'INR', ...amounts, status: 'unpaid', paymentTiming, createdAt: nowIso() };
    state.invoices[invoice.id] = invoice;
    recordAudit(state, actor, 'invoice.created', invoice.id, { bookingId: booking.id, totalPaise: invoice.totalPaise });
    return invoice;
  }
  return {
    store,
    config: { paymentTiming, requirePaymentForReport },
    async searchTests(query = '') {
      if (typeof query !== 'string' || query.length > 200) fail(400, 'invalid_query', 'Search text must be at most 200 characters.');
      const needle = normalise(query);
      return store.read((state) => Object.values(state.tests).filter((test) => visibleTest(test) && (!needle || [test.name, test.code, ...(test.aliases || [])].some((value) => normalise(value).includes(needle)))).slice(0, 100));
    },
    async testDetails(id) {
      requireId(id, 'testId');
      return store.read((state) => { const test = state.tests[id]; if (!visibleTest(test)) fail(404, 'test_unavailable', 'This test is unavailable.'); return test; });
    },
    async prices(ids) {
      return store.read((state) => { const tests = testIdsChecked(state, ids); return { currency: 'INR', tests: tests.map(({ id, name, pricePaise }) => ({ id, name, pricePaise })), ...calculateAmounts(tests) }; });
    },
    async availability(date) {
      const parsedDate = new Date(`${date}T00:00:00Z`);
      if (date !== undefined && date !== null && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date || date.startsWith('0000'))) fail(400, 'invalid_date', 'Use a valid date in YYYY-MM-DD format.');
      return store.read((state) => Object.values(state.slots).filter((slot) => slot.active !== false && (!date || slot.date === date) && Date.parse(slot.startsAt || `${slot.date}T${slot.startTime}:00+05:30`) > Date.now()).map((slot) => ({ ...slot, remaining: Math.max(0, slot.capacity - Object.values(state.appointments).filter((booking) => booking.slotId === slot.id && booking.status !== 'cancelled').length) })).filter((slot) => slot.remaining > 0).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)).slice(0, 100));
    },
    async book(actor, { testIds, slotId, idempotencyKey, expectedQuote }) {
      requireCitizen(actor); requireId(slotId, 'slotId'); requireId(idempotencyKey, 'idempotencyKey');
      return store.transaction((state) => {
        const existing = Object.values(state.appointments).find((booking) => booking.patientId === actor.id && booking.idempotencyKey === idempotencyKey);
        if (existing) {
          if (existing.slotId !== slotId || JSON.stringify([...existing.testIds].sort()) !== JSON.stringify([...(testIds || [])].sort())) fail(409, 'idempotency_conflict', 'This request key was already used for different booking details.');
          return aggregate(state, existing);
        }
        const tests = testIdsChecked(state, testIds);
        if (expectedQuote !== undefined) {
          const current = calculateAmounts(tests);
          if (!expectedQuote || expectedQuote.currency !== 'INR' || expectedQuote.totalPaise !== current.totalPaise || !Array.isArray(expectedQuote.tests) || expectedQuote.tests.length !== tests.length || tests.some((test) => !expectedQuote.tests.some((quoted) => quoted.id === test.id && quoted.pricePaise === test.pricePaise))) fail(409, 'quote_changed', 'The catalogue prices have changed. Review the updated quote and confirm again.');
        }
        const slot = state.slots[slotId];
        const startsAt = slot ? Date.parse(slot.startsAt || `${slot.date}T${slot.startTime}:00+05:30`) : NaN;
        if (!slot || slot.active === false || !Number.isSafeInteger(slot.capacity) || slot.capacity < 1 || !Number.isFinite(startsAt) || startsAt <= Date.now()) fail(409, 'slot_unavailable', 'This collection slot is unavailable. Choose another slot.');
        if (tests.some((test) => test.labId !== slot.labId)) fail(409, 'laboratory_mismatch', 'Select tests and a collection slot from the same laboratory.');
        const reserved = Object.values(state.appointments).filter((booking) => booking.slotId === slot.id && booking.status !== 'cancelled');
        if (reserved.some((booking) => booking.patientId === actor.id)) fail(409, 'duplicate_booking', 'You already have a booking for this slot.');
        if (reserved.length >= slot.capacity) fail(409, 'slot_full', 'This collection slot has just filled. Choose another slot.');
        for (const appointment of Object.values(state.appointments)) {
          const token = appointment.registrationToken;
          if (!token || token.patientId !== actor.id || token.labId !== slot.labId || !['registered', 'called'].includes(token.status)) continue;
          if (Date.parse(token.expiresAt) <= Date.now()) {
            token.status = 'expired';
            token.updatedAt = nowIso();
          } else fail(409, 'active_registration_token', 'You already have an active registration token at this laboratory.');
        }
        const booking = { id: `APT-${randomUUID()}`, patientId: actor.id, patientName: String(actor.name || 'Patient').slice(0, 120), labId: slot.labId, testIds: [...testIds], bookedTests: tests.map(({ id, name, pricePaise, currency, parameters, synthetic }) => ({ id, name, pricePaise, currency, parameters: structuredClone(parameters || []), synthetic: synthetic === true })), slotId, date: slot.date, startTime: slot.startTime, status: 'confirmed', idempotencyKey, createdAt: nowIso() };
        const tokenSequence = Object.values(state.appointments).filter((appointment) => appointment.labId === slot.labId && appointment.date === slot.date && appointment.registrationToken).length + 1;
        const expiresAt = new Date(startsAt + 2 * 60 * 60 * 1000).toISOString();
        booking.registrationToken = {
          id: `TOK-${randomUUID()}`,
          tokenNumber: `LS-${slot.date.replaceAll('-', '')}-${String(tokenSequence).padStart(3, '0')}`,
          patientId: actor.id,
          labId: slot.labId,
          facilityId: slot.labId,
          appointmentId: booking.id,
          slotId: slot.id,
          sequence: tokenSequence,
          service: tests.map((test) => test.name),
          status: 'registered',
          createdAt: nowIso(),
          expiresAt,
          updatedAt: nowIso()
        };
        const invoice = makeInvoice(state, actor, booking, tests);
        booking.invoiceId = invoice.id;
        state.appointments[booking.id] = booking;
        state.samples[booking.id] = { id: `SMP-${randomUUID()}`, bookingId: booking.id, patientId: actor.id, labId: booking.labId, status: 'awaiting_collection', updatedAt: nowIso() };
        state.reports[booking.id] = { id: `REP-${randomUUID()}`, bookingId: booking.id, patientId: actor.id, patientName: booking.patientName, labId: booking.labId, testNames: tests.map((test) => test.name), status: 'awaiting_results', results: [], updatedAt: nowIso() };
        recordAudit(state, actor, 'appointment.created', booking.id, { testIds, slotId });
        return aggregate(state, booking);
      });
    },
    async appointments(actor) {
      requireActor(actor);
      return store.read((state) => Object.values(state.appointments).filter((booking) => actor.role === 'citizen' ? booking.patientId === actor.id : booking.labId === actor.labId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((booking) => aggregate(state, booking)));
    },
    async booking(actor, id) { return store.read((state) => aggregate(state, bookingFromState(state, actor, id))); },
    async invoice(actor, bookingId) {
      return store.read((state) => { const booking = bookingFromState(state, actor, bookingId); const invoice = state.invoices[booking.invoiceId]; if (!invoice) fail(409, 'invoice_missing', 'This booking has no persisted invoice. Contact the laboratory.'); return invoice; });
    },
    async invoiceDetails(actor, invoiceId) { requireId(invoiceId, 'invoiceId'); return store.read((state) => owns(actor, state.invoices[invoiceId])); },
    async sample(actor, bookingId) { return store.read((state) => { bookingFromState(state, actor, bookingId); return state.samples[bookingId]; }); },
    async reportStatus(actor, bookingId) {
      return store.read((state) => { bookingFromState(state, actor, bookingId); const report = state.reports[bookingId]; const invoice = state.invoices[state.appointments[bookingId].invoiceId]; return { ...reportMetadata(report), ready: ['approved', 'released'].includes(report?.status), accessAllowed: ['approved', 'released'].includes(report?.status) && (!requirePaymentForReport || invoice?.status === 'paid' || actor.role === 'authority'), paymentRequired: requirePaymentForReport && invoice?.status !== 'paid' }; });
    },
    async report(actor, bookingId) {
      return store.read((state) => {
        const booking = bookingFromState(state, actor, bookingId);
        const report = state.reports[bookingId];
        if (!report || !['approved', 'released'].includes(report.status)) fail(403, 'report_not_approved', 'The report is awaiting authorized clinical approval.');
        if (actor.role === 'citizen' && requirePaymentForReport && state.invoices[booking.invoiceId]?.status !== 'paid') fail(402, 'payment_required', 'Your approved report is ready. Complete the verified payment to access it.');
        return { ...report, tests: bookedTests(state, booking).map(({ id, name }) => ({ id, name })), bookingDate: booking.date, laboratoryName: config.laboratoryName || 'LabSetu Diagnostics', synthetic: bookedTests(state, booking).some((test) => test.synthetic === true) };
      });
    },
    async staffReport(actor, bookingId) {
      requireActor(actor); if (actor.role !== 'authority') fail(403, 'staff_only', 'Laboratory staff access is required.');
      return store.read((state) => { bookingFromState(state, actor, bookingId); return state.reports[bookingId]; });
    },
    async cancel(actor, id) {
      requireCitizen(actor);
      return store.transaction((state) => {
        const booking = bookingFromState(state, actor, id);
        if (booking.status === 'cancelled') return aggregate(state, booking);
        if (state.samples[id]?.status !== 'awaiting_collection' || state.invoices[booking.invoiceId]?.status === 'paid' || Object.values(state.payments).some((payment) => payment.invoiceId === booking.invoiceId && !['failed', 'cancelled'].includes(payment.status))) fail(409, 'cancellation_unavailable', 'This booking requires staff assistance for cancellation or refund.');
        booking.status = 'cancelled'; booking.cancelledAt = nowIso();
        if (booking.registrationToken && ['registered', 'called'].includes(booking.registrationToken.status)) {
          booking.registrationToken.status = 'cancelled';
          booking.registrationToken.updatedAt = nowIso();
        }
        state.invoices[booking.invoiceId].status = 'void';
        recordAudit(state, actor, 'appointment.cancelled', id);
        return aggregate(state, booking);
      });
    },
    async staffTransition(actor, bookingId, { entity, status, results } = {}) {
      requireActor(actor); if (actor.role !== 'authority') fail(403, 'staff_only', 'Only authorized laboratory staff may update the clinical workflow.');
      if (!['sample', 'report', 'appointment', 'token'].includes(entity) || typeof status !== 'string') fail(400, 'invalid_transition', 'Specify a supported entity and status.');
      return store.transaction((state) => {
        const booking = bookingFromState(state, actor, bookingId);
        if (booking.status === 'cancelled') fail(409, 'booking_cancelled', 'A cancelled booking cannot be processed.');
        const transitions = {
          sample: { awaiting_collection: ['collected'], collected: ['processing'], processing: ['processing_complete'], processing_complete: [] },
          report: { awaiting_results: ['draft'], draft: ['draft', 'pending_verification'], pending_verification: ['draft', 'approved'], approved: ['released'], released: [] },
          appointment: { pending: ['confirmed', 'cancelled'], confirmed: ['completed'], completed: [], cancelled: [] },
          token: { registered: ['called', 'cancelled', 'expired'], called: ['completed', 'cancelled', 'expired'], completed: [], cancelled: [], expired: [] }
        };
        const record = entity === 'sample' ? state.samples[bookingId] : entity === 'report' ? state.reports[bookingId] : entity === 'token' ? booking.registrationToken : booking;
        if (!record || !transitions[entity][record.status]?.includes(status)) fail(409, 'invalid_transition', 'This status transition is not allowed.');
        if (entity === 'token' && ['registered', 'called'].includes(record.status) && Date.parse(record.expiresAt) <= Date.now() && status !== 'expired') fail(409, 'token_expired', 'This registration token has expired and cannot be called or completed.');
        if (entity === 'report') {
          if (state.samples[bookingId]?.status !== 'processing_complete') fail(409, 'sample_incomplete', 'Laboratory processing must finish before results can be prepared.');
          if (status === 'draft' && results !== undefined) {
            if (!Array.isArray(results) || results.length > 100) fail(400, 'invalid_results', 'Provide a valid list of laboratory results.');
            const keys = new Set();
            record.results = results.map((result) => {
              if (!result || typeof result !== 'object' || !booking.testIds.includes(result.testId)) fail(400, 'invalid_results', 'Every result must belong to a booked test.');
              const test = bookedTests(state, booking).find((entry) => entry.id === result.testId);
              const parameter = test.parameters?.find((entry) => entry.name === result.name);
              if (!parameter || typeof result.value !== 'string' && typeof result.value !== 'number' || !String(result.value).trim() || String(result.value).length > 100 || (typeof result.value === 'number' && !Number.isFinite(result.value))) fail(400, 'invalid_results', 'Each result needs a configured parameter and a valid staff-entered value.');
              const key = `${result.testId}:${result.name}`;
              if (keys.has(key)) fail(400, 'duplicate_result', 'Each laboratory parameter may be entered only once.');
              keys.add(key);
              return { testId: result.testId, name: parameter.name, value: String(result.value).trim(), unit: parameter.unit, referenceRange: parameter.referenceRange, enteredBy: actor.id, enteredAt: nowIso() };
            });
            record.enteredBy = actor.id;
          } else if (results !== undefined) fail(400, 'result_update_denied', 'Results can only be entered while saving a draft.');
          if (status === 'pending_verification' || status === 'approved') {
            const expected = bookedTests(state, booking).flatMap((test) => (test.parameters || []).map((parameter) => `${test.id}:${parameter.name}`));
            if (!expected.length || expected.some((key) => !record.results.some((result) => `${result.testId}:${result.name}` === key))) fail(409, 'results_incomplete', 'Enter every configured laboratory parameter before verification.');
          }
          if (status === 'approved' || status === 'released') {
            if (actor.canApproveReports !== true) fail(403, 'approval_permission_required', 'Clinical report approval permission is required.');
            if (status === 'approved') { record.approvedBy = actor.id; record.approvedByName = String(actor.name || actor.id).slice(0, 120); record.approvedAt = nowIso(); }
            if (status === 'released') { record.releasedBy = actor.id; record.releasedAt = nowIso(); }
          }
        }
        if (entity === 'appointment' && status === 'completed' && !['approved', 'released'].includes(state.reports[bookingId]?.status)) fail(409, 'report_incomplete', 'Clinical report approval is required before completion.');
        record.status = status; record.updatedAt = nowIso();
        if (entity === 'report' && status === 'approved') {
          const notificationId = `report-ready:${bookingId}`;
          state.notifications[notificationId] = { id: notificationId, patientId: booking.patientId, bookingId, type: 'report_ready', message: 'Your laboratory report has been approved and is ready. Review your invoice and payment status to access it.', createdAt: nowIso() };
        }
        recordAudit(state, actor, `${entity}.${status}`, bookingId);
        return aggregate(state, booking);
      });
    },
    async notifications(actor) { requireCitizen(actor); return store.read((state) => Object.values(state.notifications).filter((row) => row.patientId === actor.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))); }
  };
}

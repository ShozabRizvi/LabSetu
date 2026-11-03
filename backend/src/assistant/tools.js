import Ajv from 'ajv';
import { randomUUID } from 'node:crypto';
import { fault } from './config.js';

const ajv = new Ajv({ allErrors: false });
const text = { type: 'string', minLength: 1, maxLength: 150 };
const id = { ...text, pattern: '^[a-zA-Z0-9_:.\\-]+$' };
const definition = (name, description, properties) => ({ type: 'function', name, description, strict: true, parameters: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false } });

function compareReferenceRange(value, referenceRange) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || typeof referenceRange !== 'string') return 'not_comparable';
  const interval = referenceRange.match(/^\s*(-?\d+(?:\.\d+)?)\s*(?:-|–|—|to)\s*(-?\d+(?:\.\d+)?)/i);
  if (!interval) return 'not_comparable';
  const lower = Number(interval[1]);
  const upper = Number(interval[2]);
  if (lower > upper) return 'not_comparable';
  return numericValue < lower || numericValue > upper ? 'outside_range' : 'within_range';
}

function explainTerm(name, language) {
  const term = name.toLocaleLowerCase();
  if (term.includes('hemoglobin')) return language === 'hi'
    ? 'हीमोग्लोबिन लाल रक्त कोशिकाओं में ऑक्सीजन ले जाने वाला प्रोटीन है।'
    : 'Hemoglobin is the protein in red blood cells that carries oxygen.';
  if (term === 'tsh' || term.includes('thyroid')) return language === 'hi'
    ? 'TSH थायरॉइड से संबंधित हार्मोन संकेत है; डॉक्टर इसे अन्य जानकारी के साथ देखते हैं।'
    : 'TSH is a hormone signal used in thyroid assessment alongside other clinical information.';
  if (term.includes('glucose') || term.includes('sugar')) return language === 'hi'
    ? 'ग्लूकोज़ रक्त में शर्करा का मापन है; अर्थ भोजन और नमूना लेने के समय पर निर्भर कर सकता है।'
    : 'Glucose measures sugar in the blood; interpretation can depend on food intake and collection timing.';
  return language === 'hi'
    ? 'यह प्रयोगशाला का मापन है। इसका व्यक्तिगत अर्थ चिकित्सक से पूछें।'
    : 'This is a laboratory measurement. Ask your clinician what it means in your specific context.';
}

function explainPurpose(testNames, language) {
  const purposes = testNames.map((name) => {
    const test = name.toLocaleLowerCase();
    if (/complete blood count|\bcbc\b/.test(test)) return language === 'hi' ? 'कंप्लीट ब्लड काउंट रक्त कोशिकाओं को मापता है' : 'a complete blood count measures blood cells';
    if (/thyroid/.test(test)) return language === 'hi' ? 'थायरॉइड प्रोफ़ाइल थायरॉइड से जुड़े हार्मोन मापती है' : 'a thyroid profile measures hormones related to thyroid function';
    if (/glucose|blood sugar/.test(test)) return language === 'hi' ? 'ग्लूकोज़ जाँच रक्त में शर्करा मापती है' : 'a glucose test measures sugar in the blood';
    return language === 'hi' ? `${name} सूचीबद्ध प्रयोगशाला मान मापती है` : `${name} measures the listed laboratory parameters`;
  });
  if (language === 'hi') return `जाँचों का सामान्य उद्देश्य: ${purposes.join('; ')}। दर्ज मान और संदर्भ सीमाएँ नीचे ज्यों की त्यों दी गई हैं।`;
  return `General test purpose: ${purposes.join('; ')}. Recorded values and reference intervals are shown exactly below.`;
}

export const toolDefinitions = [
  definition('search_available_tests', 'Search the current catalogue; empty query lists available tests.', { query: { type: 'string', maxLength: 100 } }),
  definition('get_test_details', 'Read a catalogue test.', { testId: id }),
  definition('get_test_prices', 'Read authoritative prices in integer paise.', { testIds: { type: 'array', items: id, minItems: 1, maxItems: 20, uniqueItems: true } }),
  definition('explain_approved_report', 'Retrieve a patient-owned, approved and payment-authorised report for a fixed, non-diagnostic explanation. Use only when the patient asks to understand a report.', { bookingId: id }),
  definition('check_appointment_availability', 'Read persisted available slots for an ISO date.', { date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }),
  definition('extract_prescription_tests', 'Read the authenticated patient\'s uploaded prescription candidates. Candidates require human review.', { prescriptionId: id }),
  definition('create_appointment', 'Prepare a booking for patient confirmation. Does not commit until the patient clicks the confirmation control.', { testIds: { type: 'array', items: id, minItems: 1, maxItems: 20, uniqueItems: true }, slotId: id }),
  definition('get_my_appointments', 'List only the authenticated patient\'s bookings.', {}),
  ...['get_booking_status', 'create_or_get_invoice', 'get_invoice_details', 'get_sample_status', 'get_my_report_status', 'get_approved_report', 'get_payment_status', 'get_payment_receipt'].map(name => definition(name, 'Read the authenticated patient\'s booking information. Report values and files require approval and payment policy.', { bookingId: id })),
  definition('create_payment_order', 'Prepare test checkout for explicit patient confirmation; never submit a payment.', { bookingId: id }),
];
const validators = new Map(toolDefinitions.map(tool => [tool.name, ajv.compile(tool.parameters)]));
export const toolResultSchema = { type: 'object', properties: { success: { type: 'boolean' }, data: {}, error: { type: 'string' }, code: { type: 'string' } }, required: ['success'], additionalProperties: false };

export function createToolExecutor({ store, workflow, payments }) {
  async function propose(actor, conversationId, type, args, summary) {
    const pending = { id: randomUUID(), type, args, summary, actorId: actor.id, conversationId, expiresAt: Date.now() + 10 * 60_000, status: 'pending' };
    await store.transaction(state => { state.confirmations[pending.id] = pending; });
    return { confirmationRequired: true, pendingAction: { id: pending.id, type, summary } };
  }

  async function execute(actor, name, args, conversationId, language = 'en') {
    const validate = validators.get(name);
    if (!validate || !validate(args)) return { success: false, error: 'The assistant requested an invalid action or arguments.', code: 'INVALID_TOOL' };
    let result;
    try {
      let data;
      switch (name) {
        case 'search_available_tests': data = await workflow.searchTests(args.query); break;
        case 'get_test_details': data = await workflow.testDetails(args.testId); break;
        case 'get_test_prices': data = await workflow.prices(args.testIds); break;
        case 'check_appointment_availability': data = await workflow.availability(args.date); break;
        case 'get_my_appointments': data = await workflow.appointments(actor); break;
        case 'get_booking_status': data = await workflow.booking(actor, args.bookingId); break;
        case 'create_or_get_invoice':
        case 'get_invoice_details': data = await workflow.invoice(actor, args.bookingId); break;
        case 'get_sample_status': data = await workflow.sample(actor, args.bookingId); break;
        case 'get_my_report_status': data = await workflow.reportStatus(actor, args.bookingId); break;
        case 'get_approved_report': {
          const report = await workflow.report(actor, args.bookingId);
          // The LLM receives administrative metadata; laboratory values stay in the protected PDF.
          data = { id: report.id, status: report.status, downloadPath: `/api/assistant/bookings/${args.bookingId}/report.pdf` }; break;
        }
        case 'explain_approved_report': {
          const report = await workflow.report(actor, args.bookingId);
          const values = (report.results || []).map((row) => ({
            testName: report.tests?.find((test) => test.id === row.testId)?.name || row.testId,
            name: row.name,
            value: row.value,
            unit: row.unit || '',
            referenceRange: row.referenceRange || (language === 'hi' ? 'कॉन्फ़िगर नहीं है' : 'Not configured'),
            comparison: compareReferenceRange(row.value, row.referenceRange),
            explanation: explainTerm(row.name, language)
          }));
          const totals = values.reduce((counts, row) => {
            counts[row.comparison] += 1;
            return counts;
          }, { within_range: 0, outside_range: 0, not_comparable: 0 });
          data = {
            id: report.id,
            status: report.status,
            synthetic: report.synthetic === true,
            summary: [
              explainPurpose((report.tests || []).map((test) => test.name), language),
              language === 'hi'
                ? `सीमा के भीतर: ${totals.within_range}; सीमा से बाहर: ${totals.outside_range}; तुलना उपलब्ध नहीं: ${totals.not_comparable}.`
                : `Within the configured interval: ${totals.within_range}; outside it: ${totals.outside_range}; not comparable: ${totals.not_comparable}.`,
              language === 'hi'
                ? 'संदर्भ सीमा तुलना निदान नहीं है; सीमाएँ प्रयोगशाला, विधि और व्यक्ति के अनुसार बदल सकती हैं।'
                : 'A reference-range comparison is not a diagnosis; intervals can vary by laboratory, method, and person.',
              language === 'hi'
                ? 'अपने चिकित्सक से परिणामों और आगे के कदमों पर चर्चा करें।'
                : 'Discuss the results and any next steps with your clinician.'
            ],
            values
          };
          break;
        }
        case 'get_payment_status': data = await payments.status(actor, args.bookingId); break;
        case 'get_payment_receipt': data = await payments.receipt(actor, args.bookingId); break;
        case 'extract_prescription_tests': data = await store.read(state => {
          const p = state.prescriptions[args.prescriptionId];
          if (!p || p.patientId !== actor.id) throw fault(404, 'Prescription not found.');
          return { id: p.id, candidates: p.candidates, needsReview: true, warning: p.warning };
        }); break;
        case 'create_appointment': {
          const quote = await workflow.prices(args.testIds);
          const slots = await workflow.availability();
          const slot = slots.find(s => s.id === args.slotId);
          if (!slot) throw fault(409, 'This slot is unavailable. Choose a published slot.');
          data = await propose(actor, conversationId, 'booking', args, { testIds: args.testIds, slotId: args.slotId, slot, quote }); break;
        }
        case 'create_payment_order': {
          const invoice = await workflow.invoice(actor, args.bookingId);
          data = await propose(actor, conversationId, 'payment', args, { bookingId: args.bookingId, invoice }); break;
        }
      }
      result = { success: true, data };
    } catch (error) {
      result = { success: false, error: error.status ? error.message : 'This service is unavailable. Please try again or contact the laboratory.', code: error.code || 'SERVICE_UNAVAILABLE' };
    }
    await store.transaction(state => {
      const executionId = randomUUID();
      state.toolExecutions[executionId] = { id: executionId, actorId: actor.id, name, success: result.success, code: result.code || null, at: new Date().toISOString() };
    });
    return result;
  }

  async function confirm(actor, conversationId, confirmationId) {
    // Claim atomically before leaving the transaction. A second request cannot execute this action.
    const pending = await store.transaction(state => {
      const action = state.confirmations[confirmationId];
      if (!action || action.actorId !== actor.id || action.conversationId !== conversationId) throw fault(404, 'Confirmation not found.');
      if (action.status === 'complete') return action;
      if (action.status !== 'pending' || action.expiresAt < Date.now()) throw fault(409, 'Confirmation expired or already processing. Refresh your booking.');
      action.status = 'processing';
      return structuredClone(action);
    });
    if (pending.status === 'complete') return pending.result;
    try {
      const result = pending.type === 'booking'
        ? await workflow.book(actor, { ...pending.args, expectedQuote: pending.summary.quote, idempotencyKey: pending.id })
        : await payments.createOrder(actor, pending.args.bookingId, pending.id);
      await store.transaction(state => { state.confirmations[confirmationId].status = 'complete'; state.confirmations[confirmationId].result = result; });
      return result;
    } catch (error) {
      // Same idempotency key is retained for safe retries after transport/provider errors.
      await store.transaction(state => { state.confirmations[confirmationId].status = 'pending'; });
      throw error;
    }
  }
  return { execute, confirm };
}

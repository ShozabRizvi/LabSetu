import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgent } from '../src/assistant/agent.js';
import { createMemoryStore, createSyntheticState, SYNTHETIC_LAB_ID, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createToolExecutor } from '../src/assistant/tools.js';
import { createWorkflowService } from '../src/assistant/workflow.js';

const patient = { id: SYNTHETIC_PATIENT_ID, role: 'citizen', name: 'Synthetic Patient' };
const otherPatient = { id: '00000000-0000-4000-8000-000000000002', role: 'citizen' };
const staff = { id: '00000000-0000-4000-8000-000000000003', role: 'authority', labId: SYNTHETIC_LAB_ID, canApproveReports: true };

async function approvedReport({ value = '13.50', referenceRange = '12.0–16.0 g/dL' } = {}) {
  const seed = createSyntheticState();
  seed.tests.cbc.parameters[0].referenceRange = referenceRange;
  const store = createMemoryStore(seed);
  const workflow = createWorkflowService({ store, config: { requirePaymentForReport: false } });
  const [slot] = await workflow.availability();
  const booking = await workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'report-explainer-booking' });
  for (const status of ['collected', 'processing', 'processing_complete']) {
    await workflow.staffTransition(staff, booking.id, { entity: 'sample', status });
  }
  await workflow.staffTransition(staff, booking.id, {
    entity: 'report',
    status: 'draft',
    results: [{ testId: 'cbc', name: 'Hemoglobin', value }]
  });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  const executor = createToolExecutor({ store, workflow, payments: {} });
  return { store, workflow, booking, executor };
}

test('approved report explanation preserves exact values and ranges without diagnosing', async () => {
  const { booking, executor } = await approvedReport();
  const result = await executor.execute(patient, 'explain_approved_report', { bookingId: booking.id }, 'report-chat', 'en');
  assert.equal(result.success, true);
  assert.equal(result.data.status, 'approved');
  assert.equal(result.data.synthetic, true);
  assert.equal(result.data.values[0].value, '13.50');
  assert.equal(result.data.values[0].unit, 'g/dL');
  assert.equal(result.data.values[0].referenceRange, '12.0–16.0 g/dL');
  assert.equal(result.data.values[0].comparison, 'within_range');
  assert.match(result.data.values[0].explanation, /carries oxygen/);
  assert.equal(result.data.summary.length, 4);
  assert.match(result.data.summary.at(-1), /clinician/);
});

test('report explanation flags outside-range values and avoids comparisons for unconfigured ranges', async () => {
  const outside = await approvedReport({ value: '17.00' });
  const outsideResult = await outside.executor.execute(patient, 'explain_approved_report', { bookingId: outside.booking.id }, 'report-chat', 'en');
  assert.equal(outsideResult.data.values[0].comparison, 'outside_range');
  assert.equal(outsideResult.data.values[0].value, '17.00');

  const missingRange = await approvedReport({ referenceRange: 'Use age/sex-specific laboratory interval' });
  const missingResult = await missingRange.executor.execute(patient, 'explain_approved_report', { bookingId: missingRange.booking.id }, 'report-chat', 'en');
  assert.equal(missingResult.data.values[0].comparison, 'not_comparable');
  assert.equal(missingResult.data.values[0].referenceRange, 'Use age/sex-specific laboratory interval');
});

test('report explanation requires approval and patient ownership', async () => {
  const { booking, executor, workflow } = await approvedReport();
  await workflow.store.transaction((state) => { state.reports[booking.id].status = 'draft'; });
  const unapproved = await executor.execute(patient, 'explain_approved_report', { bookingId: booking.id }, 'report-chat', 'en');
  assert.equal(unapproved.success, false);
  assert.equal(unapproved.code, 'report_not_approved');
  await workflow.store.transaction((state) => { state.reports[booking.id].status = 'approved'; });
  await workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'released' });
  const other = await executor.execute(otherPatient, 'explain_approved_report', { bookingId: booking.id }, 'other-chat', 'en');
  assert.equal(other.success, false);
  assert.equal(other.code, 'record_not_found');
});

test('report values are returned to the patient, never sent back to the LLM provider', async () => {
  const { booking, executor, workflow } = await approvedReport();
  const requests = [];
  const agent = createAgent({
    store: workflow.store,
    workflow,
    executor,
    config: { aiProvider: 'openai', openaiKey: 'synthetic-test-key', openaiModel: 'test-model' },
    fetchImpl: async (_url, options) => {
      requests.push(JSON.parse(options.body));
      return Response.json({
        status: 'completed',
        output: [{
          type: 'function_call',
          name: 'explain_approved_report',
          call_id: 'report-call',
          arguments: JSON.stringify({ bookingId: booking.id })
        }]
      });
    }
  });

  const response = await agent.chat(patient, { message: 'What do these laboratory values mean?', language: 'en' });
  assert.equal(requests.length, 1);
  assert.doesNotMatch(JSON.stringify(requests), /13\.50|Hemoglobin|12\.0/);
  assert.equal(response.results[0].name, 'explain_approved_report');
  assert.equal(response.results[0].result.data.values[0].value, '13.50');
});

test('consultation requests get a safe checklist and clearly state clinician booking is unavailable', async () => {
  const store = createMemoryStore();
  const workflow = createWorkflowService({ store });
  const agent = createAgent({
    store,
    workflow,
    executor: { execute: async () => { throw new Error('No tools should be called.'); } },
    config: { aiProvider: 'demo' }
  });
  const response = await agent.chat(patient, { message: 'Help me prepare questions for my doctor consultation', language: 'en' });
  assert.match(response.reply, /bring this approved report/i);
  assert.match(response.reply, /appointment booking is not available/i);
  assert.doesNotMatch(response.reply, /take medication|take a drug|use this treatment/i);
});

test('potentially urgent private requests are directed to emergency care without tool calls', async () => {
  const store = createMemoryStore();
  const workflow = createWorkflowService({ store });
  const agent = createAgent({
    store,
    workflow,
    executor: { execute: async () => { throw new Error('No tools should be called.'); } },
    config: { aiProvider: 'demo' }
  });
  const response = await agent.chat(patient, { message: 'Mujhe chest pain ho raha hai', language: 'hi' });
  assert.match(response.reply, /आपातकालीन सेवा/);
  assert.deepEqual(response.results, []);
});

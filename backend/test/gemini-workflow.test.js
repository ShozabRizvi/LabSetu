import assert from 'node:assert/strict';
import test from 'node:test';
import { createAgent } from '../src/assistant/agent.js';
import { createMemoryStore, createSyntheticState, SYNTHETIC_LAB_ID, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createToolExecutor } from '../src/assistant/tools.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createApp } from '../server.js';
import { assistantConfig } from '../src/assistant/config.js';

const patient = { id: SYNTHETIC_PATIENT_ID, role: 'citizen', name: 'Synthetic Patient' };
const other = { id: '00000000-0000-4000-8000-000000000002', role: 'citizen' };
const staff = { id: '00000000-0000-4000-8000-000000000003', role: 'authority', labId: SYNTHETIC_LAB_ID, canApproveReports: true };

function toolResponse(name, args, id = 'synthetic-call') {
  const call = { name, args, id };
  return { functionCalls: [call], candidates: [{ content: { role: 'model', parts: [{ functionCall: call, thoughtSignature: 'synthetic-thought-signature' }] } }] };
}
const textResponse = text => ({ text, candidates: [{ finishReason: 'STOP' }] });
function fixture(generate, config = {}, seed = createSyntheticState()) {
  const store = createMemoryStore(seed);
  const workflow = createWorkflowService({ store, config: { requirePaymentForReport: false } });
  const executor = createToolExecutor({ store, workflow, payments: {} });
  const agent = createAgent({ store, executor, workflow, config: { aiProvider: 'gemini', ...config }, ...(generate ? { geminiService: { generate } } : {}) });
  return { store, workflow, executor, agent };
}

test('Gemini conversation uses persisted catalogue and slots, proposes then confirms one booking/token/invoice', async () => {
  const requests = [];
  let slot;
  let bookingId;
  const replies = [
    () => toolResponse('search_available_tests', { query: 'CBC' }),
    () => textResponse('The verified catalogue result is shown below.'),
    () => toolResponse('check_appointment_availability', { date: slot.date }),
    () => textResponse('Choose a published slot.'),
    () => toolResponse('create_appointment', { testIds: ['cbc'], slotId: slot.id }),
    () => toolResponse('get_invoice_details', { bookingId }),
    () => textResponse('Your persisted invoice is shown below.'),
  ];
  const f = fixture(async body => { requests.push(structuredClone(body)); const next = replies.shift(); assert.ok(next, 'unexpected provider continuation'); return next(); });
  [slot] = await f.workflow.availability();
  const first = await f.agent.chat(patient, { message: 'Find CBC tests' });
  assert.equal(first.results[0].result.data[0].pricePaise, 35000);
  const second = await f.agent.chat(patient, { message: 'Which slots are available?', conversationId: first.conversationId });
  assert.equal(second.conversationId, first.conversationId);
  assert.equal(second.results[0].result.data[0].id, slot.id);
  assert.match(JSON.stringify(requests[2].contents), /Verified backend results/);
  assert.match(JSON.stringify(requests[2].contents), /35000/);
  const proposal = await f.agent.chat(patient, { message: 'Book CBC in that slot', conversationId: first.conversationId });
  assert.equal(proposal.pendingAction.type, 'booking');
  assert.equal(proposal.pendingAction.summary.quote.totalPaise, 35000);
  assert.equal(requests.length, 5, 'proposal must stop before the model can continue');
  assert.deepEqual(await f.workflow.appointments(patient), []);
  assert.equal(await f.store.read(state => Object.keys(state.invoices).length), 0);
  assert.match(proposal.reply, /No action has been committed/);
  const confirmed = await f.agent.confirm(patient, { conversationId: first.conversationId, confirmationId: proposal.pendingAction.id });
  const booking = confirmed.results[0].result.data;
  bookingId = booking.id;
  assert.ok(booking.registrationToken.id);
  assert.equal(booking.registrationToken.status, 'registered');
  assert.equal(booking.invoice.totalPaise, 35000);
  assert.equal((await f.workflow.booking(patient, booking.id)).registrationToken.id, booking.registrationToken.id);
  assert.equal((await f.workflow.appointments(staff))[0].id, booking.id);
  const retried = await f.agent.confirm(patient, { conversationId: first.conversationId, confirmationId: proposal.pendingAction.id });
  assert.equal(retried.results[0].result.data.id, booking.id);
  assert.equal((await f.workflow.appointments(patient)).length, 1);
  await f.agent.chat(patient, { message: 'Show the invoice', conversationId: first.conversationId });
  assert.match(JSON.stringify(requests[5].contents), new RegExp(booking.id));
  assert.doesNotMatch(JSON.stringify(requests), /Synthetic Patient|patientName|patientId|actorId|idempotencyKey/);
  assert.equal(replies.length, 0);
});

test('Gemini preserves model thought signatures and sends only redacted backend tool responses', async () => {
  let index = 0;
  let followup;
  const f = fixture(async body => {
    if (index++ === 0) return toolResponse('get_my_appointments', {});
    followup = structuredClone(body);
    return textResponse('Your status is shown below.');
  });
  const [slot] = await f.workflow.availability();
  const booking = await f.workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'redaction-test-booking' });
  await f.agent.chat(patient, { message: 'Check my progress' });
  const modelPart = followup.contents.find(content => content.parts?.some(part => part.thoughtSignature));
  assert.equal(modelPart.parts[0].thoughtSignature, 'synthetic-thought-signature');
  const response = followup.contents.at(-1).parts[0].functionResponse;
  assert.equal(response.id, 'synthetic-call');
  assert.equal(response.response.data[0].id, booking.id);
  assert.equal(response.response.data[0].invoice.totalPaise, 35000);
  assert.doesNotMatch(JSON.stringify(response), /Synthetic Patient|patientName|patientId|labId|actorId|idempotencyKey/);
});

test('Gemini invalid and parallel tool calls cannot confirm or mutate a booking', async () => {
  for (const response of [toolResponse('confirm', { confirmationId: 'unauthorized' }), toolResponse('create_appointment', { testIds: ['cbc'], slotId: 'missing', patientId: other.id })]) {
    let calls = 0;
    const f = fixture(async () => calls++ ? textResponse('This action was rejected.') : response);
    const result = await f.agent.chat(patient, { message: 'Please execute this action' });
    assert.equal(result.results[0].result.success, false);
    assert.equal(result.results[0].result.code, 'INVALID_TOOL');
    assert.deepEqual(await f.workflow.appointments(patient), []);
    assert.equal(await f.store.read(state => Object.keys(state.confirmations).length), 0);
  }
  const parallel = toolResponse('get_my_appointments', {});
  parallel.functionCalls.push({ name: 'create_appointment', args: { testIds: ['cbc'], slotId: 'any' } });
  const f = fixture(async () => parallel);
  await assert.rejects(f.agent.chat(patient, { message: 'Do two things' }), error => error.status === 502);
  assert.deepEqual(await f.workflow.appointments(patient), []);
});

test('Gemini report explanation keeps exact approved values out of this and later provider turns', async () => {
  const seed = createSyntheticState();
  seed.tests.cbc.parameters[0].referenceRange = '12.0–16.0 g/dL';
  const requests = [];
  let booking;
  const f = fixture(async body => {
    requests.push(structuredClone(body));
    return requests.length === 1 ? toolResponse('explain_approved_report', { bookingId: booking.id }) : textResponse('You are welcome.');
  }, {}, seed);
  const [slot] = await f.workflow.availability();
  booking = await f.workflow.book(patient, { testIds: ['cbc'], slotId: slot.id, idempotencyKey: 'gemini-private-report' });
  for (const status of ['collected', 'processing', 'processing_complete']) await f.workflow.staffTransition(staff, booking.id, { entity: 'sample', status });
  await f.workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'draft', results: [{ testId: 'cbc', name: 'Hemoglobin', value: '13.579' }] });
  await f.workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'pending_verification' });
  await f.workflow.staffTransition(staff, booking.id, { entity: 'report', status: 'approved' });
  const response = await f.agent.chat(patient, { message: 'What do these laboratory values mean?' });
  assert.equal(requests.length, 1, 'report results must not be returned to the model');
  assert.equal(response.results[0].result.data.values[0].value, '13.579');
  await f.agent.chat(patient, { message: 'Thank you', conversationId: response.conversationId });
  assert.doesNotMatch(JSON.stringify(requests), /13\.579|Hemoglobin|12\.0/);
  await assert.rejects(f.agent.chat(other, { message: 'Continue', conversationId: response.conversationId }), error => error.status === 404);
});

test('missing Gemini configuration leaves manual catalogue and confirmation workflow usable', async () => {
  const f = fixture();
  await assert.rejects(f.agent.chat(patient, { message: 'Find CBC tests' }), error => error.status === 503 && /GEMINI_API_KEY/.test(error.message));
  assert.equal((await f.executor.execute(patient, 'search_available_tests', { query: 'CBC' }, 'manual')).data[0].id, 'cbc');
  const [slot] = await f.workflow.availability();
  const proposal = await f.executor.execute(patient, 'create_appointment', { testIds: ['cbc'], slotId: slot.id }, 'manual');
  assert.equal(proposal.success, true);
  const booking = await f.executor.confirm(patient, 'manual', proposal.data.pendingAction.id);
  assert.equal((await f.workflow.booking(patient, booking.id)).id, booking.id);
});

test('Gemini incomplete and safety-blocked replies never execute a proposed tool', async () => {
  for (const finishReason of ['MAX_TOKENS', 'SAFETY']) {
    const response = toolResponse('create_appointment', { testIds: ['cbc'], slotId: 'any' });
    response.text = 'Partial unsupported confirmation';
    response.candidates[0].finishReason = finishReason;
    const f = fixture(async () => response);
    await assert.rejects(f.agent.chat(patient, { message: 'Book a test' }), error => error.status === 502 && error.code === 'AI_INCOMPLETE_REPLY');
    assert.deepEqual(await f.workflow.appointments(patient), []);
    assert.equal(await f.store.read(state => Object.keys(state.confirmations).length), 0);
  }
});

test('application mounts separate Clinova and reports honest database readiness', async () => {
  for (const [pool, status, database, schema] of [
    [null, 503, 'unconfigured', undefined],
    [{ query: async () => ({ rows: [{ schema_ready: false }] }) }, 503, 'connected', 'incompatible'],
    [{ query: async () => ({ rows: [{ schema_ready: true }] }) }, 200, 'connected', 'present'],
    [{ query: async () => { throw new Error('private connection data'); } }, 503, 'unavailable', undefined],
  ]) {
    const app = createApp({ pool, assistantOptions: { store: createMemoryStore(), config: assistantConfig({}) }, clinovaOptions: { geminiService: { generate: async () => textResponse('General informational answer.') } } });
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
      const response = await fetch(`${origin}/api/ready`);
      assert.equal(response.status, status);
      const readiness = await response.json();
      assert.equal(readiness.database, database);
      assert.equal(readiness.assistantSchema, schema);
      assert.doesNotMatch(JSON.stringify(readiness), /private connection data/);
      const clinova = await fetch(`${origin}/api/clinova/chat`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ message: 'What is a blood test?' }) });
      assert.equal(clinova.status, 200);
      assert.equal((await clinova.json()).data.mode, 'gemini');
      assert.equal((await fetch(`${origin}/api/assistant/appointments`)).status, 401);
    } finally { await new Promise(resolve => server.close(resolve)); }
  }
});

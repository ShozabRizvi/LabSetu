import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createMemoryStore, emptyState, SYNTHETIC_PATIENT_ID } from '../src/assistant/store.js';
import { createWorkflowService } from '../src/assistant/workflow.js';
import { createPrescriptionService } from '../src/assistant/prescriptions.js';

test('prescription matching checks every active test beyond the 100-item conversation search limit', async (t) => {
  const uploadDir = await mkdtemp(path.join(tmpdir(), 'labsetu-prescription-catalogue-'));
  t.after(() => rm(uploadDir, { recursive: true, force: true }));
  const seed = emptyState();
  for (let index = 0; index < 140; index++) seed.tests[`synthetic-${index}`] = { id: `synthetic-${index}`, name: `Fixture Test ${index}`, code: `FIXTURE${index}`, active: true };
  seed.tests['synthetic-139'].aliases = ['LASTTARGET'];
  seed.tests['synthetic-inactive'] = { id: 'synthetic-inactive', name: 'Disabled fixture', aliases: ['LASTTARGET'], active: false };
  const store = createMemoryStore(seed);
  const workflow = createWorkflowService({ store });
  assert.equal((await workflow.searchTests('')).length, 100);
  const prescriptions = createPrescriptionService({ store, workflow, config: { uploadDir }, extract: async () => ({ text: 'Requested: LASTTARGET', confidence: 100, source: 'isolated-test-extractor' }) });
  const result = await prescriptions.upload({ id: SYNTHETIC_PATIENT_ID, role: 'citizen' }, { filename: 'fixture.pdf', mimeType: 'application/pdf', base64: Buffer.from('%PDF-1.7 synthetic fixture').toString('base64') });
  assert.deepEqual(result.candidates.map((item) => item.testId), ['synthetic-139']);
  assert.equal(result.needsReview, true);
  assert.equal((await store.read((state) => state.prescriptions[result.id])).patientId, SYNTHETIC_PATIENT_ID);
  assert.deepEqual(await store.read((state) => state.appointments), {});
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { money, rows, statusLabel, validatePrescription } from '../src/utils/assistantUtils.js';

test('authoritative money display refuses missing or imprecise amounts', () => {
  assert.equal(money(undefined), 'Price unavailable');
  assert.equal(money(1.1), 'Price unavailable');
  assert.match(money(12550), /125\.50/);
});

test('upload validation rejects unsupported, empty and oversize files', () => {
  assert.equal(validatePrescription({ type: 'application/pdf', size: 1024 }), null);
  assert.equal(validatePrescription({ type: 'image/png', size: 1024 }), null);
  assert.match(validatePrescription({ type: 'text/html', size: 20 }), /PDF/);
  assert.match(validatePrescription({ type: 'image/png', size: 0 }), /5 MB/);
  assert.match(validatePrescription({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
});

test('empty and malformed server collections are not substituted with demo records', () => {
  assert.deepEqual(rows(null, 'tests'), []);
  assert.deepEqual(rows({ tests: 'unavailable' }, 'tests'), []);
  assert.deepEqual(rows({ tests: [{ id: 'CBC' }] }, 'tests'), [{ id: 'CBC' }]);
  assert.equal(statusLabel(undefined), 'Not available');
  assert.equal(statusLabel('pending_verification'), 'pending verification');
});

test('browser Supabase configuration never reads a service-role key', async () => {
  const source = await readFile(new URL('../src/lib/supabase.js', import.meta.url), 'utf8');
  const example = await readFile(new URL('../../.env.example', import.meta.url), 'utf8');
  const frontendExample = await readFile(new URL('../.env.example', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /VITE_SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /VITE_SUPABASE_ANON_KEY/);
  assert.match(example, /SUPABASE_SERVICE_ROLE_KEY=replace_with_server_only_supabase_service_role_key/);
  assert.doesNotMatch(frontendExample, /VITE_SUPABASE_SERVICE_ROLE_KEY/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { createApp } from '../server.js';

async function checkReadiness(schemaReady) {
  const server = createApp({
    pool: { async query() { return { rows: [{ schema_ready: schemaReady }] }; } },
  }).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    return await fetch(`http://127.0.0.1:${server.address().port}/api/ready`);
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

test('readiness rejects an existing database whose assistant columns are incompatible', async () => {
  const response = await checkReadiness(false);

  assert.equal(response.status, 503);
  assert.equal((await response.json()).assistantSchema, 'incompatible');
});

test('readiness remains successful when the complete assistant schema is present', async () => {
  const response = await checkReadiness(true);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).assistantSchema, 'present');
});

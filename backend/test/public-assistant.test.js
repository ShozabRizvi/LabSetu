import assert from 'node:assert/strict';
import test from 'node:test';
import express from 'express';
import { createAssistantRouter } from '../src/assistant/router.js';
import { createMemoryStore } from '../src/assistant/store.js';
import { assistantConfig } from '../src/assistant/config.js';

async function createApi(options = {}) {
  const { config = {}, ...routerOptions } = options;
  const app = express();
  app.use('/api/assistant', createAssistantRouter({
    config: { ...assistantConfig(), aiProvider: 'demo', demoMode: false, paymentMode: 'disabled', ...config },
    store: createMemoryStore(),
    ...routerOptions
  }));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return {
    request: (path, body) => fetch(`http://127.0.0.1:${server.address().port}/api/assistant${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body)
    }),
    close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  };
}

test('public assistant answers general questions without authentication or private tool access', async () => {
  const api = await createApi();
  try {
    const response = await api.request('/public/chat', { message: 'What can LabSetu help me with?', language: 'en' });
    assert.equal(response.status, 200);
    const payload = await response.json();
    assert.equal(payload.success, true);
    assert.match(payload.data.reply, /general questions/i);
    assert.equal(payload.data.mode, 'demo');
  } finally {
    await api.close();
  }
});

test('public assistant directs account actions to sign-in without creating records', async () => {
  const store = createMemoryStore();
  const api = await createApi({ store });
  try {
    const response = await api.request('/public/chat', { message: 'Mujhe blood test book karwana hai', language: 'hi' });
    assert.equal(response.status, 200);
    assert.match((await response.json()).data.reply, /साइन इन/);
    const state = await store.read();
    assert.deepEqual(Object.keys(state.appointments), []);
    assert.deepEqual(Object.keys(state.confirmations), []);
    assert.deepEqual(Object.keys(state.conversations), []);
  } finally {
    await api.close();
  }
});

test('public assistant directs potentially urgent symptoms to professional emergency care', async () => {
  const api = await createApi();
  try {
    const response = await api.request('/public/chat', { message: 'I am having chest pain and difficulty breathing', language: 'en' });
    assert.equal(response.status, 200);
    assert.match((await response.json()).data.reply, /emergency services/i);
  } finally {
    await api.close();
  }
});

test('private agent chat remains protected and public input is validated', async () => {
  const api = await createApi();
  try {
    const privateResponse = await api.request('/chat', { message: 'Show my report', language: 'en' });
    assert.equal(privateResponse.status, 401);

    const invalidResponse = await api.request('/public/chat', { message: '', language: 'en' });
    assert.equal(invalidResponse.status, 400);
  } finally {
    await api.close();
  }
});

test('configured public LLM call has no business tools and disables provider storage', async () => {
  let request;
  const api = await createApi({
    config: { aiProvider: 'openai', openaiKey: 'synthetic-key', openaiModel: 'test-model', demoMode: false, paymentMode: 'disabled' },
    fetchImpl: async (_url, options) => {
      request = JSON.parse(options.body);
      return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: 'General laboratory information.' }] }] });
    }
  });
  try {
    const response = await api.request('/public/chat', { message: 'What is a blood test?', language: 'en' });
    assert.equal(response.status, 200);
    assert.equal(request.store, false);
    assert.equal('tools' in request, false);
  } finally {
    await api.close();
  }
});

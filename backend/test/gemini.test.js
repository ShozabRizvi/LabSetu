import assert from 'node:assert/strict';
import test from 'node:test';
import { createGeminiService, DEFAULT_GEMINI_MODEL } from '../src/ai/gemini.js';

test('Gemini uses official SDK request shape and keeps keys out of payload', async () => {
  let request;
  const response = { text: 'Synthetic provider response.' };
  const service = createGeminiService({ geminiKey: 'synthetic-key' }, { client: { models: { generateContent: async body => { request = body; return response; } } } });
  const tools = [{ functionDeclarations: [{ name: 'search_available_tests', parametersJsonSchema: { type: 'object', properties: {} } }] }];
  assert.equal(await service.generate({ instructions: 'Administrative only.', contents: [{ role: 'user', parts: [{ text: 'List tests' }] }], tools }), response);
  assert.equal(request.model, DEFAULT_GEMINI_MODEL);
  assert.equal(request.config.systemInstruction, 'Administrative only.');
  assert.equal(request.config.tools, tools);
  assert.equal(request.config.abortSignal instanceof AbortSignal, true);
  assert.equal(request.config.thinkingConfig.thinkingLevel, 'LOW');
  assert.doesNotMatch(JSON.stringify(request), /synthetic-key/);
});

test('missing Gemini key fails honestly before any provider call', async () => {
  let called = false;
  const service = createGeminiService({}, { client: { models: { generateContent: () => { called = true; } } } });
  await assert.rejects(service.generate({}), error => error.status === 503 && /GEMINI_API_KEY/.test(error.message));
  assert.equal(called, false);
});

test('Gemini sanitizes quota, configuration and provider failures', async () => {
  for (const [providerStatus, expectedStatus, code] of [[429, 429, 'AI_QUOTA'], [403, 503, 'AI_CONFIGURATION'], [404, 503, 'AI_CONFIGURATION'], [500, 502, 'AI_PROVIDER_ERROR']]) {
    const service = createGeminiService({ geminiKey: 'synthetic-key' }, { client: { models: { generateContent: async () => { throw Object.assign(new Error('secret-key and private input'), { status: providerStatus }); } } } });
    await assert.rejects(service.generate({}), error => error.status === expectedStatus && error.code === code && !/secret-key|private input/.test(error.message));
  }
});

test('Gemini timeout aborts a stalled provider and returns a controlled error', async () => {
  let signal;
  const service = createGeminiService({ geminiKey: 'synthetic-key', geminiTimeoutMs: 10 }, { client: { models: { generateContent: body => { signal = body.config.abortSignal; return new Promise(() => {}); } } } });
  await assert.rejects(service.generate({}), error => error.status === 504 && error.code === 'AI_TIMEOUT');
  assert.equal(signal.aborted, true);
});

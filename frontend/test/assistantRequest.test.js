import assert from 'node:assert/strict';
import test from 'node:test';
import { createAssistantRequest } from '../src/services/assistantRequest.js';

function createStorage() {
  const values = new Map();
  return {
    getItem: key => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
    removeItem: key => values.delete(key),
  };
}

function setup({ path = '/portal/assistant', session = { access_token: 'fresh-access-token' }, sessionError = null, response = Response.json({ success: true, data: { tests: [] } }), demoToken } = {}) {
  const sessionStorage = createStorage();
  const localStorage = createStorage();
  if (demoToken) sessionStorage.setItem('labsetu_assistant_demo_token', demoToken);
  let signOutOptions;
  let receivedRequest;
  let storedToken;
  let getSessionCalls = 0;
  const apiClient = {
    baseUrl: 'https://backend.example/api',
    getHeaders: () => ({ Authorization: 'Bearer stale-cached-token', Accept: 'application/json' }),
    setToken: token => { storedToken = token; },
  };
  const supabase = { auth: {
    getSession: async () => { getSessionCalls += 1; return { data: { session }, error: sessionError }; },
    signOut: async options => { signOutOptions = options; return { error: null }; },
  } };
  const request = createAssistantRequest({
    apiClient,
    supabase,
    browser: { location: { pathname: path }, sessionStorage, localStorage },
    fetchImpl: async (url, options) => { receivedRequest = { url, options }; return response; },
  });
  return {
    request, sessionStorage, localStorage, get receivedRequest() { return receivedRequest; },
    get signOutOptions() { return signOutOptions; }, get storedToken() { return storedToken; },
    get getSessionCalls() { return getSessionCalls; },
  };
}

test('protected assistant requests use and persist the refreshed Supabase access token', async () => {
  const state = setup();

  const result = await state.request('/tests');

  assert.deepEqual(result, { tests: [] });
  assert.equal(state.receivedRequest.options.headers.Authorization, 'Bearer fresh-access-token');
  assert.equal(state.sessionStorage.getItem('labsetu_patient_token'), 'fresh-access-token');
  assert.equal(state.localStorage.getItem('labsetu_patient_token'), 'fresh-access-token');
  assert.equal(state.storedToken, 'fresh-access-token');
  assert.equal(state.getSessionCalls, 1);
});

test('missing sessions sign out locally and require sign-in', async () => {
  const state = setup({ session: null });

  await assert.rejects(state.request('/appointments'), error => error.code === 'UNAUTHENTICATED' && /Sign in again/.test(error.message));

  assert.deepEqual(state.signOutOptions, { scope: 'local' });
  assert.equal(state.receivedRequest, undefined);
});

test('assistant 401 clears the invalid session while service errors preserve it', async () => {
  const unauthorized = setup({ response: Response.json({ success: false, error: 'invalid session' }, { status: 401 }) });
  await assert.rejects(unauthorized.request('/tests'), error => error.code === 'UNAUTHENTICATED');
  assert.deepEqual(unauthorized.signOutOptions, { scope: 'local' });

  const unavailable = setup({ response: Response.json({ success: false, error: 'temporarily unavailable' }, { status: 503 }) });
  await assert.rejects(unavailable.request('/tests'), /temporarily unavailable/);
  assert.equal(unavailable.signOutOptions, undefined);
});

test('public and demo assistant requests remain isolated from Supabase sessions', async () => {
  const publicChat = setup({ path: '/portal/assistant' });
  await publicChat.request('/public/chat', { method: 'POST', body: { message: 'Hello' } });
  assert.equal(publicChat.receivedRequest.options.headers.Authorization, undefined);
  assert.equal(publicChat.getSessionCalls, 0);

  const demo = setup({ path: '/assistant-demo', demoToken: 'synthetic-demo-access-token' });
  await demo.request('/tests');
  assert.equal(demo.receivedRequest.options.headers.Authorization, 'Bearer synthetic-demo-access-token');
  assert.equal(demo.getSessionCalls, 0);
});

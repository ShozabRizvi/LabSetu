import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { createAuthRouter } from '../src/routes/auth.js';
import { createResourcesRouter } from '../src/routes/resources.js';

const user = { id: '00000000-0000-4000-8000-000000000001', email: 'patient@example.test', user_metadata: { full_name: 'Synthetic Patient', role: 'authority', password: 'must-never-return' }, app_metadata: {} };
const staff = { ...user, id: '00000000-0000-4000-8000-000000000002', app_metadata: { role: 'authority', lab_id: 'lab-1' } };

async function fixture({ config, auth = {}, rows = [], queryError } = {}) {
  const calls = [];
  const client = {
    auth: {
      getUser: async (token) => { calls.push({ action: 'getUser', token }); return token === 'valid-token' ? { data: { user }, error: null } : token === 'staff-token' ? { data: { user: staff }, error: null } : { data: {}, error: { message: 'invalid' } }; },
      signInWithPassword: async (input) => { calls.push({ action: 'login', input }); return input.password === 'correct-password' ? { data: { user, session: { access_token: 'real-provider-session' } }, error: null } : { error: { message: 'Invalid credentials' } }; },
      signUp: async (input) => { calls.push({ action: 'register', input }); return { data: { user }, error: null }; },
      resetPasswordForEmail: async (email) => { calls.push({ action: 'reset', email }); return { error: null }; },
      admin: { signOut: async (token, scope) => { calls.push({ action: 'logout', token, scope }); return { error: null }; } },
      ...auth
    },
    from(table) {
      const call = { action: 'query', table, filters: [] };
      calls.push(call);
      const query = {
        select(value = '*') { call.select = value; return query; },
        eq(key, value) { call.filters.push([key, value]); return query; },
        in(key, values) { call.filters.push([key, values]); return query; },
        limit(value) { call.limit = value; return query; },
        upsert(values) { call.rows = values; call.write = true; return query; },
        delete() { call.delete = true; return query; },
        then(resolve, reject) { return Promise.resolve({ data: call.write ? call.rows : rows, error: queryError }).then(resolve, reject); }
      };
      return query;
    }
  };
  const options = {
    config: config || { SUPABASE_URL: 'https://synthetic.example.test', SUPABASE_ANON_KEY: 'public-anon-key', SUPABASE_SERVICE_ROLE_KEY: 'private-key-must-not-be-used' },
    createClientImpl(url, key, opts) { calls.push({ action: 'client', url, key, options: opts }); return client; }
  };
  const app = express();
  app.use(express.json());
  app.use('/auth', createAuthRouter(options));
  app.use('/resources', createResourcesRouter(options));
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  return {
    calls,
    async request(path, { method = 'GET', token, body } = {}) {
      return fetch(`http://127.0.0.1:${server.address().port}${path}`, { method,
        headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body) });
    },
    close: () => new Promise((resolve) => server.close(resolve))
  };
}

test('legacy login rejects arbitrary passwords and returns only real Supabase session tokens', async () => {
  const f = await fixture();
  try {
    const invalid = await f.request('/auth/login', { method: 'POST', body: { identifier: user.email, password: 'anything', role: 'authority' } });
    assert.equal(invalid.status, 401);
    assert.equal((await invalid.json()).success, false);
    const valid = await f.request('/auth/login', { method: 'POST', body: { identifier: user.email, password: 'correct-password', role: 'citizen' } });
    assert.equal(valid.status, 200);
    const result = await valid.json();
    assert.equal(result.token, 'real-provider-session');
    assert.equal(result.user.role, 'citizen');
    assert.equal(JSON.stringify(result).includes('must-never-return'), false);
    const escalation = await f.request('/auth/login', { method: 'POST', body: { identifier: user.email, password: 'correct-password', role: 'authority' } });
    assert.equal(escalation.status, 403);
  } finally { await f.close(); }
});

test('legacy me requires remotely verified bearer token and sanitises identity', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/auth/me')).status, 401);
    assert.equal((await f.request('/auth/me', { token: 'labsetu-session-forged' })).status, 401);
    const response = await f.request('/auth/me', { token: 'valid-token' });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).user, { id: user.id, email: user.email, name: 'Synthetic Patient', role: 'citizen' });
    assert.equal(f.calls.some((call) => call.action === 'getUser' && call.token === 'valid-token'), true);
  } finally { await f.close(); }
});

test('registration forbids self-assigned staff roles and honours provider email verification', async () => {
  const f = await fixture();
  try {
    const body = { name: 'Synthetic Patient', email: user.email, password: 'safe-password', role: 'authority' };
    assert.equal((await f.request('/auth/register', { method: 'POST', body })).status, 403);
    assert.equal(f.calls.some((call) => call.action === 'register'), false);
    const response = await f.request('/auth/register', { method: 'POST', body: { ...body, role: 'citizen', id: 'forged-id', labId: 'forged-lab' } });
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.requiresEmailConfirmation, true);
    assert.equal(result.token, undefined);
    assert.equal(result.user.role, 'citizen');
    assert.deepEqual(f.calls.find((call) => call.action === 'register').input.options.data, { full_name: 'Synthetic Patient' });
    assert.equal(f.calls.some((call) => call.action === 'query'), false);
  } finally { await f.close(); }
});

test('unconfigured legacy auth/resources fail closed and never acknowledge persistence', async () => {
  const f = await fixture({ config: { SUPABASE_URL: 'https://synthetic.example.test', SUPABASE_SERVICE_ROLE_KEY: 'private-service-key' } });
  try {
    assert.equal((await f.request('/auth/login', { method: 'POST', body: { identifier: user.email, password: 'password' } })).status, 503);
    assert.equal((await f.request('/auth/register', { method: 'POST', body: { email: user.email, password: 'safe-password', name: 'Patient' } })).status, 503);
    assert.equal((await f.request('/resources/appointments', { token: 'valid-token' })).status, 503);
    assert.equal((await f.request('/resources/appointments', { method: 'POST', token: 'valid-token', body: {} })).status, 503);
    assert.equal(f.calls.length, 0);
  } finally { await f.close(); }
});

test('resource clients use anon key plus verified user bearer and never service-role credentials', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/resources/appointments', { token: 'valid-token' })).status, 200);
    const call = f.calls.find((item) => item.action === 'client');
    assert.equal(call.key, 'public-anon-key');
    assert.equal(call.options.global.headers.Authorization, 'Bearer valid-token');
    assert.equal(call.options.auth.persistSession, false);
    assert.equal(f.calls.some((item) => item.key === 'private-key-must-not-be-used'), false);
    const query = f.calls.find((item) => item.action === 'query');
    assert.equal(query.table, 'appointments');
    assert.deepEqual(query.filters, [['patient_id', user.id]]);
  } finally { await f.close(); }
});

test('generic resource API requires authentication and rejects arbitrary table/KV access', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/resources/appointments')).status, 401);
    for (const table of ['app_kv_store', 'assistant_records', 'auth.users', 'payments']) {
      const result = await f.request('/resources/' + table, { token: 'valid-token' });
      assert.equal(result.status, 404);
    }
    assert.equal(f.calls.some((call) => call.action === 'query'), false);
  } finally { await f.close(); }
});

test('patient report resource returns only approved readiness metadata and denies raw result access', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/resources/reports', { token: 'valid-token' })).status, 200);
    const query = f.calls.find((call) => call.action === 'query');
    assert.equal(query.select.includes('parameters'), false);
    assert.deepEqual(query.filters, [['patient_id', user.id], ['status', ['approved', 'released']]]);
    assert.equal((await f.request('/resources/test_results', { token: 'valid-token' })).status, 403);
    assert.equal((await f.request('/resources/dashboard', { token: 'valid-token' })).status, 403);
  } finally { await f.close(); }
});

test('managed clinical/billing/profile writes cannot bypass dedicated workflow, including staff', async () => {
  const f = await fixture();
  try {
    for (const token of ['valid-token', 'staff-token']) {
      for (const resource of ['appointments', 'reports', 'bills', 'profiles']) {
        assert.equal((await f.request('/resources/' + resource, { token, method: 'POST', body: { id: 'fake', status: 'approved', role: 'admin' } })).status, 409);
      }
    }
    assert.equal(f.calls.some((call) => call.action === 'query'), false);
  } finally { await f.close(); }
});

test('support/private preferences are scoped to verified patient, protected fields never accepted', async () => {
  const f = await fixture();
  try {
    const response = await f.request('/resources/labsetu_support_tickets', { method: 'POST', token: 'valid-token', body: { id: 'ticket-1', subject: 'Synthetic question', user_id: staff.id, status: 'resolved', response: 'forged response' } });
    assert.equal(response.status, 200);
    const query = f.calls.find((call) => call.action === 'query');
    assert.equal(query.rows[0].user_id, user.id);
    assert.equal(query.rows[0].status, 'open');
    assert.equal(query.rows[0].response, undefined);
    assert.equal((await f.request('/resources/labsetu_privacy_settings', { method: 'POST', token: 'valid-token', body: { authorizedDoctors: [{ id: 'someone' }] } })).status, 400);
    const privacy = await f.request('/resources/labsetu_privacy_settings', { method: 'POST', token: 'valid-token', body: { smsAlerts: false, anonymousResearchConsent: false } });
    assert.equal(privacy.status, 200);
    const saved = f.calls.filter((call) => call.action === 'query').at(-1).rows[0];
    assert.equal(saved.user_id, user.id);
    assert.equal(saved.id, user.id);
  } finally { await f.close(); }
});

test('resource database errors return explicit failures without fake success or fallback writes', async () => {
  const f = await fixture({ queryError: { code: '42P01', message: 'table missing and sensitive context' } });
  try {
    for (const method of ['GET', 'POST']) {
      const response = await f.request('/resources/labsetu_support_tickets', { method, token: 'valid-token', ...(method === 'POST' ? { body: { subject: 'Synthetic question' } } : {}) });
      assert.equal(response.status, 503);
      const result = await response.json();
      assert.equal(result.success, false);
      assert.equal(JSON.stringify(result).includes('sensitive context'), false);
    }
    assert.equal(f.calls.filter((call) => call.action === 'query').length, 2);
    assert.equal(f.calls.some((call) => call.table === 'app_kv_store'), false);
  } finally { await f.close(); }
});

test('resource delete requires one identifier and enforces ownership scope', async () => {
  const f = await fixture({ rows: [{ id: 'ticket-1' }] });
  try {
    assert.equal((await f.request('/resources/labsetu_support_tickets', { method: 'DELETE', token: 'valid-token' })).status, 400);
    assert.equal((await f.request('/resources/reports?id=report-1', { method: 'DELETE', token: 'staff-token' })).status, 409);
    assert.equal((await f.request('/resources/labsetu_support_tickets?id=ticket-1', { method: 'DELETE', token: 'valid-token' })).status, 200);
    const query = f.calls.find((call) => call.action === 'query');
    assert.deepEqual(query.filters, [['id', 'ticket-1'], ['user_id', user.id]]);
  } finally { await f.close(); }
});

test('staff resource scope comes only from immutable app metadata', async () => {
  const f = await fixture();
  try {
    assert.equal((await f.request('/resources/referral_doctors', { method: 'POST', token: 'valid-token', body: { id: 'doctor-1' } })).status, 403);
    assert.equal((await f.request('/resources/referral_doctors?labId=forged', { token: 'staff-token' })).status, 200);
    const query = f.calls.find((call) => call.action === 'query');
    assert.deepEqual(query.filters, [['center_id', 'lab-1']]);
    const saved = await f.request('/resources/referral_doctors', { method: 'POST', token: 'staff-token', body: { id: 'doctor-1', center_id: 'forged-lab' } });
    assert.equal(saved.status, 200);
    assert.equal(f.calls.filter((call) => call.action === 'query').at(-1).rows[0].center_id, 'lab-1');
  } finally { await f.close(); }
});

test('logout and password reset reflect provider errors, never unconditional success', async () => {
  const f = await fixture({ auth: { admin: { signOut: async () => ({ error: { message: 'offline' } }) }, resetPasswordForEmail: async () => ({ error: { message: 'offline' } }) } });
  try {
    assert.equal((await f.request('/auth/logout', { method: 'POST' })).status, 401);
    assert.equal((await f.request('/auth/logout', { method: 'POST', token: 'valid-token' })).status, 503);
    assert.equal((await f.request('/auth/reset-password', { method: 'POST', body: { email: user.email } })).status, 503);
  } finally { await f.close(); }
});

test('a service-role key misplaced in anon configuration is rejected', async () => {
  const jwt = ['e30', Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'), 'synthetic'].join('.');
  for (const key of [jwt, 'sb_secret_synthetic']) {
    const f = await fixture({ config: { SUPABASE_URL: 'https://synthetic.example.test', SUPABASE_ANON_KEY: key } });
    try {
      assert.equal((await f.request('/resources/appointments', { token: 'valid-token' })).status, 503);
      assert.equal(f.calls.length, 0);
    } finally { await f.close(); }
  }
});

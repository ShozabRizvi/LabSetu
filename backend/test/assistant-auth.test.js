import assert from 'node:assert/strict';
import test from 'node:test';
import jwt from 'jsonwebtoken';
import { createPatientAuthentication } from '../src/assistant/auth.js';
import { demoCitizenId } from '../src/assistant/config.js';

const secret = 'synthetic-assistant-demo-secret-with-enough-length';
const validDemoToken = () => jwt.sign({}, secret, {
  algorithm: 'HS256',
  audience: 'labsetu-demo',
  issuer: 'labsetu-local',
  subject: demoCitizenId,
  expiresIn: '2m',
});

async function authenticate(middleware, authorization) {
  const req = { get: () => authorization };
  const res = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.payload = payload; return this; },
  };
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  return { req, res, nextCalled };
}

function supabaseOptions(getUser) {
  return {
    createSupabaseClient: () => ({ auth: { getUser } }),
  };
}

test('a genuine Supabase access token is validated even when demo mode is enabled', async () => {
  let receivedToken;
  const authentication = createPatientAuthentication({
    demoMode: true,
    jwtSecret: secret,
    supabaseUrl: 'https://project.supabase.co',
    supabaseKey: 'public-anon-key',
  }, supabaseOptions(async (token) => {
    receivedToken = token;
    return { data: { user: { id: 'auth-user-1', app_metadata: {}, user_metadata: { full_name: 'Verified patient' } } }, error: null };
  }));

  const result = await authenticate(authentication.authenticate, 'Bearer genuine-supabase-access-token');

  assert.equal(receivedToken, 'genuine-supabase-access-token');
  assert.equal(result.nextCalled, true);
  assert.deepEqual(result.req.actor, {
    id: 'auth-user-1', role: 'citizen', labId: null, canApproveReports: false, name: 'Verified patient',
  });
});

test('expired or invalid tokens are rejected after demo verification falls through to Supabase', async () => {
  let receivedToken;
  const authentication = createPatientAuthentication({
    demoMode: true,
    jwtSecret: secret,
    supabaseUrl: 'https://project.supabase.co',
    supabaseKey: 'public-anon-key',
  }, supabaseOptions(async (token) => {
    receivedToken = token;
    return { data: { user: null }, error: new Error('invalid token') };
  }));
  const expiredDemoToken = jwt.sign({}, secret, {
    algorithm: 'HS256',
    audience: 'labsetu-demo',
    issuer: 'labsetu-local',
    subject: demoCitizenId,
    expiresIn: -1,
  });

  const result = await authenticate(authentication.authenticate, `Bearer ${expiredDemoToken}`);

  assert.equal(receivedToken, expiredDemoToken);
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
  assert.equal(result.res.payload.code, 'UNAUTHENTICATED');
});

test('production mode never accepts a locally signed demo token', async () => {
  let receivedToken;
  const token = validDemoToken();
  const authentication = createPatientAuthentication({
    demoMode: false,
    jwtSecret: secret,
    supabaseUrl: 'https://project.supabase.co',
    supabaseKey: 'public-anon-key',
  }, supabaseOptions(async (received) => {
    receivedToken = received;
    return { data: { user: null }, error: new Error('unrecognized token') };
  }));

  const result = await authenticate(authentication.authenticate, `Bearer ${token}`);

  assert.equal(receivedToken, token);
  assert.equal(result.nextCalled, false);
  assert.equal(result.res.statusCode, 401);
});

test('a valid synthetic demo token is accepted only in explicit demo mode', async () => {
  const authentication = createPatientAuthentication({ demoMode: true, jwtSecret: secret });
  const result = await authenticate(authentication.authenticate, `Bearer ${validDemoToken()}`);

  assert.equal(result.nextCalled, true);
  assert.equal(result.req.actor.id, demoCitizenId);
  assert.equal(result.req.actor.demo, true);
});

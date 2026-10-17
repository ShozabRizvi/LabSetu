import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../server.js';

// These claims and credentials are synthetic fixtures, not a verified Supabase contract.
const secret = 'synthetic-security-test-secret';
const caseId = '00000000-0000-4000-8000-000000000001';
const claims = { role: 'authority', labId: 'signed-lab', aud: 'authenticated' };
const sign = (payload = claims, options = {}) => jwt.sign(payload, secret, {
  algorithm: 'HS256', expiresIn: '5m', ...options
});
const protectedRoutes = [
  ['GET', '/api/business/due-reports'],
  ['GET', '/api/billing/dues'],
  ['GET', '/api/imaging/cases'],
  ['GET', `/api/imaging/cases/${caseId}`],
  ['POST', '/api/imaging/cases'],
  ['PUT', `/api/imaging/cases/${caseId}`],
  ['GET', '/api/outsource/cases'],
  ['GET', `/api/outsource/cases/${caseId}`],
  ['POST', '/api/outsource/cases'],
  ['PUT', `/api/outsource/cases/${caseId}`],
  ['GET', '/api/analytics/tat'],
  ['GET', '/api/analytics/abnormal-results'],
  ['GET', '/api/analytics/test-frequency']
];

async function startServer(options) {
  const server = createApp(options).listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  return {
    async request(path, { method = 'GET', token, body } = {}) {
      const headers = {};
      if (token !== undefined) headers.authorization = `Bearer ${token}`;
      if (body !== undefined) headers['content-type'] = 'application/json';
      return fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method, headers, body: body === undefined ? undefined : JSON.stringify(body)
      });
    },
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}

describe('Authentication configuration fails closed', () => {
  it('blocks every endpoint by default despite a configured secret and database', async () => {
    let queries = 0;
    const api = await startServer({ pool: { async query() { queries += 1; return { rows: [] }; } }, jwtSecret: secret });
    try {
      for (const [method, path] of protectedRoutes) {
        const response = await api.request(path, { method, token: sign() });
        assert.equal(response.status, 503, `${method} ${path}`);
        assert.equal((await response.json()).error, 'The JWT claim contract has not been verified.');
      }
      assert.equal(queries, 0);
    } finally {
      await api.close();
    }
  });

  it('blocks every endpoint when the JWT secret is absent', async () => {
    let queries = 0;
    const api = await startServer({
      pool: { async query() { queries += 1; return { rows: [] }; } },
      jwtSecret: '', authContractVerified: true
    });
    try {
      for (const [method, path] of protectedRoutes) {
        const response = await api.request(path, { method, token: sign() });
        assert.equal(response.status, 503, `${method} ${path}`);
        assert.equal((await response.json()).error, 'Authentication is not configured.');
      }
      assert.equal(queries, 0);
    } finally {
      await api.close();
    }
  });
});

describe('Synthetic JWT signature and laboratory authorization regression tests', () => {
  let api;
  const queries = [];

  before(async () => {
    api = await startServer({
      jwtSecret: secret, authContractVerified: true,
      pool: { async query(sql, values) { queries.push({ sql, values }); return { rows: [{ id: caseId }] }; } }
    });
  });
  after(async () => { await api.close(); });

  it('requires credentials on every protected route before any database query', async () => {
    const beforeQueries = queries.length;
    for (const [method, path] of protectedRoutes) {
      const response = await api.request(path, { method });
      assert.equal(response.status, 401, `${method} ${path}`);
      assert.equal((await response.json()).success, false);
    }
    assert.equal(queries.length, beforeQueries);
  });

  const invalidTokens = [
    ['a forged signature', () => jwt.sign(claims, 'wrong-synthetic-secret', { algorithm: 'HS256', expiresIn: '5m' })],
    ['an unsigned token', () => jwt.sign(claims, '', { algorithm: 'none', expiresIn: '5m' })],
    ['an unapproved HS384 algorithm', () => sign(claims, { algorithm: 'HS384' })],
    ['the wrong audience', () => sign({ ...claims, aud: 'other-audience' })],
    ['an expired token', () => sign(claims, { expiresIn: -1 })],
    ['a token without an expiry', () => jwt.sign(claims, secret, { algorithm: 'HS256' })]
  ];
  for (const [label, token] of invalidTokens) {
    it(`rejects ${label} without querying the database`, async () => {
      const beforeQueries = queries.length;
      const response = await api.request('/api/imaging/cases', { token: token() });
      assert.equal(response.status, 401);
      assert.equal((await response.json()).success, false);
      assert.equal(queries.length, beforeQueries);
    });
  }

  const forbiddenClaims = [
    ['a missing laboratory', { role: 'authority', aud: 'authenticated' }],
    ['a blank laboratory', { ...claims, labId: '   ' }],
    ['a non-string laboratory', { ...claims, labId: 42 }],
    ['a citizen role', { ...claims, role: 'citizen' }]
  ];
  for (const [label, payload] of forbiddenClaims) {
    it(`rejects ${label} without querying the database`, async () => {
      const beforeQueries = queries.length;
      const response = await api.request('/api/outsource/cases', { token: sign(payload) });
      assert.equal(response.status, 403);
      assert.equal((await response.json()).success, false);
      assert.equal(queries.length, beforeQueries);
    });
  }

  it('uses the signed laboratory instead of query or body laboratory overrides', async () => {
    const token = sign();
    for (const path of ['/api/imaging/cases', '/api/outsource/cases']) {
      const response = await api.request(`${path}?labId=other-lab&lab_id=other-lab`, { token });
      assert.equal(response.status, 200);
      await response.json();
      assert.equal(queries.at(-1).values[0], 'signed-lab');
    }
    const attempts = [
      ['/api/imaging/cases', { patientId: caseId, caseType: 'usg' }],
      ['/api/outsource/cases', { patientId: caseId, testName: 'Synthetic test', partnerLabName: 'Synthetic partner' }]
    ];
    for (const [path, body] of attempts) {
      const response = await api.request(path, {
        method: 'POST', token, body: { ...body, labId: 'other-lab', lab_id: 'other-lab' }
      });
      assert.equal(response.status, 201);
      await response.json();
      assert.equal(queries.at(-1).values[0], 'signed-lab');
      assert.equal(queries.at(-1).values.includes('other-lab'), false);
    }
  });
});

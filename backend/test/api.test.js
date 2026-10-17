import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../server.js';

const secret = 'test-only-secret';
const tokenFor = (role = 'authority', labId = 'lab-1') => jwt.sign(
  { role, labId, aud: 'authenticated' }, secret, { algorithm: 'HS256', expiresIn: '5m' }
);

async function startServer(pool, options = {}) {
  const server = createApp({ pool, jwtSecret: secret, authContractVerified: true, ...options }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  return {
    server,
    request: (path, { method = 'GET', token = tokenFor(), body } = {}) => fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  };
}

describe('LabSetu reduced backend APIs', () => {
  let api;
  const queries = [];
  const pool = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (sql.includes('FROM due')) {
        return { rows: [{
          cases: [{ caseId: 'case-1', outstandingAmount: '30.00', ageDays: 60 }],
          case_count: 1,
          billed_total: '100.00',
          paid_total: '70.00',
          outstanding_total: '30.00',
          days_0_7: '0',
          days_8_30: '0',
          days_31_59: '0',
          days_60_plus: '30.00'
        }] };
      }
      if (sql.includes('INSERT INTO imaging_cases')) return { rows: [{ id: values[0], patientId: values[1], caseType: values[2], status: 'requested' }] };
      if (sql.includes('FROM imaging_cases') || sql.includes('UPDATE imaging_cases')) return { rows: [{ id: values[0], patientId: 'patient-1', caseType: 'usg', status: 'completed' }] };
      if (sql.includes('INSERT INTO outsource_cases')) return { rows: [{ id: 'outsource-1', patientId: values[1], testName: values[2], partnerLabName: values[3], status: 'routed' }] };
      if (sql.includes('FROM outsource_cases') || sql.includes('UPDATE outsource_cases')) return { rows: [{ id: values[0], patientId: 'patient-1', testName: 'CBC', partnerLabName: 'Partner Lab', status: 'accepted' }] };
      if (sql.includes('percentile_cont')) return { rows: [{ sample_count: 2, average_seconds: '3600.50', median_seconds: '3300.00' }] };
      if (sql.includes('abnormal_rate_percent')) return { rows: [{ evaluated_count: 4, abnormal_count: 1, abnormal_rate_percent: '25.00' }] };
      if (sql.includes('GROUP BY test_id')) return { rows: [{ testId: 'test-1', testName: 'CBC', frequency: 3 }] };
      throw new Error(`Unexpected SQL: ${sql}`);
    }
  };

  before(async () => { api = await startServer(pool); });
  after(async () => { await new Promise((resolve) => api.server.close(resolve)); });

  it('rejects missing and non-authority credentials', async () => {
    const missing = await fetch(`http://127.0.0.1:${api.server.address().port}/api/business/due-reports`);
    assert.equal(missing.status, 401);
    const citizen = await api.request('/api/business/due-reports', { token: tokenFor('citizen') });
    assert.equal(citizen.status, 403);
  });

  it('returns case-wise due totals with day 60 only in the 60+ bucket', async () => {
    const response = await api.request('/api/business/due-reports?asOf=2026-10-17&caseType=usg');
    assert.equal(response.status, 200);
    const { data } = await response.json();
    assert.equal(data.outstandingTotal, '30.00');
    assert.equal(data.aging.days31To59, '0');
    assert.equal(data.aging.days60Plus, '30.00');
    assert.match(queries.at(-1).sql, /age_days <= 7/);
    assert.match(queries.at(-1).sql, /age_days BETWEEN 8 AND 30/);
    assert.match(queries.at(-1).sql, /age_days BETWEEN 31 AND 59/);
    assert.match(queries.at(-1).sql, /age_days >= 60/);
    assert.equal(queries.at(-1).values[0], 'lab-1');
  });

  it('returns a controlled error when the database query fails', async () => {
    const failing = await startServer({ query: async () => { throw new Error('database detail'); } });
    try {
      const response = await failing.request('/api/business/due-reports');
      assert.equal(response.status, 500);
      assert.equal((await response.json()).error, 'Unable to load due reports.');
    } finally {
      await new Promise((resolve) => failing.server.close(resolve));
    }
  });

  it('reports database integration unavailable instead of returning mock data', async () => {
    const unconfigured = await startServer(null);
    try {
      const response = await unconfigured.request('/api/business/due-reports');
      assert.equal(response.status, 503);
      assert.equal((await response.json()).error, 'Database integration is not configured.');
    } finally {
      await new Promise((resolve) => unconfigured.server.close(resolve));
    }
  });

  it('validates imaging requests and supports create and scoped read', async () => {
    const invalid = await api.request('/api/imaging/cases', { method: 'POST', body: { caseType: 'mri' } });
    assert.equal(invalid.status, 400);
    const created = await api.request('/api/imaging/cases', {
      method: 'POST',
      body: { patientId: '00000000-0000-4000-8000-000000000001', caseType: 'usg' }
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).data.status, 'requested');
    const read = await api.request('/api/imaging/cases/00000000-0000-4000-8000-000000000001');
    assert.equal(read.status, 200);
    assert.match(queries.at(-1).sql, /id = \$1 AND lab_id = \$2/);
  });

  it('validates and routes outsourced cases with a lab-scoped update', async () => {
    const invalid = await api.request('/api/outsource/cases', { method: 'POST', body: {} });
    assert.equal(invalid.status, 400);
    const created = await api.request('/api/outsource/cases', {
      method: 'POST',
      body: { patientId: '00000000-0000-4000-8000-000000000001', testName: 'CBC', partnerLabName: 'Partner Lab' }
    });
    assert.equal(created.status, 201);
    assert.equal((await created.json()).data.status, 'routed');
    const updated = await api.request('/api/outsource/cases/00000000-0000-4000-8000-000000000002', {
      method: 'PUT', body: { status: 'accepted' }
    });
    assert.equal(updated.status, 200);
    assert.match(queries.at(-1).sql, /WHERE id = \$1 AND lab_id = \$2/);
  });

  it('returns database-backed analytics aggregates and validates filters', async () => {
    assert.equal((await api.request('/api/analytics/tat?from=not-a-date')).status, 400);
    const tat = await api.request('/api/analytics/tat?from=2026-01-01&to=2026-01-31');
    assert.deepEqual((await tat.json()).data, { sampleCount: 2, averageSeconds: '3600.50', medianSeconds: '3300.00' });
    const abnormal = await api.request('/api/analytics/abnormal-results');
    assert.equal((await abnormal.json()).data.abnormalRatePercent, '25.00');
    const frequency = await api.request('/api/analytics/test-frequency?caseId=00000000-0000-4000-8000-000000000001');
    assert.equal((await frequency.json()).data[0].frequency, 3);
    assert.equal(queries.at(-1).values[0], 'lab-1');
  });
});

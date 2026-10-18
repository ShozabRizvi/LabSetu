import assert from 'node:assert/strict';
import { it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../server.js';

const secret = 'synthetic-reports-test-secret';
const labId = 'synthetic-reports-lab';
const recordId = '00000000-0000-4000-8000-000000000001';
const analyticsPaths = ['/api/analytics/tat', '/api/analytics/abnormal-results', '/api/analytics/test-frequency'];
const reportPaths = ['/api/business/due-reports', '/api/billing/dues', ...analyticsPaths];
const tokenFor = (role = 'authority', signingSecret = secret) => jwt.sign(
  { role, labId, aud: 'authenticated' }, signingSecret, { algorithm: 'HS256', expiresIn: '5m' }
);

async function startServer(t, pool) {
  // This opt-in represents a synthetic claim contract, never a verified live Supabase contract.
  const server = createApp({ pool, jwtSecret: secret, authContractVerified: true }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  return (path, token = tokenFor()) => fetch(`http://127.0.0.1:${server.address().port}${path}`, {
    headers: token === null ? {} : { authorization: `Bearer ${token}` }
  });
}

function fixturePool({ empty = false } = {}) {
  const queries = [];
  return {
    queries,
    async query(sql, values) {
      queries.push({ sql, values });
      // These fixtures verify SQL contracts and HTTP mapping, not PostgreSQL arithmetic.
      if (sql.includes('FROM due')) return { rows: [{
        cases: [], case_count: '0', billed_total: '0', paid_total: '0', outstanding_total: '0',
        days_0_7: '0', days_8_30: '0', days_31_59: '0', days_60_plus: '0'
      }] };
      if (sql.includes('percentile_cont')) return { rows: [{
        sample_count: empty ? '0' : '2', average_seconds: empty ? '0' : '3600.50', median_seconds: empty ? '0' : '3300.00'
      }] };
      if (sql.includes('abnormal_rate_percent')) return { rows: [{
        evaluated_count: empty ? '0' : '4', abnormal_count: empty ? '0' : '1', abnormal_rate_percent: empty ? '0' : '25.00'
      }] };
      if (sql.includes('GROUP BY test_id')) return { rows: empty ? [] : [{ testId: recordId, testName: 'Synthetic test', frequency: 3 }] };
      throw new Error('Unexpected query in reports test fixture.');
    }
  };
}

it('serves the billing dues alias with the same response and authorization as due reports', async (t) => {
  const pool = fixturePool();
  const request = await startServer(t, pool);
  const primary = await request('/api/business/due-reports?asOf=2026-10-17');
  const alias = await request('/api/billing/dues?asOf=2026-10-17');
  assert.equal(primary.status, 200);
  assert.equal(alias.status, 200);
  assert.deepEqual(await alias.json(), await primary.json());
  assert.deepEqual(pool.queries[0], pool.queries[1]);

  for (const path of reportPaths) {
    for (const [token, status] of [[null, 401], [tokenFor('authority', 'different-test-secret'), 401], [tokenFor('citizen'), 403]]) {
      const response = await request(path, token);
      assert.equal(response.status, status, path);
      assert.equal((await response.json()).success, false);
    }
  }
  assert.equal(pool.queries.length, 2, 'Unauthorized requests must never reach the database.');
});

it('rejects malformed business filters before querying, including PostgreSQL-invalid year zero', async (t) => {
  const pool = fixturePool();
  const request = await startServer(t, pool);
  const invalidFilters = [
    'asOf=0000-01-01', 'from=0000-01-01', 'to=0000-01-01',
    'asOf=2026-02-29', 'from=2026-04-31', 'to=2026-10-17T00:00:00Z',
    'from=2026-10-18&to=2026-10-17', 'from=2026-01-01&from=2026-02-01',
    'asOf=2026-01-01&asOf=2026-02-01', 'caseType=usg&caseType=ct_scan',
    `caseType=${'x'.repeat(65)}`, `patientId=${encodeURIComponent("' OR 1=1 --")}`,
    `patientId=${recordId}&patientId=${recordId}`
  ];
  for (const filters of invalidFilters) {
    const response = await request(`/api/business/due-reports?${filters}`);
    assert.equal(response.status, 400, filters);
    assert.equal((await response.json()).success, false);
  }
  assert.equal(pool.queries.length, 0);
});

it('rejects invalid analytics dates, repeated parameters, and UUID injection on every analytics route', async (t) => {
  const pool = fixturePool();
  const request = await startServer(t, pool);
  const invalidFilters = [
    'from=0000-01-01', 'to=0000-01-01', 'from=2026-02-29', 'to=not-a-date',
    'from=2026-10-18&to=2026-10-17', 'from=2026-01-01&from=2026-02-01',
    `caseId=${encodeURIComponent("' OR 1=1 --")}`, `caseId=${recordId}&caseId=${recordId}`
  ];
  for (const path of analyticsPaths) {
    for (const filters of invalidFilters) {
      const response = await request(`${path}?${filters}`);
      assert.equal(response.status, 400, `${path}?${filters}`);
      assert.equal((await response.json()).success, false);
    }
  }
  assert.equal(pool.queries.length, 0);
});

it('binds business filters and laboratory scope without interpolating caseType SQL text', async (t) => {
  const pool = fixturePool();
  const request = await startServer(t, pool);
  const caseType = "usg' OR 1=1 --";
  const filters = new URLSearchParams({ caseType, patientId: recordId, asOf: '2024-03-01', from: '2024-02-29', to: '2024-03-01' });
  const response = await request(`/api/business/due-reports?${filters}`);
  assert.equal(response.status, 200, 'A valid leap day is accepted.');
  const { sql, values } = pool.queries[0];
  assert.deepEqual(values, [labId, caseType, recordId, '2024-03-01', '2024-02-29', '2024-03-01']);
  assert.equal(sql.includes(caseType), false);
  assert.match(sql, /WHERE lab_id = \$1/);
  assert.match(sql, /case_type = \$2/);
  assert.match(sql, /patient_id = \$3/);
  assert.match(sql, /case_created_at::date >= \$5/);
  assert.match(sql, /case_created_at::date <= \$6/);
  assert.match(sql, /GREATEST\(billed_amount - paid_amount, 0\)/);
  assert.match(sql, /GREATEST\(\$4::date - due_at::date, 0\)/);
  assert.match(sql, /SELECT \* FROM filtered WHERE outstanding_amount > 0/);
  assert.match(sql, /sum\(billed_amount\)/);
  assert.match(sql, /sum\(paid_amount\)/);
  assert.match(sql, /sum\(outstanding_amount\)/);
  assert.match(sql, /age_days <= 7/);
  assert.match(sql, /age_days BETWEEN 8 AND 30/);
  assert.match(sql, /age_days BETWEEN 31 AND 59/);
  assert.match(sql, /age_days >= 60/);
  assert.doesNotMatch(sql, /age_days BETWEEN 31 AND 60/);
});

it('maps empty database aggregates to explicit zero totals, zero analytics counts, and empty arrays', async (t) => {
  const request = await startServer(t, fixturePool({ empty: true }));
  const due = await request('/api/business/due-reports?asOf=2026-10-17');
  assert.equal(due.status, 200);
  assert.deepEqual(await due.json(), { success: true, data: {
    asOf: '2026-10-17', caseCount: 0, billedTotal: '0', paidTotal: '0', outstandingTotal: '0',
    aging: { days0To7: '0', days8To30: '0', days31To59: '0', days60Plus: '0' }, cases: []
  } });
  const expected = [
    { sampleCount: 0, averageSeconds: '0', medianSeconds: '0' },
    { evaluatedCount: 0, abnormalCount: 0, abnormalRatePercent: '0' },
    []
  ];
  for (const [index, path] of analyticsPaths.entries()) {
    const response = await request(path);
    assert.equal(response.status, 200, path);
    assert.deepEqual(await response.json(), { success: true, data: expected[index] });
  }
});

it('preserves analytics filter scope, calculation SQL contracts, and aggregate response mapping', async (t) => {
  const pool = fixturePool();
  const request = await startServer(t, pool);
  const expected = [
    { sampleCount: 2, averageSeconds: '3600.50', medianSeconds: '3300.00' },
    { evaluatedCount: 4, abnormalCount: 1, abnormalRatePercent: '25.00' },
    [{ testId: recordId, testName: 'Synthetic test', frequency: 3 }]
  ];
  for (const [index, path] of analyticsPaths.entries()) {
    const response = await request(`${path}?from=2024-02-29&to=2024-03-01&caseId=${recordId}`);
    assert.equal(response.status, 200, path);
    assert.deepEqual(await response.json(), { success: true, data: expected[index] });
    const { sql, values } = pool.queries.at(-1);
    assert.deepEqual(values, [labId, '2024-02-29', '2024-03-01', recordId]);
    assert.match(sql, /lab_id = \$1/);
    assert.match(sql, /ordered_at::date >= \$2/);
    assert.match(sql, /ordered_at::date <= \$3/);
    assert.match(sql, /case_id = \$4/);
  }

  const tatSql = pool.queries[0].sql;
  assert.match(tatSql, /extract\(epoch FROM \(completed_at - ordered_at\)\)/);
  assert.match(tatSql, /status = 'completed' AND completed_at IS NOT NULL AND completed_at >= ordered_at/);
  assert.match(tatSql, /avg\(duration_seconds\)/);
  assert.match(tatSql, /percentile_cont\(0\.5\)/);
  assert.match(tatSql, /COALESCE\(round\(avg\(duration_seconds\), 2\), 0\)/);
  const abnormalSql = pool.queries[1].sql;
  assert.match(abnormalSql, /status = 'completed' AND completed_at IS NOT NULL AND is_abnormal IS NOT NULL/);
  assert.match(abnormalSql, /CASE WHEN count\(\*\) = 0 THEN 0/);
  assert.match(abnormalSql, /100\.0 \* count\(\*\) FILTER \(WHERE is_abnormal\) \/ count\(\*\)/);
  const frequencySql = pool.queries[2].sql;
  assert.match(frequencySql, /status <> 'cancelled'/);
  assert.match(frequencySql, /GROUP BY test_id, test_name/);
  assert.match(frequencySql, /ORDER BY frequency DESC, test_name, test_id/);
});

it('returns database unavailable errors on every report and analytics route without mock success', async (t) => {
  const request = await startServer(t, null);
  for (const path of reportPaths) {
    const response = await request(path);
    assert.equal(response.status, 503, path);
    assert.deepEqual(await response.json(), { success: false, error: 'Database integration is not configured.' });
  }
});

it('sanitizes database failures on every report and analytics route', async (t) => {
  let queryCount = 0;
  const request = await startServer(t, { async query() {
    queryCount += 1;
    throw new Error('Synthetic private database failure: password=not-a-real-password SELECT secret');
  } });
  const errors = [
    'Unable to load due reports.', 'Unable to load due reports.',
    'Unable to calculate turnaround time.', 'Unable to calculate abnormal result rate.', 'Unable to calculate test frequency.'
  ];
  for (const [index, path] of reportPaths.entries()) {
    const response = await request(path);
    assert.equal(response.status, 500, path);
    assert.deepEqual(await response.json(), { success: false, error: errors[index] });
  }
  assert.equal(queryCount, reportPaths.length);
});

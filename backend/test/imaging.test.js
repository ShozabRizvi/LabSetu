import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import jwt from 'jsonwebtoken';
import { createApp } from '../server.js';

const secret = 'imaging-regression-test-secret';
const labId = 'token-lab';
const patientId = '00000000-0000-4000-8000-000000000001';
const caseId = '00000000-0000-4000-8000-000000000002';
const imagingPath = '/api/imaging/cases';
const outsourcePath = '/api/outsource/cases';

async function startApi(t, { fail = false } = {}) {
  const queries = [];
  const results = [];
  const pool = {
    async query(sql, values) {
      queries.push({ sql, values });
      if (fail) throw new Error('private database detail');
      return { rows: results.shift() ?? [] };
    }
  };
  const server = createApp({ pool, jwtSecret: secret, authContractVerified: true }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  const token = jwt.sign({ role: 'authority', labId, aud: 'authenticated' }, secret, {
    algorithm: 'HS256', expiresIn: '5m'
  });
  return {
    queries,
    results,
    async request(path, method = 'GET', body) {
      const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
        method,
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
      return { status: response.status, body: await response.json() };
    }
  };
}

function assertScopedRecordQuery(query) {
  assert.match(query.sql, /WHERE id = \$1 AND lab_id = \$2/);
  assert.deepEqual(query.values.slice(0, 2), [caseId, labId]);
}

describe('imaging and outsource API regressions (synthetic database results)', () => {
  for (const caseType of ['ct_scan', 'usg', 'digital_xray']) {
    it(`creates, lists, reads, and updates ${caseType} within the token lab`, async (t) => {
      const api = await startApi(t);
      const row = { id: caseId, patientId, caseType, status: 'requested' };
      api.results.push([row]);
      const created = await api.request(imagingPath, 'POST', {
        patientId, caseType, accessionNumber: 'ACC-1', referredBy: 'Dr Test', notes: 'Initial note', labId: 'other-lab'
      });
      assert.deepEqual(created, { status: 201, body: { success: true, data: row } });
      assert.match(api.queries.at(-1).sql, /INSERT INTO imaging_cases/);
      assert.deepEqual(api.queries.at(-1).values, [labId, patientId, caseType, 'ACC-1', 'Dr Test', 'Initial note']);

      api.results.push([row]);
      const listed = await api.request(`${imagingPath}?caseType=${caseType}&status=requested&labId=other-lab`);
      assert.deepEqual(listed, { status: 200, body: { success: true, data: [row] } });
      assert.match(api.queries.at(-1).sql, /WHERE lab_id = \$1/);
      assert.deepEqual(api.queries.at(-1).values, [labId, caseType, 'requested']);

      api.results.push([row]);
      assert.deepEqual(await api.request(`${imagingPath}/${caseId}?labId=other-lab`), {
        status: 200, body: { success: true, data: row }
      });
      assertScopedRecordQuery(api.queries.at(-1));

      const updatedRow = { ...row, status: 'completed', accessionNumber: 'ACC-2', referredBy: null, notes: 'Updated note' };
      api.results.push([updatedRow]);
      assert.deepEqual(await api.request(`${imagingPath}/${caseId}`, 'PUT', {
        status: 'completed', accessionNumber: 'ACC-2', referredBy: null, notes: 'Updated note', lab_id: 'other-lab'
      }), { status: 200, body: { success: true, data: updatedRow } });
      assertScopedRecordQuery(api.queries.at(-1));
      assert.match(api.queries.at(-1).sql, /status = \$3, accession_number = \$4, referred_by = \$5, notes = \$6/);
      assert.deepEqual(api.queries.at(-1).values, [caseId, labId, 'completed', 'ACC-2', null, 'Updated note']);
    });
  }

  it('accepts optional text boundaries and clears optional fields with null', async (t) => {
    const api = await startApi(t);
    const fields = { accessionNumber: 'a'.repeat(128), referredBy: 'r'.repeat(256), notes: 'n'.repeat(4000) };
    api.results.push([{ id: caseId }]);
    assert.equal((await api.request(imagingPath, 'POST', { patientId, caseType: 'usg', ...fields })).status, 201);
    assert.deepEqual(api.queries.at(-1).values.slice(3), Object.values(fields));
    api.results.push([{ id: caseId }]);
    assert.equal((await api.request(`${imagingPath}/${caseId}`, 'PUT', fields)).status, 200);
    assert.deepEqual(api.queries.at(-1).values.slice(2), Object.values(fields));
    api.results.push([{ id: caseId, accessionNumber: null, referredBy: null, notes: null }]);
    assert.equal((await api.request(`${imagingPath}/${caseId}`, 'PUT', {
      accessionNumber: null, referredBy: null, notes: null
    })).status, 200);
    assert.deepEqual(api.queries.at(-1).values, [caseId, labId, null, null, null]);
  });

  it('rejects invalid imaging text types and lengths before querying the database', async (t) => {
    const api = await startApi(t);
    for (const [field, maxLength] of [['accessionNumber', 128], ['referredBy', 256], ['notes', 4000]]) {
      for (const value of [42, false, {}, [], 'x'.repeat(maxLength + 1)]) {
        for (const [path, method, body] of [
          [imagingPath, 'POST', { patientId, caseType: 'usg', [field]: value }],
          [`${imagingPath}/${caseId}`, 'PUT', { [field]: value }]
        ]) {
          assert.equal((await api.request(path, method, body)).status, 400, `${method} ${field} ${typeof value}`);
        }
      }
    }
    assert.equal(api.queries.length, 0);
  });

  it('rejects invalid imaging statuses, identifiers, empty updates, and malformed filters before querying', async (t) => {
    const api = await startApi(t);
    for (const status of ['unknown', '', null, 42, {}, []]) {
      assert.equal((await api.request(`${imagingPath}/${caseId}`, 'PUT', { status })).status, 400);
    }
    for (const body of [{}, { labId: 'other-lab' }, null, []]) {
      assert.equal((await api.request(`${imagingPath}/${caseId}`, 'PUT', body)).status, 400);
    }
    for (const body of [{ patientId, caseType: 'mri' }, { patientId: 'not-a-uuid', caseType: 'usg' }]) {
      assert.equal((await api.request(imagingPath, 'POST', body)).status, 400);
    }
    assert.equal((await api.request(`${imagingPath}/not-a-uuid`)).status, 400);
    assert.equal((await api.request(`${imagingPath}/not-a-uuid`, 'PUT', { status: 'completed' })).status, 400);
    for (const filter of ['caseType=', 'status=', 'caseType=mri', 'status=unknown', 'status=requested&status=completed']) {
      assert.equal((await api.request(`${imagingPath}?${filter}`)).status, 400, filter);
    }
    assert.equal(api.queries.length, 0);
  });

  it('routes, lists, reads, and updates outsourced cases using only the token lab', async (t) => {
    const api = await startApi(t);
    const row = {
      id: caseId, patientId, testName: 'CBC', partnerLabName: 'Partner Lab', status: 'routed',
      routedAt: '2026-10-17T00:00:00Z'
    };
    api.results.push([row]);
    assert.deepEqual(await api.request(outsourcePath, 'POST', {
      patientId, testName: '  CBC  ', partnerLabName: ' Partner Lab ', labId: 'other-lab'
    }), { status: 201, body: { success: true, data: row } });
    assert.match(api.queries.at(-1).sql, /INSERT INTO outsource_cases/);
    assert.match(api.queries.at(-1).sql, /'routed', now\(\)/);
    assert.deepEqual(api.queries.at(-1).values, [labId, patientId, 'CBC', 'Partner Lab']);

    api.results.push([row]);
    assert.deepEqual(await api.request(`${outsourcePath}?status=routed&patientId=${patientId}&labId=other-lab`), {
      status: 200, body: { success: true, data: [row] }
    });
    assert.match(api.queries.at(-1).sql, /WHERE lab_id = \$1/);
    assert.deepEqual(api.queries.at(-1).values, [labId, 'routed', patientId]);

    api.results.push([row]);
    assert.deepEqual(await api.request(`${outsourcePath}/${caseId}?labId=other-lab`), {
      status: 200, body: { success: true, data: row }
    });
    assertScopedRecordQuery(api.queries.at(-1));

    for (const [body, expectedValues] of [
      [{ status: 'accepted', labId: 'other-lab' }, [caseId, labId, false, null, true, 'accepted']],
      [{ partnerLabName: ' New Partner ', lab_id: 'other-lab' }, [caseId, labId, true, 'New Partner', false, null]],
      [{ status: 'routed', partnerLabName: ' Final Partner ' }, [caseId, labId, true, 'Final Partner', true, 'routed']]
    ]) {
      api.results.push([row]);
      assert.equal((await api.request(`${outsourcePath}/${caseId}`, 'PUT', body)).status, 200);
      assertScopedRecordQuery(api.queries.at(-1));
      assert.deepEqual(api.queries.at(-1).values, expectedValues);
    }
  });

  it('rejects malformed outsource writes and filters without database queries', async (t) => {
    const api = await startApi(t);
    const valid = { patientId, testName: 'CBC', partnerLabName: 'Partner Lab' };
    for (const body of [
      {}, { ...valid, patientId: 'invalid' }, { ...valid, testName: ' ' }, { ...valid, testName: [] },
      { ...valid, testName: 'x'.repeat(257) }, { ...valid, partnerLabName: null },
      { ...valid, partnerLabName: ' ' }, { ...valid, partnerLabName: 'x'.repeat(257) }
    ]) {
      assert.equal((await api.request(outsourcePath, 'POST', body)).status, 400);
    }
    for (const body of [{}, { labId: 'other-lab' }, { status: '' }, { status: 'unknown' }, { status: null },
      { partnerLabName: [] }, { partnerLabName: ' ' }, { partnerLabName: 'x'.repeat(257) }]) {
      assert.equal((await api.request(`${outsourcePath}/${caseId}`, 'PUT', body)).status, 400);
    }
    assert.equal((await api.request(`${outsourcePath}/invalid`)).status, 400);
    assert.equal((await api.request(`${outsourcePath}/invalid`, 'PUT', { status: 'accepted' })).status, 400);
    for (const filter of ['status=', 'status=unknown', 'patientId=', 'patientId=invalid', 'status=routed&status=accepted']) {
      assert.equal((await api.request(`${outsourcePath}?${filter}`)).status, 400, filter);
    }
    assert.equal(api.queries.length, 0);
  });

  it('returns empty lists and scoped 404s when the database returns no records', async (t) => {
    const api = await startApi(t);
    for (const [path, status, missingError] of [
      [imagingPath, 'completed', 'Imaging case not found.'],
      [outsourcePath, 'accepted', 'Outsource case not found.']
    ]) {
      assert.deepEqual(await api.request(`${path}?labId=other-lab`), { status: 200, body: { success: true, data: [] } });
      assert.equal(api.queries.at(-1).values[0], labId);
      for (const method of ['GET', 'PUT']) {
        assert.deepEqual(await api.request(`${path}/${caseId}?labId=other-lab`, method,
          method === 'PUT' ? { status, labId: 'other-lab' } : undefined), {
          status: 404, body: { success: false, error: missingError }
        });
        assertScopedRecordQuery(api.queries.at(-1));
      }
    }
  });

  it('returns controlled errors for every imaging and outsource database operation', async (t) => {
    const api = await startApi(t, { fail: true });
    for (const [path, method, body, error] of [
      [imagingPath, 'GET', undefined, 'Unable to load imaging cases.'],
      [`${imagingPath}/${caseId}`, 'GET', undefined, 'Unable to load imaging case.'],
      [imagingPath, 'POST', { patientId, caseType: 'usg' }, 'Unable to create imaging case.'],
      [`${imagingPath}/${caseId}`, 'PUT', { status: 'completed' }, 'Unable to update imaging case.'],
      [outsourcePath, 'GET', undefined, 'Unable to load outsourced cases.'],
      [`${outsourcePath}/${caseId}`, 'GET', undefined, 'Unable to load outsource case.'],
      [outsourcePath, 'POST', { patientId, testName: 'CBC', partnerLabName: 'Partner' }, 'Unable to route outsource case.'],
      [`${outsourcePath}/${caseId}`, 'PUT', { status: 'accepted' }, 'Unable to update outsource case.']
    ]) {
      assert.deepEqual(await api.request(path, method, body), { status: 500, body: { success: false, error } });
    }
    assert.equal(api.queries.length, 8);
  });
});

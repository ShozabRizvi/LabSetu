import express from 'express';
import { parseUuid, sendDatabaseUnavailable } from './http.js';

const imagingTypes = new Set(['ct_scan', 'usg', 'digital_xray']);
const imagingStatuses = new Set(['requested', 'scheduled', 'in_progress', 'completed', 'cancelled']);
const imagingColumns = {
  status: 'status',
  accessionNumber: 'accession_number',
  referredBy: 'referred_by',
  notes: 'notes'
};
const imagingSelect = `id, patient_id AS "patientId", case_type AS "caseType", status,
  accession_number AS "accessionNumber", referred_by AS "referredBy", notes,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

function validOptionalText(value, maxLength) {
  return value === null || value === undefined || (typeof value === 'string' && value.length <= maxLength);
}

export function createImagingRouter({ pool, requireAuthority }) {
  const router = express.Router();

  router.get('/cases', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const { caseType = null, status = null } = req.query;
    if ((caseType !== null && !imagingTypes.has(caseType)) || (status !== null && !imagingStatuses.has(status))) {
      return res.status(400).json({ success: false, error: 'Invalid caseType or status filter.' });
    }
    try {
      const result = await pool.query(
        `SELECT ${imagingSelect} FROM imaging_cases
         WHERE lab_id = $1 AND ($2::text IS NULL OR case_type = $2) AND ($3::text IS NULL OR status = $3)
         ORDER BY created_at DESC, id`,
        [req.authority.labId, caseType, status]
      );
      return res.json({ success: true, data: result.rows });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to load imaging cases.' });
    }
  });

  router.get('/cases/:id', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const id = parseUuid(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'A valid case id is required.' });
    try {
      const { rows: [row] } = await pool.query(
        `SELECT ${imagingSelect} FROM imaging_cases WHERE id = $1 AND lab_id = $2`,
        [id, req.authority.labId]
      );
      return row ? res.json({ success: true, data: row }) : res.status(404).json({ success: false, error: 'Imaging case not found.' });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to load imaging case.' });
    }
  });

  router.post('/cases', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const { patientId, caseType, accessionNumber = null, referredBy = null, notes = null } = req.body || {};
    const patientUuid = parseUuid(patientId);
    if (!patientUuid || !imagingTypes.has(caseType) ||
        !validOptionalText(accessionNumber, 128) || !validOptionalText(referredBy, 256) || !validOptionalText(notes, 4000)) {
      return res.status(400).json({ success: false, error: 'Provide a valid patientId, caseType, and optional text fields.' });
    }
    try {
      const { rows: [row] } = await pool.query(
        `INSERT INTO imaging_cases (lab_id, patient_id, case_type, status, accession_number, referred_by, notes)
         VALUES ($1, $2, $3, 'requested', $4, $5, $6) RETURNING ${imagingSelect}`,
        [req.authority.labId, patientUuid, caseType, accessionNumber, referredBy, notes]
      );
      return res.status(201).json({ success: true, data: row });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to create imaging case.' });
    }
  });

  router.put('/cases/:id', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const id = parseUuid(req.params.id);
    const body = req.body || {};
    const entries = Object.entries(imagingColumns).filter(([key]) => Object.hasOwn(body, key));
    if (!id || entries.length === 0 || entries.some(([key]) =>
      (key === 'status' ? !imagingStatuses.has(body[key]) : !validOptionalText(body[key], key === 'notes' ? 4000 : key === 'referredBy' ? 256 : 128)))) {
      return res.status(400).json({ success: false, error: 'Provide a valid case id and at least one allowed update field.' });
    }
    const values = [id, req.authority.labId];
    const assignments = entries.map(([key]) => {
      values.push(body[key]);
      return `${imagingColumns[key]} = $${values.length}`;
    });
    try {
      const { rows: [row] } = await pool.query(
        `UPDATE imaging_cases SET ${assignments.join(', ')}, updated_at = now()
         WHERE id = $1 AND lab_id = $2 RETURNING ${imagingSelect}`,
        values
      );
      return row ? res.json({ success: true, data: row }) : res.status(404).json({ success: false, error: 'Imaging case not found.' });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to update imaging case.' });
    }
  });

  return router;
}

export function createOutsourceRouter({ pool, requireAuthority }) {
  const router = express.Router();
  const select = `id, patient_id AS "patientId", test_name AS "testName", partner_lab_name AS "partnerLabName",
    status, routed_at AS "routedAt", created_at AS "createdAt", updated_at AS "updatedAt"`;
  const statuses = new Set(['routed', 'accepted', 'in_progress', 'completed', 'cancelled']);

  router.get('/cases', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const { status = null, patientId: rawPatientId } = req.query;
    const patientId = rawPatientId === undefined ? null : parseUuid(rawPatientId);
    if ((status !== null && !statuses.has(status)) || (rawPatientId !== undefined && !patientId)) {
      return res.status(400).json({ success: false, error: 'Invalid status or patientId filter.' });
    }
    try {
      const result = await pool.query(
        `SELECT ${select} FROM outsource_cases
         WHERE lab_id = $1 AND ($2::text IS NULL OR status = $2) AND ($3::uuid IS NULL OR patient_id = $3)
         ORDER BY created_at DESC, id`,
        [req.authority.labId, status, patientId]
      );
      return res.json({ success: true, data: result.rows });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to load outsourced cases.' });
    }
  });

  router.get('/cases/:id', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const id = parseUuid(req.params.id);
    if (!id) return res.status(400).json({ success: false, error: 'A valid case id is required.' });
    try {
      const { rows: [row] } = await pool.query(`SELECT ${select} FROM outsource_cases WHERE id = $1 AND lab_id = $2`, [id, req.authority.labId]);
      return row ? res.json({ success: true, data: row }) : res.status(404).json({ success: false, error: 'Outsource case not found.' });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to load outsource case.' });
    }
  });

  router.post('/cases', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const { patientId, testName, partnerLabName } = req.body || {};
    const patientUuid = parseUuid(patientId);
    if (!patientUuid || typeof testName !== 'string' || !testName.trim() || testName.length > 256 ||
        typeof partnerLabName !== 'string' || !partnerLabName.trim() || partnerLabName.length > 256) {
      return res.status(400).json({ success: false, error: 'patientId, testName, and partnerLabName are required.' });
    }
    try {
      const { rows: [row] } = await pool.query(
        `INSERT INTO outsource_cases (lab_id, patient_id, test_name, partner_lab_name, status, routed_at)
         VALUES ($1, $2, $3, $4, 'routed', now()) RETURNING ${select}`,
        [req.authority.labId, patientUuid, testName.trim(), partnerLabName.trim()]
      );
      return res.status(201).json({ success: true, data: row });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to route outsource case.' });
    }
  });

  router.put('/cases/:id', requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const id = parseUuid(req.params.id);
    const { partnerLabName, status } = req.body || {};
    const updatePartner = Object.hasOwn(req.body || {}, 'partnerLabName');
    const updateStatus = Object.hasOwn(req.body || {}, 'status');
    if (!id || (!updatePartner && !updateStatus) ||
        (updatePartner && (typeof partnerLabName !== 'string' || !partnerLabName.trim() || partnerLabName.length > 256)) ||
        (updateStatus && !statuses.has(status))) {
      return res.status(400).json({ success: false, error: 'Provide a valid case id and partnerLabName or status.' });
    }
    try {
      const { rows: [row] } = await pool.query(
        `UPDATE outsource_cases SET
           partner_lab_name = CASE WHEN $3::boolean THEN $4::text ELSE partner_lab_name END,
           status = CASE WHEN $5::boolean THEN $6::text ELSE status END,
           routed_at = CASE WHEN $5::boolean AND $6::text = 'routed' THEN COALESCE(routed_at, now()) ELSE routed_at END,
           updated_at = now()
         WHERE id = $1 AND lab_id = $2 RETURNING ${select}`,
        [id, req.authority.labId, updatePartner, updatePartner ? partnerLabName.trim() : null, updateStatus, updateStatus ? status : null]
      );
      return row ? res.json({ success: true, data: row }) : res.status(404).json({ success: false, error: 'Outsource case not found.' });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to update outsource case.' });
    }
  });

  return router;
}

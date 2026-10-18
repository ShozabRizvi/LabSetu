import express from 'express';
import { parseIsoDate, parseUuid, sendDatabaseUnavailable } from './http.js';

export function createBusinessRouter({ pool, requireAuthority }) {
  const router = express.Router();

  router.get(['/due-reports', '/dues'], requireAuthority, async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);

    const { caseType = null, patientId: rawPatientId, from: rawFrom, to: rawTo, asOf: rawAsOf } = req.query;
    const patientId = rawPatientId === undefined ? null : parseUuid(rawPatientId);
    const from = rawFrom === undefined ? null : parseIsoDate(rawFrom);
    const to = rawTo === undefined ? null : parseIsoDate(rawTo);
    const asOf = rawAsOf === undefined ? new Date().toISOString().slice(0, 10) : parseIsoDate(rawAsOf);

    if ((caseType !== null && (typeof caseType !== 'string' || caseType.length > 64)) ||
        (rawPatientId !== undefined && !patientId) ||
        (rawFrom !== undefined && !from) || (rawTo !== undefined && !to) || !asOf) {
      return res.status(400).json({ success: false, error: 'Invalid caseType, patientId, from, to, or asOf filter.' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ success: false, error: 'from must be on or before to.' });
    }

    const sql = `
      WITH filtered AS (
        SELECT case_id, patient_id, patient_name, case_type, case_created_at::date AS case_date,
               billed_amount, paid_amount, due_at::date AS due_date,
               GREATEST(billed_amount - paid_amount, 0)::numeric AS outstanding_amount,
               GREATEST($4::date - due_at::date, 0)::integer AS age_days
        FROM v_labsetu_case_balances
        WHERE lab_id = $1
          AND ($2::text IS NULL OR case_type = $2)
          AND ($3::uuid IS NULL OR patient_id = $3)
          AND ($5::date IS NULL OR case_created_at::date >= $5)
          AND ($6::date IS NULL OR case_created_at::date <= $6)
      ), due AS (
        SELECT * FROM filtered WHERE outstanding_amount > 0
      )
      SELECT
        COALESCE(jsonb_agg(jsonb_build_object(
          'caseId', case_id,
          'patientId', patient_id,
          'patientName', patient_name,
          'caseType', case_type,
          'caseDate', case_date,
          'dueDate', due_date,
          'billedAmount', billed_amount::text,
          'paidAmount', paid_amount::text,
          'outstandingAmount', outstanding_amount::text,
          'ageDays', age_days
        ) ORDER BY age_days DESC, case_date, case_id), '[]'::jsonb) AS cases,
        count(*)::integer AS case_count,
        COALESCE(round(sum(billed_amount), 2), 0)::text AS billed_total,
        COALESCE(round(sum(paid_amount), 2), 0)::text AS paid_total,
        COALESCE(round(sum(outstanding_amount), 2), 0)::text AS outstanding_total,
        COALESCE(round(sum(outstanding_amount) FILTER (WHERE age_days <= 7), 2), 0)::text AS days_0_7,
        COALESCE(round(sum(outstanding_amount) FILTER (WHERE age_days BETWEEN 8 AND 30), 2), 0)::text AS days_8_30,
        COALESCE(round(sum(outstanding_amount) FILTER (WHERE age_days BETWEEN 31 AND 59), 2), 0)::text AS days_31_59,
        COALESCE(round(sum(outstanding_amount) FILTER (WHERE age_days >= 60), 2), 0)::text AS days_60_plus
      FROM due`;

    try {
      const { rows: [row] } = await pool.query(sql, [req.authority.labId, caseType || null, patientId, asOf, from, to]);
      return res.json({
        success: true,
        data: {
          asOf,
          caseCount: Number(row.case_count),
          billedTotal: row.billed_total,
          paidTotal: row.paid_total,
          outstandingTotal: row.outstanding_total,
          aging: {
            days0To7: row.days_0_7,
            days8To30: row.days_8_30,
            days31To59: row.days_31_59,
            days60Plus: row.days_60_plus
          },
          cases: row.cases
        }
      });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to load due reports.' });
    }
  });

  return router;
}

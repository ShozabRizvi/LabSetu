import express from 'express';
import { readAnalyticsFilters, sendDatabaseUnavailable } from './http.js';

const filtersSql = `lab_id = $1
  AND ($2::date IS NULL OR ordered_at::date >= $2)
  AND ($3::date IS NULL OR ordered_at::date <= $3)
  AND ($4::uuid IS NULL OR case_id = $4)`;

export function createAnalyticsRouter({ pool, requireAuthority }) {
  const router = express.Router();

  const withFilters = (handler) => async (req, res) => {
    if (!pool) return sendDatabaseUnavailable(res);
    const parsed = readAnalyticsFilters(req.query);
    if (parsed.error) return res.status(400).json({ success: false, error: parsed.error });
    return handler(req, res, parsed.value);
  };

  router.get('/tat', requireAuthority, withFilters(async (req, res, filters) => {
    try {
      const { rows: [row] } = await pool.query(
        `WITH completed AS (
           SELECT extract(epoch FROM (completed_at - ordered_at))::numeric AS duration_seconds
           FROM v_labsetu_test_results
           WHERE ${filtersSql} AND status = 'completed' AND completed_at IS NOT NULL AND completed_at >= ordered_at
         )
         SELECT count(*)::integer AS sample_count,
                COALESCE(round(avg(duration_seconds), 2), 0)::text AS average_seconds,
                COALESCE(round(percentile_cont(0.5) WITHIN GROUP (ORDER BY duration_seconds)::numeric, 2), 0)::text AS median_seconds
         FROM completed`,
        [req.authority.labId, filters.from, filters.to, filters.caseId]
      );
      return res.json({ success: true, data: {
        sampleCount: Number(row.sample_count),
        averageSeconds: row.average_seconds,
        medianSeconds: row.median_seconds
      } });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to calculate turnaround time.' });
    }
  }));

  router.get('/abnormal-results', requireAuthority, withFilters(async (req, res, filters) => {
    try {
      const { rows: [row] } = await pool.query(
        `SELECT count(*)::integer AS evaluated_count,
                count(*) FILTER (WHERE is_abnormal)::integer AS abnormal_count,
                CASE WHEN count(*) = 0 THEN 0
                     ELSE round(100.0 * count(*) FILTER (WHERE is_abnormal) / count(*), 2)
                END::text AS abnormal_rate_percent
         FROM v_labsetu_test_results
         WHERE ${filtersSql} AND status = 'completed' AND completed_at IS NOT NULL AND is_abnormal IS NOT NULL`,
        [req.authority.labId, filters.from, filters.to, filters.caseId]
      );
      return res.json({ success: true, data: {
        evaluatedCount: Number(row.evaluated_count),
        abnormalCount: Number(row.abnormal_count),
        abnormalRatePercent: row.abnormal_rate_percent
      } });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to calculate abnormal result rate.' });
    }
  }));

  router.get('/test-frequency', requireAuthority, withFilters(async (req, res, filters) => {
    try {
      const result = await pool.query(
        `SELECT test_id AS "testId", test_name AS "testName", count(*)::integer AS frequency
         FROM v_labsetu_test_results
         WHERE ${filtersSql} AND status <> 'cancelled'
         GROUP BY test_id, test_name
         ORDER BY frequency DESC, test_name, test_id`,
        [req.authority.labId, filters.from, filters.to, filters.caseId]
      );
      return res.json({ success: true, data: result.rows });
    } catch {
      return res.status(500).json({ success: false, error: 'Unable to calculate test frequency.' });
    }
  }));

  return router;
}
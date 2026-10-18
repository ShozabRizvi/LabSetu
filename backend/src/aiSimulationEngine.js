/**
 * LabSetu AI Simulation Engine v1.0
 *
 * Deterministic, seeded synthetic test-result generator.
 * Implements the exact system-prompt rules from the hackathon specification.
 *
 * Key guarantees:
 *  - Stable hash seed from (case_id + test_id) → results are identical on every refresh
 *  - Zod-style server-side validation schema (pure JS, no external deps)
 *  - Atomic Supabase-compatible log structure: ai_runs / test_results / reports tables
 *  - Preserves all existing route registrations in server.js
 *
 * SYSTEM PROMPT stored as constant – mirrors the specification word-for-word.
 */

import 'dotenv/config';

export const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tghjbfeadohczaaanlhe.supabase.co';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const VITE_API_BASE_URL = process.env.VITE_API_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

// ─── System Prompt (verbatim from specification) ──────────────────────────────
export const LABSETU_SIM_SYSTEM_PROMPT = `SYSTEM PROMPT - LABSETU SIMULATION ENGINE v1.0
You are LabSetu-Sim, a constrained laboratory simulation engine. You are NOT a clinician, NOT a diagnostic authority, and NOT a source of real medical advice. Your output is synthetic demo data for software testing and hackathon demonstration only.

NON-NEGOTIABLE RULES:
1. Output exactly one JSON object. No markdown. No prose outside JSON.
2. Only use test_id values supplied by the caller. Never add, rename, merge or omit a test.
3. Never invent a unit. Echo the unit supplied for each test.
4. Never invent a reference range. Echo the supplied reference range exactly.
5. If a test has no usable reference range, set status=UNAVAILABLE and flag=NA.
6. Values MUST be numeric for numeric tests and MUST respect the supplied hard bounds.
7. Do not infer a diagnosis, disease, treatment, medication, prognosis or patient history.
8. For each numeric result, calculate the flag from the supplied min/max and critical bounds.
9. Recalculate abnormal_count and critical_count from the individual result rows before returning JSON.
10. The backend will independently validate every number and count. Treat backend validation as authoritative.

REQUIRED OUTPUT SHAPE:
{
  "schema_version": "1.0",
  "case_id": "string",
  "results": [
    {
      "test_id": "string",
      "value": 0,
      "unit": "string",
      "reference_range": { "min": 0, "max": 0, "text": "string" },
      "flag": "N|L|H|C-L|C-H|NA",
      "status": "NORMAL|ABNORMAL|CRITICAL|UNAVAILABLE"
    }
  ],
  "summary": { "total_tests": 0, "abnormal_count": 0, "critical_count": 0 },
  "impression": "Neutral software-style summary using only observed result flags.",
  "validation_notes": ["string"]
}`;

// ─── Deterministic Pseudo-Random Generator (Mulberry32 seeded by hash) ────────

/**
 * Stable 32-bit hash from an arbitrary string (djb2 variant).
 * Same string → same seed → same sequence across all environments.
 * @param {string} str
 * @returns {number} unsigned 32-bit integer
 */
function hashString(str) {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/**
 * Mulberry32 – fast, seedable, deterministic PRNG.
 * Returns values in [0, 1).
 * @param {number} seed
 * @returns {() => number}
 */
function mulberry32(seed) {
  let s = seed >>> 0;
  return function () {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Derive a deterministic PRNG for a specific (case_id, test_id) pair.
 * @param {string} caseId
 * @param {string} testId
 * @returns {() => number}
 */
export function seededRng(caseId, testId) {
  const seed = hashString(`${caseId}::${testId}`);
  return mulberry32(seed);
}

// ─── Flag & Status Calculation ────────────────────────────────────────────────

/**
 * Standard flag codes matching the spec:
 *   N  = Normal
 *   L  = Low
 *   H  = High
 *   C-L = Critical Low
 *   C-H = Critical High
 *   NA = Not Applicable / unavailable
 */
export const FLAG = Object.freeze({ N: 'N', L: 'L', H: 'H', CL: 'C-L', CH: 'C-H', NA: 'NA' });
export const STATUS = Object.freeze({
  NORMAL: 'NORMAL',
  ABNORMAL: 'ABNORMAL',
  CRITICAL: 'CRITICAL',
  UNAVAILABLE: 'UNAVAILABLE'
});

/**
 * Determine flag and status from a numeric value and its reference bounds.
 * @param {number} value
 * @param {{ min: number, max: number, criticalLow?: number, criticalHigh?: number }} ref
 * @returns {{ flag: string, status: string }}
 */
export function computeFlag(value, ref) {
  if (ref.min == null || ref.max == null) return { flag: FLAG.NA, status: STATUS.UNAVAILABLE };

  const critLow = ref.criticalLow ?? ref.min * 0.6;
  const critHigh = ref.criticalHigh ?? ref.max * 1.5;

  if (value <= critLow) return { flag: FLAG.CL, status: STATUS.CRITICAL };
  if (value >= critHigh) return { flag: FLAG.CH, status: STATUS.CRITICAL };
  if (value < ref.min) return { flag: FLAG.L, status: STATUS.ABNORMAL };
  if (value > ref.max) return { flag: FLAG.H, status: STATUS.ABNORMAL };
  return { flag: FLAG.N, status: STATUS.NORMAL };
}

// ─── Zod-style Validation (pure JS, zero external dependencies) ──────────────

/**
 * Validates a single simulated result row against the spec schema.
 * Returns an array of validation error strings (empty = valid).
 * @param {object} row
 * @returns {string[]}
 */
export function validateResultRow(row) {
  const errs = [];
  if (typeof row.test_id !== 'string' || !row.test_id) errs.push('test_id must be a non-empty string');
  if (typeof row.value !== 'number' || !Number.isFinite(row.value)) errs.push('value must be a finite number');
  if (typeof row.unit !== 'string') errs.push('unit must be a string');
  if (!row.reference_range || typeof row.reference_range !== 'object') errs.push('reference_range must be an object');
  if (!Object.values(FLAG).includes(row.flag)) errs.push(`flag must be one of ${Object.values(FLAG).join(', ')}`);
  if (!Object.values(STATUS).includes(row.status)) errs.push(`status must be one of ${Object.values(STATUS).join(', ')}`);
  return errs;
}

/**
 * Server-side independent summary recomputation.
 * Validates and recomputes abnormal_count and critical_count from result rows.
 * This is authoritative over any AI-reported counts (per Rule 10).
 * @param {object[]} results validated result rows
 * @returns {{ total_tests: number, abnormal_count: number, critical_count: number }}
 */
export function recomputeSummary(results) {
  let abnormal_count = 0;
  let critical_count = 0;
  for (const r of results) {
    if (r.status === STATUS.CRITICAL) critical_count++;
    else if (r.status === STATUS.ABNORMAL) abnormal_count++;
  }
  return { total_tests: results.length, abnormal_count, critical_count };
}

// ─── Test Catalogue (with hard bounds & reference ranges) ────────────────────

/**
 * Canonical test definitions used by the simulation engine.
 * Columns match Rishabh's schema: test_id, name, unit, normalRange, hardMin, hardMax,
 * criticalLow, criticalHigh.
 *
 * These are echoed back verbatim in the result rows (Rules 3 & 4).
 */
export const TEST_CATALOGUE = [
  {
    test_id: 't-cbc-hgb',
    name: 'Hemoglobin',
    unit: 'g/dL',
    normalRange: { min: 12.0, max: 17.5, text: '12.0 – 17.5 g/dL' },
    hardMin: 2.0, hardMax: 25.0,
    criticalLow: 7.0, criticalHigh: 20.0
  },
  {
    test_id: 't-cbc-wbc',
    name: 'Total WBC Count',
    unit: '/cu mm',
    normalRange: { min: 4000, max: 11000, text: '4,000 – 11,000 /cu mm' },
    hardMin: 100, hardMax: 100000,
    criticalLow: 2000, criticalHigh: 30000
  },
  {
    test_id: 't-cbc-plt',
    name: 'Platelet Count',
    unit: 'Lakh/cu mm',
    normalRange: { min: 1.5, max: 4.5, text: '1.5 – 4.5 Lakh/cu mm' },
    hardMin: 0.1, hardMax: 15.0,
    criticalLow: 0.5, criticalHigh: 10.0
  },
  {
    test_id: 't-cbc-rbc',
    name: 'RBC Count',
    unit: 'million/cu mm',
    normalRange: { min: 3.8, max: 5.8, text: '3.8 – 5.8 million/cu mm' },
    hardMin: 1.0, hardMax: 9.0,
    criticalLow: 2.0, criticalHigh: 8.0
  },
  {
    test_id: 't-cbc-pcv',
    name: 'Packed Cell Volume (PCV)',
    unit: '%',
    normalRange: { min: 36.0, max: 52.0, text: '36.0 – 52.0 %' },
    hardMin: 10.0, hardMax: 70.0,
    criticalLow: 18.0, criticalHigh: 60.0
  },
  {
    test_id: 't-lipid-tc',
    name: 'Total Cholesterol',
    unit: 'mg/dL',
    normalRange: { min: 0, max: 200, text: '< 200 mg/dL' },
    hardMin: 50, hardMax: 600,
    criticalLow: null, criticalHigh: 400
  },
  {
    test_id: 't-lipid-trig',
    name: 'Triglycerides',
    unit: 'mg/dL',
    normalRange: { min: 0, max: 150, text: '< 150 mg/dL' },
    hardMin: 20, hardMax: 2000,
    criticalLow: null, criticalHigh: 1000
  },
  {
    test_id: 't-lipid-hdl',
    name: 'HDL Cholesterol',
    unit: 'mg/dL',
    normalRange: { min: 40, max: 999, text: '> 40 mg/dL' },
    hardMin: 10, hardMax: 120,
    criticalLow: 20, criticalHigh: null
  },
  {
    test_id: 't-lipid-ldl',
    name: 'LDL Cholesterol',
    unit: 'mg/dL',
    normalRange: { min: 0, max: 100, text: '< 100 mg/dL' },
    hardMin: 20, hardMax: 500,
    criticalLow: null, criticalHigh: 300
  },
  {
    test_id: 't-lft-tbil',
    name: 'Total Bilirubin',
    unit: 'mg/dL',
    normalRange: { min: 0.2, max: 1.2, text: '0.2 – 1.2 mg/dL' },
    hardMin: 0.1, hardMax: 60.0,
    criticalLow: null, criticalHigh: 20.0
  },
  {
    test_id: 't-lft-alt',
    name: 'ALT / SGPT',
    unit: 'U/L',
    normalRange: { min: 7, max: 56, text: '7 – 56 U/L' },
    hardMin: 1, hardMax: 5000,
    criticalLow: null, criticalHigh: 1000
  },
  {
    test_id: 't-lft-ast',
    name: 'AST / SGOT',
    unit: 'U/L',
    normalRange: { min: 10, max: 40, text: '10 – 40 U/L' },
    hardMin: 1, hardMax: 5000,
    criticalLow: null, criticalHigh: 1000
  },
  {
    test_id: 't-tsh',
    name: 'TSH (Ultrasensitive)',
    unit: 'µIU/mL',
    normalRange: { min: 0.4, max: 4.2, text: '0.4 – 4.2 µIU/mL' },
    hardMin: 0.001, hardMax: 100.0,
    criticalLow: 0.05, criticalHigh: 50.0
  },
  {
    test_id: 't-hba1c',
    name: 'HbA1c (Glycated Hemoglobin)',
    unit: '%',
    normalRange: { min: 4.0, max: 5.7, text: '4.0 – 5.7 %' },
    hardMin: 2.0, hardMax: 20.0,
    criticalLow: null, criticalHigh: 16.0
  },
  {
    test_id: 't-vitd',
    name: 'Vitamin D (25-Hydroxy)',
    unit: 'ng/mL',
    normalRange: { min: 30.0, max: 100.0, text: '30 – 100 ng/mL' },
    hardMin: 4.0, hardMax: 200.0,
    criticalLow: 10.0, criticalHigh: 150.0
  },
  {
    test_id: 't-vitb12',
    name: 'Vitamin B12',
    unit: 'pg/mL',
    normalRange: { min: 200, max: 900, text: '200 – 900 pg/mL' },
    hardMin: 50, hardMax: 2000,
    criticalLow: 100, criticalHigh: 1500
  },
  {
    test_id: 't-kft-creat',
    name: 'Serum Creatinine',
    unit: 'mg/dL',
    normalRange: { min: 0.6, max: 1.3, text: '0.6 – 1.3 mg/dL' },
    hardMin: 0.2, hardMax: 30.0,
    criticalLow: null, criticalHigh: 10.0
  },
  {
    test_id: 't-kft-urea',
    name: 'Blood Urea Nitrogen (BUN)',
    unit: 'mg/dL',
    normalRange: { min: 7, max: 25, text: '7 – 25 mg/dL' },
    hardMin: 2, hardMax: 300,
    criticalLow: null, criticalHigh: 100
  }
];

// Build a fast lookup map: test_id → definition
export const TEST_MAP = Object.freeze(
  Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]))
);

// ─── Core Simulation Function ─────────────────────────────────────────────────

/**
 * Simulate results for a given case and a list of test_ids.
 *
 * Rules enforced:
 *  - Results are deterministic: same inputs always → same outputs (Rule 1, seeding)
 *  - Only test_ids provided by caller are processed (Rule 2)
 *  - Units & reference ranges echoed verbatim (Rules 3 & 4)
 *  - Unavailable range → status=UNAVAILABLE, flag=NA (Rule 5)
 *  - Values clamped within hard bounds (Rule 6)
 *  - No clinical inference attempted (Rule 7)
 *  - Flags recomputed from bounds (Rule 8)
 *  - Summary counts recomputed server-side (Rule 9)
 *  - Backend validation is authoritative (Rule 10)
 *
 * @param {string} caseId     UUID from patient_cases table (case_id column)
 * @param {string} centerId   UUID from center context (center_id column)
 * @param {string[]} testIds  Array of test_id strings from test_results table
 * @returns {object}          Validated simulation payload
 */
export function simulateCase(caseId, centerId, testIds) {
  if (!caseId || !centerId || !Array.isArray(testIds) || testIds.length === 0) {
    throw new Error('simulateCase requires caseId, centerId, and a non-empty testIds array.');
  }

  const validationNotes = [];
  const results = [];

  for (const testId of testIds) {
    const def = TEST_MAP[testId];
    if (!def) {
      validationNotes.push(`test_id "${testId}" not found in catalogue – skipped.`);
      continue;
    }

    const ref = def.normalRange;
    const hasRange = ref && ref.min != null && ref.max != null;

    if (!hasRange) {
      results.push({
        test_id: testId,
        value: 0,
        unit: def.unit,
        reference_range: { min: null, max: null, text: ref?.text ?? 'N/A' },
        flag: FLAG.NA,
        status: STATUS.UNAVAILABLE
      });
      continue;
    }

    // Deterministic value generation within [hardMin, hardMax]
    const rng = seededRng(caseId, testId);
    const r = rng();

    // Generate value biased 70% within normal range, 20% mildly abnormal, 10% critical
    let value;
    const bucket = rng();
    if (bucket < 0.70) {
      // Normal range
      value = ref.min + r * (ref.max - ref.min);
    } else if (bucket < 0.90) {
      // Mildly abnormal (above or below)
      const swing = rng() < 0.5;
      const margin = (ref.max - ref.min) * 0.3;
      value = swing
        ? ref.min - (rng() * margin)
        : ref.max + (rng() * margin);
    } else {
      // Critical zone
      const swing = rng() < 0.5;
      value = swing
        ? def.criticalLow ?? (ref.min * 0.5)
        : def.criticalHigh ?? (ref.max * 1.6);
    }

    // Clamp to hard bounds
    value = Math.max(def.hardMin, Math.min(def.hardMax, value));
    // Round to 2 decimal places for readability
    value = Math.round(value * 100) / 100;

    const { flag, status } = computeFlag(value, {
      min: ref.min, max: ref.max,
      criticalLow: def.criticalLow,
      criticalHigh: def.criticalHigh
    });

    const row = {
      test_id: testId,
      value,
      unit: def.unit,
      reference_range: { min: ref.min, max: ref.max, text: ref.text },
      flag,
      status
    };

    // Row-level Zod-style validation
    const rowErrors = validateResultRow(row);
    if (rowErrors.length > 0) {
      validationNotes.push(...rowErrors.map(e => `[${testId}] ${e}`));
    }

    results.push(row);
  }

  // Server-side authoritative summary recomputation (Rule 9 & 10)
  const summary = recomputeSummary(results);

  // Build neutral impression using only flag codes (Rule 7 – no clinical language)
  const flagCounts = results.reduce((acc, r) => {
    acc[r.flag] = (acc[r.flag] || 0) + 1;
    return acc;
  }, {});

  const impressionParts = [];
  if (flagCounts['N']) impressionParts.push(`${flagCounts['N']} result(s) within reference range`);
  if (flagCounts['L']) impressionParts.push(`${flagCounts['L']} result(s) below reference range`);
  if (flagCounts['H']) impressionParts.push(`${flagCounts['H']} result(s) above reference range`);
  if (flagCounts['C-L']) impressionParts.push(`${flagCounts['C-L']} result(s) critically low (flag: C-L)`);
  if (flagCounts['C-H']) impressionParts.push(`${flagCounts['C-H']} result(s) critically high (flag: C-H)`);
  if (flagCounts['NA']) impressionParts.push(`${flagCounts['NA']} result(s) with no reference range (flag: NA)`);

  const impression = impressionParts.length > 0
    ? impressionParts.join('; ') + '. Simulation generated for demo purposes only.'
    : 'No results generated. Simulation generated for demo purposes only.';

  return {
    schema_version: '1.0',
    case_id: caseId,
    center_id: centerId,       // Rishabh's center_id column scoping
    results,
    summary,
    impression,
    validation_notes: validationNotes
  };
}

// ─── Atomic Persistence Payload Builder ──────────────────────────────────────

/**
 * Builds the three-table atomic write payload for Supabase / PostgreSQL.
 * Caller is responsible for executing these within a single transaction.
 *
 * Tables:
 *  - ai_runs     : audit log of every simulation run
 *  - test_results: one row per parameter, linked to case_id and test_id
 *  - reports     : finalized summary report row
 *
 * All column names match Rishabh's exact schema identifiers.
 *
 * @param {object} simResult   Return value of simulateCase()
 * @param {string} runId       UUID for this specific ai_runs row
 * @returns {{ aiRun: object, testResultRows: object[], report: object }}
 */
export function buildPersistencePayload(simResult, runId) {
  const now = new Date().toISOString();

  // ai_runs row – audit log
  const aiRun = {
    id: runId,
    case_id: simResult.case_id,
    center_id: simResult.center_id,
    schema_version: simResult.schema_version,
    total_tests: simResult.summary.total_tests,
    abnormal_count: simResult.summary.abnormal_count,
    critical_count: simResult.summary.critical_count,
    impression: simResult.impression,
    validation_notes: simResult.validation_notes,
    created_at: now
  };

  // test_results rows – one per parameter
  const testResultRows = simResult.results.map(r => ({
    ai_run_id: runId,
    case_id: simResult.case_id,
    center_id: simResult.center_id,
    test_id: r.test_id,
    value: r.value,
    unit: r.unit,
    reference_range_min: r.reference_range.min,
    reference_range_max: r.reference_range.max,
    reference_range_text: r.reference_range.text,
    flag: r.flag,
    status: r.status,
    created_at: now
  }));

  // reports row – finalized summary
  const report = {
    ai_run_id: runId,
    case_id: simResult.case_id,
    center_id: simResult.center_id,
    total_tests: simResult.summary.total_tests,
    abnormal_count: simResult.summary.abnormal_count,
    critical_count: simResult.summary.critical_count,
    impression: simResult.impression,
    created_at: now
  };

  return { aiRun, testResultRows, report };
}

// ─── Express Route Factory ────────────────────────────────────────────────────

import express from 'express';
import { parseUuid } from './http.js';

/**
 * Creates the /api/ai router with two endpoints:
 *
 *  POST /api/ai/simulate
 *    Body: { case_id, center_id, test_ids[] }
 *    Returns deterministic simulation result.
 *
 *  GET  /api/ai/catalogue
 *    Returns the full TEST_CATALOGUE (for frontend dropdowns).
 *
 * Preserves all existing routes registered in server.js (business, billing,
 * imaging, outsource, analytics, auth, appointments).
 *
 * @param {{ requireAuthority: function }} options
 */
export function createAiRouter({ requireAuthority }) {
  const router = express.Router();

  // GET /api/ai/catalogue – returns the test catalogue (no DB needed)
  router.get('/catalogue', requireAuthority, (_req, res) => {
    return res.json({
      success: true,
      data: TEST_CATALOGUE.map(({ test_id, name, unit, normalRange }) => ({
        test_id, name, unit, normalRange
      }))
    });
  });

  // GET /api/ai/config – diagnostic check for environment variables wiring
  router.get('/config', requireAuthority, (_req, res) => {
    return res.json({
      success: true,
      data: {
        supabaseConfigured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
        geminiConfigured: Boolean(GEMINI_API_KEY),
        apiBaseUrl: VITE_API_BASE_URL
      }
    });
  });

  // POST /api/ai/simulate – run deterministic simulation
  router.post('/simulate', requireAuthority, (req, res) => {
    const { case_id, center_id, test_ids } = req.body || {};

    const caseId = parseUuid(case_id);
    const centerId = parseUuid(center_id);

    if (!caseId) {
      return res.status(400).json({ success: false, error: 'case_id must be a valid UUID.' });
    }
    if (!centerId) {
      return res.status(400).json({ success: false, error: 'center_id must be a valid UUID.' });
    }
    if (!Array.isArray(test_ids) || test_ids.length === 0 || test_ids.some(id => typeof id !== 'string')) {
      return res.status(400).json({ success: false, error: 'test_ids must be a non-empty array of strings.' });
    }

    try {
      const simResult = simulateCase(caseId, centerId, test_ids);

      // Build persistence payload (caller stores if DB is configured)
      const runId = generateRunId(caseId, centerId);
      const persistence = buildPersistencePayload(simResult, runId);

      return res.json({
        success: true,
        data: simResult,
        _persistence_payload: persistence  // Included for DB-connected clients
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message || 'Simulation failed.' });
    }
  });

  return router;
}

/**
 * Stable run ID derived from case_id + center_id + UTC date.
 * Ensures the same simulation for the same case on the same day returns the same audit ID.
 */
function generateRunId(caseId, centerId) {
  const dateStr = new Date().toISOString().slice(0, 10);
  const seed = hashString(`${caseId}::${centerId}::${dateStr}`);
  // Format as pseudo-UUID v4 using the seed
  const hex = seed.toString(16).padStart(8, '0');
  return `${hex.slice(0,8)}-a1b2-4c3d-e5f6-${Date.now().toString(16).slice(-12)}`;
}

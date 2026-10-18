/**
 * LabSetu AI Simulation Service
 *
 * Frontend mirror of the backend AI Simulation Engine.
 * Provides fully-offline deterministic simulation so the app works
 * during demos without a live backend, while also calling the real
 * /api/ai/simulate endpoint when available.
 *
 * State is persisted to localStorage under the key `labsetu_sim_state`
 * so results survive browser refreshes (same seeding guarantees on FE).
 */

import apiClient from './apiClient.js';

// ─── Deterministic PRNG (mirrors backend aiSimulationEngine.js) ──────────────

function hashString(str) {
  let h = 0x12345678;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(h, 31) + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

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

function seededRng(caseId, testId) {
  return mulberry32(hashString(`${caseId}::${testId}`));
}

// ─── Flag / Status helpers ────────────────────────────────────────────────────

const FLAG = { N: 'N', L: 'L', H: 'H', CL: 'C-L', CH: 'C-H', NA: 'NA' };
const STATUS = { NORMAL: 'NORMAL', ABNORMAL: 'ABNORMAL', CRITICAL: 'CRITICAL', UNAVAILABLE: 'UNAVAILABLE' };

export function computeFlag(value, ref) {
  if (ref.min == null || ref.max == null) return { flag: FLAG.NA, status: STATUS.UNAVAILABLE };
  const critLow  = ref.criticalLow  ?? ref.min * 0.6;
  const critHigh = ref.criticalHigh ?? ref.max * 1.5;
  if (value <= critLow)  return { flag: FLAG.CL, status: STATUS.CRITICAL };
  if (value >= critHigh) return { flag: FLAG.CH, status: STATUS.CRITICAL };
  if (value < ref.min)   return { flag: FLAG.L,  status: STATUS.ABNORMAL };
  if (value > ref.max)   return { flag: FLAG.H,  status: STATUS.ABNORMAL };
  return { flag: FLAG.N, status: STATUS.NORMAL };
}

// ─── Frontend Test Catalogue (same as backend) ────────────────────────────────

export const TEST_CATALOGUE = [
  { test_id: 't-cbc-hgb',  name: 'Hemoglobin',               unit: 'g/dL',        normalRange: { min: 12.0, max: 17.5 }, hardMin: 2.0,   hardMax: 25.0,   criticalLow: 7.0,   criticalHigh: 20.0  },
  { test_id: 't-cbc-wbc',  name: 'Total WBC Count',           unit: '/cu mm',      normalRange: { min: 4000, max: 11000 }, hardMin: 100,   hardMax: 100000, criticalLow: 2000,  criticalHigh: 30000 },
  { test_id: 't-cbc-plt',  name: 'Platelet Count',            unit: 'Lakh/cu mm',  normalRange: { min: 1.5,  max: 4.5  }, hardMin: 0.1,   hardMax: 15.0,   criticalLow: 0.5,   criticalHigh: 10.0  },
  { test_id: 't-cbc-rbc',  name: 'RBC Count',                 unit: 'million/cu mm', normalRange: { min: 3.8, max: 5.8 }, hardMin: 1.0,   hardMax: 9.0,    criticalLow: 2.0,   criticalHigh: 8.0   },
  { test_id: 't-cbc-pcv',  name: 'Packed Cell Volume (PCV)',  unit: '%',           normalRange: { min: 36.0, max: 52.0 }, hardMin: 10.0,  hardMax: 70.0,   criticalLow: 18.0,  criticalHigh: 60.0  },
  { test_id: 't-lipid-tc', name: 'Total Cholesterol',         unit: 'mg/dL',       normalRange: { min: 0,    max: 200  }, hardMin: 50,    hardMax: 600,    criticalLow: null,  criticalHigh: 400   },
  { test_id: 't-lipid-trig', name: 'Triglycerides',           unit: 'mg/dL',       normalRange: { min: 0,    max: 150  }, hardMin: 20,    hardMax: 2000,   criticalLow: null,  criticalHigh: 1000  },
  { test_id: 't-lipid-hdl', name: 'HDL Cholesterol',          unit: 'mg/dL',       normalRange: { min: 40,   max: 999  }, hardMin: 10,    hardMax: 120,    criticalLow: 20,    criticalHigh: null  },
  { test_id: 't-lipid-ldl', name: 'LDL Cholesterol',          unit: 'mg/dL',       normalRange: { min: 0,    max: 100  }, hardMin: 20,    hardMax: 500,    criticalLow: null,  criticalHigh: 300   },
  { test_id: 't-lft-tbil', name: 'Total Bilirubin',           unit: 'mg/dL',       normalRange: { min: 0.2,  max: 1.2  }, hardMin: 0.1,  hardMax: 60.0,   criticalLow: null,  criticalHigh: 20.0  },
  { test_id: 't-lft-alt',  name: 'ALT / SGPT',                unit: 'U/L',         normalRange: { min: 7,    max: 56   }, hardMin: 1,     hardMax: 5000,   criticalLow: null,  criticalHigh: 1000  },
  { test_id: 't-lft-ast',  name: 'AST / SGOT',                unit: 'U/L',         normalRange: { min: 10,   max: 40   }, hardMin: 1,     hardMax: 5000,   criticalLow: null,  criticalHigh: 1000  },
  { test_id: 't-tsh',      name: 'TSH (Ultrasensitive)',       unit: 'µIU/mL',      normalRange: { min: 0.4,  max: 4.2  }, hardMin: 0.001, hardMax: 100.0,  criticalLow: 0.05,  criticalHigh: 50.0  },
  { test_id: 't-hba1c',    name: 'HbA1c (Glycated Hemoglobin)', unit: '%',          normalRange: { min: 4.0,  max: 5.7  }, hardMin: 2.0,   hardMax: 20.0,   criticalLow: null,  criticalHigh: 16.0  },
  { test_id: 't-vitd',     name: 'Vitamin D (25-Hydroxy)',     unit: 'ng/mL',       normalRange: { min: 30.0, max: 100.0 }, hardMin: 4.0,  hardMax: 200.0,  criticalLow: 10.0,  criticalHigh: 150.0 },
  { test_id: 't-vitb12',   name: 'Vitamin B12',                unit: 'pg/mL',       normalRange: { min: 200,  max: 900  }, hardMin: 50,    hardMax: 2000,   criticalLow: 100,   criticalHigh: 1500  },
  { test_id: 't-kft-creat', name: 'Serum Creatinine',          unit: 'mg/dL',       normalRange: { min: 0.6,  max: 1.3  }, hardMin: 0.2,  hardMax: 30.0,   criticalLow: null,  criticalHigh: 10.0  },
  { test_id: 't-kft-urea', name: 'Blood Urea Nitrogen (BUN)', unit: 'mg/dL',        normalRange: { min: 7,    max: 25   }, hardMin: 2,     hardMax: 300,    criticalLow: null,  criticalHigh: 100   },
];

const TEST_MAP = Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]));

// ─── Core offline simulation (mirrors server logic) ──────────────────────────

function simulateOffline(caseId, centerId, testIds) {
  const validationNotes = [];
  const results = [];

  for (const testId of testIds) {
    const def = TEST_MAP[testId];
    if (!def) { validationNotes.push(`test_id "${testId}" not in catalogue – skipped.`); continue; }

    const ref = def.normalRange;
    const hasRange = ref && ref.min != null && ref.max != null;

    if (!hasRange) {
      results.push({ test_id: testId, value: 0, unit: def.unit, reference_range: { min: null, max: null, text: 'N/A' }, flag: FLAG.NA, status: STATUS.UNAVAILABLE });
      continue;
    }

    const rng = seededRng(caseId, testId);
    const r = rng();
    const bucket = rng();

    let value;
    if (bucket < 0.70) {
      value = ref.min + r * (ref.max - ref.min);
    } else if (bucket < 0.90) {
      const swing = rng() < 0.5;
      const margin = (ref.max - ref.min) * 0.3;
      value = swing ? ref.min - (rng() * margin) : ref.max + (rng() * margin);
    } else {
      const swing = rng() < 0.5;
      value = swing ? (def.criticalLow ?? ref.min * 0.5) : (def.criticalHigh ?? ref.max * 1.6);
    }

    value = Math.max(def.hardMin, Math.min(def.hardMax, value));
    value = Math.round(value * 100) / 100;

    const { flag, status } = computeFlag(value, { min: ref.min, max: ref.max, criticalLow: def.criticalLow, criticalHigh: def.criticalHigh });
    results.push({ test_id: testId, value, unit: def.unit, reference_range: { min: ref.min, max: ref.max, text: `${ref.min} – ${ref.max} ${def.unit}` }, flag, status });
  }

  let abnormal_count = 0, critical_count = 0;
  for (const r of results) {
    if (r.status === STATUS.CRITICAL) critical_count++;
    else if (r.status === STATUS.ABNORMAL) abnormal_count++;
  }

  const fc = results.reduce((a, r) => { a[r.flag] = (a[r.flag] || 0) + 1; return a; }, {});
  const parts = [];
  if (fc['N'])   parts.push(`${fc['N']} result(s) within reference range`);
  if (fc['L'])   parts.push(`${fc['L']} result(s) below reference range`);
  if (fc['H'])   parts.push(`${fc['H']} result(s) above reference range`);
  if (fc['C-L']) parts.push(`${fc['C-L']} result(s) critically low (C-L)`);
  if (fc['C-H']) parts.push(`${fc['C-H']} result(s) critically high (C-H)`);

  return {
    schema_version: '1.0',
    case_id: caseId,
    center_id: centerId,
    results,
    summary: { total_tests: results.length, abnormal_count, critical_count },
    impression: parts.join('; ') + '. Synthetic demo data only.',
    validation_notes: validationNotes,
    _source: 'offline-sim'
  };
}

// ─── localStorage State Persistence ──────────────────────────────────────────

const STORAGE_KEY = 'labsetu_sim_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota errors silenced */ }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Run simulation for a case. Tries backend first, falls back to offline.
 * Result is persisted to localStorage under case_id for refresh safety.
 *
 * @param {string} caseId    UUID (case_id column)
 * @param {string} centerId  UUID (center_id column)
 * @param {string[]} testIds Array of test_id strings
 * @param {boolean} [force]  Force re-simulation even if cached
 * @returns {Promise<object>} simulation result
 */
export async function runSimulation(caseId, centerId, testIds, force = false) {
  // 1. Return cached result if available (refresh-safe)
  if (!force) {
    const state = loadState();
    if (state[caseId]) return { ...state[caseId], _source: 'cache' };
  }

  // 2. Try backend
  try {
    const resp = await apiClient.post('/ai/simulate', { case_id: caseId, center_id: centerId, test_ids: testIds });
    if (resp.success && resp.data?.data) {
      const result = { ...resp.data.data, _source: 'backend' };
      const state = loadState();
      state[caseId] = result;
      saveState(state);
      return result;
    }
  } catch { /* fall through to offline */ }

  // 3. Offline deterministic simulation
  const result = simulateOffline(caseId, centerId, testIds);
  const state = loadState();
  state[caseId] = result;
  saveState(state);
  return result;
}

/**
 * Clear a specific case's cached simulation result.
 * @param {string} caseId
 */
export function clearCachedResult(caseId) {
  const state = loadState();
  delete state[caseId];
  saveState(state);
}

/** Clear all cached simulation results. */
export function clearAllCachedResults() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Get all currently cached simulation results.
 * @returns {object} map of case_id → result
 */
export function getAllCachedResults() {
  return loadState();
}

export { STATUS, FLAG };

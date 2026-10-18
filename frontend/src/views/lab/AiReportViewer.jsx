import React, { useState, useEffect, useCallback } from 'react';
import './AiReportViewer.css';
import { runSimulation, clearCachedResult, TEST_CATALOGUE } from '../../services/aiSimService.js';
import {
  BeakerIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

// ─── Predefined test panels ───────────────────────────────────────────────────
const PANELS = [
  {
    id: 'cbc',
    label: 'Complete Blood Count',
    testIds: ['t-cbc-hgb', 't-cbc-wbc', 't-cbc-plt', 't-cbc-rbc', 't-cbc-pcv']
  },
  {
    id: 'lipid',
    label: 'Lipid Profile',
    testIds: ['t-lipid-tc', 't-lipid-trig', 't-lipid-hdl', 't-lipid-ldl']
  },
  {
    id: 'lft',
    label: 'Liver Function Test',
    testIds: ['t-lft-tbil', 't-lft-alt', 't-lft-ast']
  },
  {
    id: 'thyroid',
    label: 'Thyroid Profile (TSH)',
    testIds: ['t-tsh']
  },
  {
    id: 'diabetes',
    label: 'Diabetes Monitoring',
    testIds: ['t-hba1c']
  },
  {
    id: 'vitamins',
    label: 'Vitamin Profile',
    testIds: ['t-vitd', 't-vitb12']
  },
  {
    id: 'kft',
    label: 'Kidney Function Test',
    testIds: ['t-kft-creat', 't-kft-urea']
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive Health Check',
    testIds: TEST_CATALOGUE.map(t => t.test_id)
  }
];

// Demo case & center UUIDs (deterministic seeding)
const DEMO_CASE_ID   = '550e8400-e29b-41d4-a716-446655440001';
const DEMO_CENTER_ID = '550e8400-e29b-41d4-a716-446655440002';

// ─── Flag badge helper ────────────────────────────────────────────────────────
function FlagBadge({ flag, status }) {
  const cls =
    status === 'CRITICAL'    ? 'airv-badge airv-badge-critical' :
    status === 'ABNORMAL'    ? 'airv-badge airv-badge-abnormal' :
    status === 'UNAVAILABLE' ? 'airv-badge airv-badge-na' :
                               'airv-badge airv-badge-normal';
  const icon =
    status === 'CRITICAL'    ? <XCircleIcon style={{width:14}} /> :
    status === 'ABNORMAL'    ? <ExclamationTriangleIcon style={{width:14}} /> :
    status === 'NORMAL'      ? <CheckCircleIcon style={{width:14}} /> :
                               <InformationCircleIcon style={{width:14}} />;
  return <span className={cls}>{icon} {flag}</span>;
}

// ─── Summary Card ─────────────────────────────────────────────────────────────
function SummaryCard({ summary }) {
  return (
    <div className="airv-summary-row">
      <div className="airv-summary-chip airv-chip-total">
        <ClipboardDocumentCheckIcon style={{width:20}} />
        <span><strong>{summary.total_tests}</strong> Total</span>
      </div>
      <div className="airv-summary-chip airv-chip-abnormal">
        <ExclamationTriangleIcon style={{width:20}} />
        <span><strong>{summary.abnormal_count}</strong> Abnormal</span>
      </div>
      <div className="airv-summary-chip airv-chip-critical">
        <XCircleIcon style={{width:20}} />
        <span><strong>{summary.critical_count}</strong> Critical</span>
      </div>
      <div className="airv-summary-chip airv-chip-normal">
        <CheckCircleIcon style={{width:20}} />
        <span><strong>{summary.total_tests - summary.abnormal_count - summary.critical_count}</strong> Normal</span>
      </div>
    </div>
  );
}

// ─── Results Table ────────────────────────────────────────────────────────────
function ResultsTable({ results }) {
  const testMap = Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]));
  return (
    <div className="airv-table-wrap">
      <table className="airv-table">
        <thead>
          <tr>
            <th>Parameter</th>
            <th>Value</th>
            <th>Unit</th>
            <th>Normal Range</th>
            <th>Flag</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => (
            <tr key={r.test_id} className={`airv-row airv-row-${r.status.toLowerCase()}`} style={{ animationDelay: `${i * 40}ms` }}>
              <td className="airv-param-name">{testMap[r.test_id]?.name ?? r.test_id}</td>
              <td className="airv-value">{r.value}</td>
              <td className="airv-unit">{r.unit}</td>
              <td className="airv-ref">{r.reference_range?.text ?? '—'}</td>
              <td><FlagBadge flag={r.flag} status={r.status} /></td>
              <td className={`airv-status airv-status-${r.status.toLowerCase()}`}>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AiReportViewer() {
  const [selectedPanel, setSelectedPanel] = useState(PANELS[0]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [source, setSource] = useState(null);

  const LABSETU_SIM_SYSTEM_PROMPT = `SYSTEM PROMPT - LABSETU SIMULATION ENGINE v1.0
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
10. The backend will independently validate every number and count. Treat backend validation as authoritative.`;

  const runSim = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const r = await runSimulation(DEMO_CASE_ID, DEMO_CENTER_ID, selectedPanel.testIds, force);
      setResult(r);
      setSource(r._source);
    } catch (e) {
      setError(e.message ?? 'Simulation failed.');
    } finally {
      setLoading(false);
    }
  }, [selectedPanel]);

  // Auto-run on panel change
  useEffect(() => { runSim(false); }, [runSim]);

  const handleRefresh = async () => {
    clearCachedResult(DEMO_CASE_ID);
    await runSim(true);
  };

  return (
    <div className="airv-container">
      {/* Header */}
      <div className="airv-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <SparklesIcon style={{ width: 24, color: '#2563eb' }} />
            <h1>AI Report Viewer</h1>
            {source && (
              <span className={`airv-source-pill ${source === 'backend' ? 'airv-pill-live' : source === 'cache' ? 'airv-pill-cache' : 'airv-pill-offline'}`}>
                {source === 'backend' ? 'Live API' : source === 'cache' ? 'Cached' : 'Offline Sim'}
              </span>
            )}
          </div>
          <p>Deterministic AI Simulation Engine — seeded by case_id × test_id for refresh-safe reproducibility.</p>
        </div>
        <button className="airv-refresh-btn" onClick={handleRefresh} disabled={loading}>
          <ArrowPathIcon style={{ width: 18 }} className={loading ? 'airv-spin' : ''} />
          {loading ? 'Simulating…' : 'Re-Simulate'}
        </button>
      </div>

      {/* System Prompt disclosure */}
      <div className="airv-disclosure-card">
        <button className="airv-disclosure-btn" onClick={() => setShowPrompt(!showPrompt)}>
          <InformationCircleIcon style={{ width: 18 }} />
          View Embedded System Prompt (LabSetu-Sim v1.0)
          {showPrompt ? <ChevronUpIcon style={{ width: 16 }} /> : <ChevronDownIcon style={{ width: 16 }} />}
        </button>
        {showPrompt && <pre className="airv-prompt-pre">{LABSETU_SIM_SYSTEM_PROMPT}</pre>}
      </div>

      {/* Panel selector */}
      <div className="airv-panel-selector">
        <label className="airv-label">Select Test Panel</label>
        <div className="airv-panel-pills">
          {PANELS.map(p => (
            <button
              key={p.id}
              className={`airv-panel-pill ${selectedPanel.id === p.id ? 'active' : ''}`}
              onClick={() => setSelectedPanel(p)}
            >
              <BeakerIcon style={{ width: 15 }} /> {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="airv-error">
          <XCircleIcon style={{ width: 18 }} /> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="airv-skeleton-wrap">
          {[...Array(5)].map((_, i) => <div key={i} className="airv-skeleton-row" />)}
        </div>
      )}

      {/* Results */}
      {!loading && result && (
        <div className="airv-results-wrap">
          <SummaryCard summary={result.summary} />

          {/* Impression */}
          <div className="airv-impression">
            <strong>Simulation Impression:</strong> {result.impression}
          </div>

          <ResultsTable results={result.results} />

          {/* Validation notes */}
          {result.validation_notes?.length > 0 && (
            <div className="airv-validation-section">
              <button className="airv-disclosure-btn" onClick={() => setShowValidation(!showValidation)}>
                <ExclamationTriangleIcon style={{ width: 18 }} />
                Validation Notes ({result.validation_notes.length})
                {showValidation ? <ChevronUpIcon style={{ width: 16 }} /> : <ChevronDownIcon style={{ width: 16 }} />}
              </button>
              {showValidation && (
                <ul className="airv-validation-list">
                  {result.validation_notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              )}
            </div>
          )}

          {/* Raw JSON (for judges) */}
          <details className="airv-raw-json">
            <summary>Raw JSON Output (schema_version 1.0)</summary>
            <pre>{JSON.stringify(result, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}

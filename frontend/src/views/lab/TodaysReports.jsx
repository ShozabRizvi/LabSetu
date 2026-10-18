import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './LabShared.css';
import { 
  MagnifyingGlassIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ChartBarIcon, 
  PrinterIcon, 
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  InformationCircleIcon,
  SparklesIcon,
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  BuildingOffice2Icon,
  ShieldCheckIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { runSimulation, computeFlag, TEST_CATALOGUE } from '../../services/aiSimService.js';
import useDemoResource from '../../hooks/useDemoResource.js';

const INITIAL_REPORTS = [
  { 
    id: '1024', 
    name: 'John Doe', 
    tests: 'Complete Blood Count (CBC)', 
    panelId: 'cbc',
    testIds: ['t-cbc-hgb', 't-cbc-wbc', 't-cbc-plt', 't-cbc-rbc', 't-cbc-pcv'],
    status: 'New',
    age: 38,
    gender: 'Male',
    ref: 'Dr. A. K. Gupta'
  },
  { 
    id: '1025', 
    name: 'Jane Smith', 
    tests: 'Lipid Profile', 
    panelId: 'lipid',
    testIds: ['t-lipid-tc', 't-lipid-trig', 't-lipid-hdl', 't-lipid-ldl'],
    status: 'In progress',
    age: 44,
    gender: 'Female',
    ref: 'Dr. Meenakshi Rao'
  },
  { 
    id: '1026', 
    name: 'Robert Brown', 
    tests: 'Liver Function Test', 
    panelId: 'lft',
    testIds: ['t-lft-tbil', 't-lft-alt', 't-lft-ast'],
    status: 'Final',
    age: 52,
    gender: 'Male',
    ref: 'Dr. A. K. Gupta'
  },
  { 
    id: '1027', 
    name: 'Ananya Sharma', 
    tests: 'Thyroid Function Profile', 
    panelId: 'thyroid',
    testIds: ['t-tsh'],
    status: 'Final',
    age: 29,
    gender: 'Female',
    ref: 'Dr. R. K. Mishra'
  }
];

function getReportAiInterpretation(report, results, testMap) {
  const abnormalRows = results.filter(r => r.status === 'ABNORMAL' || r.status === 'CRITICAL');
  const criticalRows = results.filter(r => r.status === 'CRITICAL');
  
  // 1. Clinical Impression
  let impression = '';
  if (criticalRows.length > 0) {
    impression = `CRITICAL ALERT: Significant pathophysiological deviation identified in ${criticalRows.length} diagnostic parameter(s). Findings indicate acute cellular or metabolic imbalance requiring priority notification to treating physician. Immediate clinical correlation and confirmatory reflex assessment warranted.`;
  } else if (abnormalRows.length > 0) {
    impression = `Mild to moderate biological variance noted in ${abnormalRows.length} quantitative parameter(s). Findings deviate from standard physiological intervals but remain within outpatient manageable thresholds. Correlate with clinical history, nutritional status, and concurrent pharmacotherapy.`;
  } else {
    impression = `All evaluated hematological and biochemical parameters fall within established biological reference intervals for age and gender. No acute metabolic derangement, cytopenia, or active systemic inflammatory pattern detected in this test panel.`;
  }

  // 2. Key Parameter Anomalies
  let anomalies = [];
  if (abnormalRows.length === 0) {
    anomalies = [
      'All quantitative biomarkers are within established biological reference intervals.',
      'No cellular, enzymatic, or biochemical outliers detected in this sample accession.'
    ];
  } else {
    anomalies = abnormalRows.map(row => {
      const def = testMap[row.test_id];
      const name = def?.name || row.test_id;
      const deviation = row.flag === 'C-L' ? 'Critically Low' :
                        row.flag === 'C-H' ? 'Critically High' :
                        row.flag === 'L' ? 'Borderline Low' : 'Borderline High';
      return `${name}: ${row.value} ${row.unit} (Ref: ${row.reference_range?.text || 'Standard'}) — Flag [${row.flag}]. ${deviation} value observed requiring diagnostic attention.`;
    });
  }

  // 3. Suggested Secondary Diagnostic Tests
  let secondaryTests = [];
  const panel = (report.panelId || '').toLowerCase();
  const testDesc = (report.tests || '').toLowerCase();
  if (panel.includes('cbc') || testDesc.includes('cbc') || testDesc.includes('blood')) {
    secondaryTests = [
      'Serum Ferritin & Total Iron Binding Capacity (TIBC)',
      'High-Resolution Peripheral Blood Smear (PBS) Examination for RBC morphology',
      'Serum Vitamin B12 & Erythrocyte Folate Assay',
      'Reticulocyte Count & Erythrocyte Indices (MCV, MCH, MCHC)'
    ];
  } else if (panel.includes('lipid') || testDesc.includes('lipid')) {
    secondaryTests = [
      'Apolipoprotein B (ApoB) & Lipoprotein(a) [Lp(a)] Quantitative Assay',
      'High-Sensitivity C-Reactive Protein (hs-CRP) for vascular risk stratification',
      'Fasting Plasma Glucose & Glycated Hemoglobin (HbA1c)',
      'Carotid Intima-Media Thickness (CIMT) or Doppler Ultrasonography'
    ];
  } else if (panel.includes('lft') || testDesc.includes('liver')) {
    secondaryTests = [
      'Viral Hepatitis Serological Markers (HBsAg, Anti-HCV, Anti-HAV IgM)',
      'Ultrasound Whole Abdomen (Hepato-biliary parenchyma evaluation)',
      'Serum Albumin-to-Globulin (A/G) Ratio and Total Protein fraction',
      'Coagulation Screen (Prothrombin Time / INR)'
    ];
  } else if (panel.includes('thyroid') || testDesc.includes('thyroid')) {
    secondaryTests = [
      'Free Triiodothyronine (FT3) & Free Thyroxine (FT4) Chemiluminescence Assay',
      'Anti-Thyroid Peroxidase (Anti-TPO) & Anti-Thyroglobulin (Anti-TG) Antibodies',
      'High-Resolution Ultrasonography of Thyroid & Cervical Lymph Nodes',
      'Serum Reverse T3 (rT3) evaluation if clinically refractory'
    ];
  } else {
    secondaryTests = [
      'Comprehensive Metabolic Panel (CMP) with extended electrolytes (Na+, K+, Cl-)',
      'Serum Creatinine & Blood Urea Nitrogen (BUN) Renal Clearance Profile',
      'Repeat confirmatory specimen within 2-4 weeks to establish baseline stability'
    ];
  }

  // 4. Lifestyle / Dietary Guidance
  let lifestyleGuidance = [];
  if (panel.includes('cbc') || testDesc.includes('cbc')) {
    lifestyleGuidance = [
      'Incorporate bioavailable iron-dense dietary sources (dark leafy vegetables, lentils, beans, fortified grains).',
      'Avoid concurrent consumption of polyphenols/tannins (tea, coffee) within 1 hour of major meals to optimize gut iron uptake.',
      'Maintain robust daily oral hydration (2.5 – 3.0 Liters/day) to sustain physiological blood rheology.',
      'Schedule a formal outpatient consultation with the primary care physician for individualized therapeutic supplementation.'
    ];
  } else if (panel.includes('lipid') || testDesc.includes('lipid')) {
    lifestyleGuidance = [
      'Adopt a structured cardioprotective dietary pattern low in saturated fats, trans-fatty acids, and refined sugars.',
      'Engage in 150 minutes/week of moderate-intensity aerobic cardiovascular physical exercise.',
      'Enhance viscous dietary soluble fiber intake (oats, barley, psyllium husk, chia seeds).',
      'Schedule follow-up fasting lipid restaging in 6 to 8 weeks post dietary intervention.'
    ];
  } else if (panel.includes('lft') || testDesc.includes('liver')) {
    lifestyleGuidance = [
      'Strict abstention from alcoholic beverages and discretionary hepatotoxic OTC analgesics/supplements.',
      'Maintain caloric equilibrium with emphasis on antioxidant-rich whole foods and lean plant-based proteins.',
      'Regular clinical oversight with a hepatologist/gastroenterologist for serial enzyme kinetics.'
    ];
  } else if (panel.includes('thyroid') || testDesc.includes('thyroid')) {
    lifestyleGuidance = [
      'Ensure balanced micronutrient adequacy with dietary iodine and selenium (nuts, seeds, legumes).',
      'Strict adherence to morning empty-stomach administration of prescribed levothyroxine with plain water.',
      'Repeat serum TSH assessment at 6–8 weeks to confirm optimal hormonal homeostasis.'
    ];
  } else {
    lifestyleGuidance = [
      'Maintain balanced nutrition, adequate nocturnal restorative sleep (7–8 hours), and daily hydration.',
      'Consult the referring medical practitioner with this verified report for personalized management.'
    ];
  }

  return { impression, anomalies, secondaryTests, lifestyleGuidance };
}

export default function TodaysReports() {
  const navigate = useNavigate();
  const { data: reportsList, update: updateReportsList } = useDemoResource('todays_reports_list', INITIAL_REPORTS);

  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('13/09/2026');

  // Active Report Modal State
  const [activeReport, setActiveReport] = useState(null);
  const [modalResults, setModalResults] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalNotice, setModalNotice] = useState('');

  const reports = reportsList || INITIAL_REPORTS;

  const filtered = reports.filter(r => {
    const matchesTab = activeTab === 'All' || r.status.toLowerCase() === activeTab.toLowerCase();
    const matchesSearch = !search.trim() || 
      r.name.toLowerCase().includes(search.toLowerCase()) || 
      r.id.includes(search) || 
      r.tests.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Open patient-specific AI-driven report viewer modal
  const handleOpenReport = async (report) => {
    setActiveReport(report);
    setModalLoading(true);
    setModalNotice('');

    try {
      const caseUuid = `550e8400-e29b-41d4-a716-44665544${report.id.padStart(4, '0')}`;
      const centerUuid = '550e8400-e29b-41d4-a716-446655440002';
      const sim = await runSimulation(caseUuid, centerUuid, report.testIds, false);
      setModalResults(sim.results || []);
    } catch {
      // Fallback to catalogue defaults
      const testMap = Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]));
      const defaults = report.testIds.map(tid => {
        const def = testMap[tid];
        return {
          test_id: tid,
          value: def ? (def.normalRange.min + def.normalRange.max) / 2 : 0,
          unit: def?.unit || '',
          reference_range: def?.normalRange || { text: 'N/A' },
          flag: 'N',
          status: 'NORMAL'
        };
      });
      setModalResults(defaults);
    } finally {
      setModalLoading(false);
    }
  };

  // Recalculate flag when value is edited inline
  const handleValueChange = (testId, newVal) => {
    const num = parseFloat(newVal);
    const testMap = Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]));
    const def = testMap[testId];

    setModalResults(prev => prev.map(row => {
      if (row.test_id !== testId) return row;
      if (isNaN(num) || !def) {
        return { ...row, value: newVal };
      }
      const { flag, status } = computeFlag(num, {
        min: def.normalRange?.min,
        max: def.normalRange?.max,
        criticalLow: def.criticalLow,
        criticalHigh: def.criticalHigh
      });
      return {
        ...row,
        value: num,
        flag,
        status
      };
    }));
  };

  // Mark report as Signed off / Final and persist update
  const handleSignOffReport = (newStatus = 'Signed off') => {
    if (!activeReport) return;
    updateReportsList(prev => (prev || INITIAL_REPORTS).map(r => 
      r.id === activeReport.id ? { ...r, status: newStatus } : r
    ));
    setActiveReport(prev => prev ? { ...prev, status: newStatus } : null);
    setModalNotice(`Report #${activeReport.id} successfully updated to "${newStatus}".`);
    setTimeout(() => setModalNotice(''), 3000);
  };

  const handleDownloadPdf = () => {
    window.print();
  };

  const handlePrintReport = () => {
    window.print();
  };

  const testMap = Object.fromEntries(TEST_CATALOGUE.map(t => [t.test_id, t]));

  return (
    <div className="lab-view-container">
      <div className="lab-header-row">
        <h2>Reports for today</h2>
        <span className="lab-recent-link" style={{ cursor: 'pointer' }} onClick={() => alert('All report dispatches synced.')}>
          ✨ Recent changes ↗
        </span>
      </div>
      
      <div className="lab-controls-row">
        <div className="lab-search-input-wrapper">
          <MagnifyingGlassIcon className="lab-search-icon" />
          <input 
            type="text" 
            placeholder="Search patient, test or ID..." 
            className="lab-input" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="lab-date-pager">
          <button type="button" className="lab-pager-btn" onClick={() => setDate('12/09/2026')}>
            <ChevronLeftIcon className="lab-small-icon" />
          </button>
          <input type="text" value={date} className="lab-input lab-date-input" readOnly />
          <button type="button" className="lab-pager-btn" onClick={() => setDate('14/09/2026')}>
            <ChevronRightIcon className="lab-small-icon" />
          </button>
        </div>
        
        <button type="button" className="lab-btn lab-btn-outline" onClick={() => alert(`Today's summary: ${reports.length} total samples, ${reports.filter(r => r.status === 'Final' || r.status === 'Signed off').length} signed off/final.`)}>
          <ChartBarIcon className="lab-btn-icon" /> Stats
        </button>
      </div>

      <div className="lab-tabs-row">
        <div className="lab-tabs">
          {['All', 'New', 'In progress', 'Final', 'Signed off'].map(tab => (
            <button 
              key={tab}
              type="button" 
              className={`lab-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab} <span className="lab-badge">
                {tab === 'All' ? reports.length : reports.filter(r => r.status.toLowerCase() === tab.toLowerCase()).length}
              </span>
            </button>
          ))}
        </div>
        
        <div className="lab-print-status" style={{ cursor: 'pointer' }} onClick={() => window.print()}>
          <PrinterIcon className="lab-small-icon" /> Print Batch
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>PATIENT NAME</th>
            <th>TESTS</th>
            <th>STATUS</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => (
            <tr key={r.id}>
              <td><strong>#{r.id}</strong></td>
              <td>{r.name}</td>
              <td>{r.tests}</td>
              <td>
                <span className={`lab-status-badge status-${r.status.toLowerCase().replace(/\s+/g, '')}`}>
                  {r.status}
                </span>
              </td>
              <td>
                <button
                  type="button"
                  onClick={() => handleOpenReport(r)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: '1px solid #15803d',
                    background: '#f0fdf4',
                    color: '#15803d',
                    fontSize: '0.8rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dcfce7'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#f0fdf4'; }}
                >
                  <EyeIcon style={{ width: '14px' }} /> View / Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ─── Fully Interactive Patient-Specific Full-Page Clinical Document Modal ──────────── */}
      {activeReport && (
        <div 
          className="report-modal-backdrop"
          onClick={() => setActiveReport(null)}
        >
          <div 
            className="report-modal-wrapper"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Utility Bar (Hidden in Print) */}
            <div className="report-modal-utility-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <SparklesIcon style={{ width: 18, color: '#4ade80' }} />
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                  Clinical Report #{activeReport.id} • {activeReport.name}
                </span>
                <span className={`lab-status-badge status-${activeReport.status.toLowerCase().replace(/\s+/g, '')}`}>
                  {activeReport.status}
                </span>
              </div>

              <div className="report-utility-actions">
                <button
                  type="button"
                  className="report-util-btn secondary"
                  onClick={() => {
                    navigate(`/app/lab/ai-report-viewer?panel=${activeReport.panelId}&patient=${encodeURIComponent(activeReport.name)}&id=${activeReport.id}`);
                  }}
                  title="Open in Full AI Studio"
                >
                  <ArrowTopRightOnSquareIcon style={{ width: 14 }} /> AI Studio
                </button>

                <button
                  type="button"
                  className="report-util-btn secondary"
                  onClick={handleDownloadPdf}
                  title="Download as PDF via system print dialog"
                >
                  <ArrowDownTrayIcon style={{ width: 14 }} /> Download PDF
                </button>

                <button
                  type="button"
                  className="report-util-btn secondary"
                  onClick={handlePrintReport}
                  title="Print official clinical laboratory report"
                >
                  <PrinterIcon style={{ width: 14 }} /> Print Report
                </button>

                <button
                  type="button"
                  className="report-util-btn primary"
                  onClick={() => handleSignOffReport('Final')}
                  title="Authenticate and approve report as Final"
                >
                  <CheckCircleIcon style={{ width: 14 }} /> Sign Off & Mark Final
                </button>

                <button
                  type="button"
                  className="report-util-btn close"
                  onClick={() => setActiveReport(null)}
                  aria-label="Close modal"
                >
                  <XMarkIcon style={{ width: 20 }} />
                </button>
              </div>
            </div>

            {/* Notification Bar */}
            {modalNotice && (
              <div style={{
                background: '#dcfce7',
                color: '#15803d',
                padding: '0.5rem 1.5rem',
                fontSize: '0.85rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderBottom: '1px solid #bbf7d0'
              }}>
                <CheckCircleIcon style={{ width: 16 }} /> {modalNotice}
              </div>
            )}

            {/* Document Body / Paper Canvas */}
            <div style={{ maxHeight: '88vh', overflowY: 'auto', background: '#f8fafc', padding: '1.5rem' }}>
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                    Generating Official Clinical Findings...
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Hydrating verified parameter bounds and running deterministic AI simulation for #{activeReport.id}
                  </div>
                </div>
              ) : (
                <div className="clinical-report-sheet">
                  {/* Top Green Accent Bar */}
                  <div style={{ height: '4px', background: 'linear-gradient(90deg, #15803d, #22c55e)', borderRadius: '2px', marginBottom: '1.25rem' }} />

                  {/* Pathology Letterhead */}
                  <div className="report-letterhead">
                    <div className="letterhead-top">
                      <div className="letterhead-brand">
                        <div className="letterhead-logo-box">
                          <BuildingOffice2Icon style={{ width: 30 }} />
                        </div>
                        <div>
                          <h1 className="letterhead-title">LabSetu Diagnostic & Molecular Pathology Center</h1>
                          <div className="letterhead-subtitle">
                            NABL ACCREDITED • ISO 15189:2022 CERTIFIED • LICENSE NO: DL-PB/2026/89410
                          </div>
                          <div className="letterhead-lic">
                            ICMR Registered Reference Lab Code: <strong>ICMR-LABSETU-DEL-0419</strong> • Central Laboratory Network
                          </div>
                        </div>
                      </div>

                      <div className="letterhead-barcode-box">
                        <div className="barcode-stripes">||| | |||| ||| ||||| || |||</div>
                        <div className="barcode-text">SAMPLE REF: *LS-98410-{activeReport.id}*</div>
                        <div style={{ fontSize: '0.65rem', color: '#15803d', fontWeight: 700, marginTop: '2px' }}>
                          ✓ PKI AUTHENTICATED
                        </div>
                      </div>
                    </div>

                    <div className="letterhead-contact-bar">
                      <span><strong>Address:</strong> Plot 42, Health City Phase-II, Okhla Institutional Area, New Delhi - 110029</span>
                      <span><strong>Tel:</strong> +91 11 2659 8000 | <strong>Helpline:</strong> 1800-202-6000</span>
                      <span><strong>Email:</strong> reports@labsetu.health | <strong>Web:</strong> https://labsetu.health</span>
                    </div>
                  </div>

                  {/* Patient Demographics Grid */}
                  <div className="report-patient-box">
                    <div className="patient-info-item">
                      <span className="label">Patient Name</span>
                      <span className="val" style={{ fontSize: '0.95rem', color: '#15803d' }}>{activeReport.name}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">Age / Gender</span>
                      <span className="val">{activeReport.age || 38} Y / {activeReport.gender || 'Male'}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">UHID (Patient ID)</span>
                      <span className="val" style={{ fontFamily: 'monospace' }}>LS-UHID-{activeReport.id.padStart(6, '0')}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">Case / Order ID</span>
                      <span className="val" style={{ fontFamily: 'monospace' }}>CASE-#{activeReport.id}</span>
                    </div>

                    <div className="patient-info-item">
                      <span className="label">Referred By</span>
                      <span className="val">{activeReport.ref || 'Dr. Self / Direct Walk-In'}</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">Sample Specimen</span>
                      <span className="val">Whole Blood (EDTA) / Serum</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">Collection Date & Time</span>
                      <span className="val">13-Sep-2026 08:30 AM</span>
                    </div>
                    <div className="patient-info-item">
                      <span className="label">Reporting Date & Time</span>
                      <span className="val">13-Sep-2026 11:45 AM</span>
                    </div>
                  </div>

                  {/* Department & Investigation Banner */}
                  <div className="report-dept-banner">
                    <div className="dept-name">Department of Biochemistry & Clinical Pathology</div>
                    <div className="test-name">{activeReport.tests.toUpperCase()}</div>
                    <div className="methodology">
                      Assay Methodology: Fully Automated 6-Part Hematology Flow Cytometry / Dry Chemistry Photometry Analyzer
                    </div>
                  </div>

                  {/* Summary Metric Chips (hidden in print) */}
                  <div className="no-print" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#eff6ff', color: '#1d4ed8', fontSize: '0.78rem', fontWeight: '700' }}>
                      Total Parameters: {modalResults.length}
                    </div>
                    <div style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#f0fdf4', color: '#15803d', fontSize: '0.78rem', fontWeight: '700' }}>
                      Normal: {modalResults.filter(r => r.status === 'NORMAL').length}
                    </div>
                    <div style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#fef3c7', color: '#92400e', fontSize: '0.78rem', fontWeight: '700' }}>
                      Abnormal: {modalResults.filter(r => r.status === 'ABNORMAL').length}
                    </div>
                    <div style={{ padding: '0.3rem 0.65rem', borderRadius: '6px', background: '#fee2e2', color: '#b91c1c', fontSize: '0.78rem', fontWeight: '700' }}>
                      Critical: {modalResults.filter(r => r.status === 'CRITICAL').length}
                    </div>
                  </div>

                  {/* Full-Width Findings Table */}
                  <table className="report-findings-table">
                    <thead>
                      <tr>
                        <th style={{ width: '30%' }}>TEST / PARAMETER</th>
                        <th style={{ width: '18%' }}>OBSERVED VALUE</th>
                        <th style={{ width: '14%' }}>STANDARD UNIT</th>
                        <th style={{ width: '22%' }}>BIOLOGICAL REF INTERVAL</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>FLAG</th>
                        <th style={{ width: '8%', textAlign: 'center' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalResults.map(row => {
                        const def = testMap[row.test_id];
                        const paramName = def?.name || row.test_id;
                        const flagClass = 
                          row.status === 'CRITICAL' ? 'flag-badge-critical' :
                          row.status === 'ABNORMAL' ? 'flag-badge-abnormal' : 'flag-badge-normal';

                        return (
                          <tr key={row.test_id}>
                            <td style={{ fontWeight: 600, color: '#0f172a' }}>
                              {paramName}
                            </td>
                            <td>
                              <input
                                type="number"
                                step="any"
                                value={row.value}
                                onChange={e => handleValueChange(row.test_id, e.target.value)}
                                className="report-inline-input"
                                title="Click to edit value and test dynamic bounds recalculation"
                              />
                            </td>
                            <td style={{ color: '#475569', fontWeight: 500 }}>
                              {row.unit}
                            </td>
                            <td style={{ color: '#475569', fontSize: '0.8rem' }}>
                              {row.reference_range?.text || '—'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`report-flag-badge ${flagClass}`}>
                                {row.flag}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: row.status === 'CRITICAL' ? '#b91c1c' : row.status === 'ABNORMAL' ? '#b45309' : '#15803d' }}>
                              {row.status}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Structured AI Clinical Interpretation Section */}
                  {(() => {
                    const ai = getReportAiInterpretation(activeReport, modalResults, testMap);
                    return (
                      <div className="report-ai-interpretation-card">
                        <div className="ai-interp-header">
                          <div className="ai-interp-title">
                            <SparklesIcon style={{ width: 18 }} />
                            AI Clinical Interpretation & Observations
                          </div>
                          <span className="ai-interp-badge">
                            Model: LabSetu-Sim v1.0 • Clinician Corroboration Required
                          </span>
                        </div>

                        <div className="ai-interp-grid">
                          {/* Subsection 1: Clinical Impression */}
                          <div className="ai-interp-block full-width">
                            <div className="ai-interp-block-title">
                              <InformationCircleIcon style={{ width: 14 }} />
                              1. Clinical Impression
                            </div>
                            <p className="ai-interp-text">{ai.impression}</p>
                          </div>

                          {/* Subsection 2: Key Parameter Anomalies */}
                          <div className="ai-interp-block">
                            <div className="ai-interp-block-title">
                              <ExclamationTriangleIcon style={{ width: 14 }} />
                              2. Key Parameter Anomalies
                            </div>
                            <ul className="ai-interp-list">
                              {ai.anomalies.map((anom, idx) => (
                                <li key={idx}>{anom}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Subsection 3: Suggested Secondary Diagnostic Tests */}
                          <div className="ai-interp-block">
                            <div className="ai-interp-block-title">
                              <ShieldCheckIcon style={{ width: 14 }} />
                              3. Suggested Secondary Diagnostic Tests
                            </div>
                            <ul className="ai-interp-list">
                              {ai.secondaryTests.map((t, idx) => (
                                <li key={idx}>{t}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Subsection 4: Lifestyle / Dietary Guidance */}
                          <div className="ai-interp-block full-width">
                            <div className="ai-interp-block-title">
                              <CheckCircleIcon style={{ width: 14 }} />
                              4. Lifestyle & Dietary Guidance
                            </div>
                            <ul className="ai-interp-list">
                              {ai.lifestyleGuidance.map((guide, idx) => (
                                <li key={idx}>{guide}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sign-off & Signatures Block */}
                  <div className="report-signoff-grid">
                    <div className="signoff-col">
                      <div className="sign-cursive">R. Kumar</div>
                      <div className="sign-title">Ramesh Kumar, DMLT, CMLT</div>
                      <div className="sign-role">Senior Medical Laboratory Technologist</div>
                      <div className="sign-reg">Lic: MLT-DL-7741 • Section Head</div>
                    </div>

                    <div className="signoff-col signoff-seal-col">
                      <div className="nabl-seal-box">
                        <div>★ NABL ACCREDITED ★</div>
                        <div>CALIBRATION & TESTING</div>
                        <div style={{ fontSize: '0.62rem', color: '#166534', marginTop: '2px' }}>
                          Cert. No. MC-2841
                        </div>
                        <div style={{ fontSize: '0.6rem', color: '#64748b', marginTop: '2px' }}>
                          Digitally Validated PKI
                        </div>
                      </div>
                    </div>

                    <div className="signoff-col" style={{ textAlign: 'right' }}>
                      <div className="sign-cursive">Dr. Priya Sundaram</div>
                      <div className="sign-title">Dr. Priya Sundaram, MD (Path)</div>
                      <div className="sign-role">Consultant Pathologist & Lab Director</div>
                      <div className="sign-reg">Reg No: MCI-2014/45829 • NABL Signatory</div>
                    </div>
                  </div>

                  {/* Report Footer Disclaimer */}
                  <div className="report-document-footer">
                    <div>
                      <strong>Disclaimer:</strong> This laboratory diagnostic report reflects analytical testing of the specimen submitted. Findings should be interpreted in conjunction with complete clinical history, physical findings, and related investigative modalities by a registered medical practitioner. Biological reference intervals vary with age, gender, and instrument platform.
                    </div>
                    <div style={{ marginTop: '0.35rem', fontWeight: 600 }}>
                      Page 1 of 1 • LabSetu LIS Auto-Generated Clinical Record • ════ End of Report ════
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

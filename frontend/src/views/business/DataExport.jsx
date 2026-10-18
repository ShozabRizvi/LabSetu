import React, { useState } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import './BusinessShared.css';

export default function DataExport() {
  const [dataset, setDataset] = useState('bills');
  const [format, setFormat] = useState('csv');
  const [fromDate, setFromDate] = useState('2026-09-01');
  const [toDate, setToDate] = useState('2026-09-13');
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleExport = (e) => {
    e.preventDefault();
    setIsExporting(true);

    setTimeout(() => {
      let content = '';
      let filename = `labsetu_${dataset}_export_${fromDate}_to_${toDate}`;

      if (dataset === 'bills') {
        if (format === 'csv') {
          content = 'Bill ID,Patient Name,Date,Amount,Payment Method,Status\nINV-2026-1049,Riya Sharma,12/09/2026,850,UPI,Paid\nINV-2026-1050,Aarav Singh,11/09/2026,600,Due,Unsettled\nINV-2026-1051,Meera Verma,10/09/2026,250,Card,Paid\n';
          filename += '.csv';
        } else {
          content = JSON.stringify([
            { id: 'INV-2026-1049', patient: 'Riya Sharma', date: '12/09/2026', amount: 850, method: 'UPI', status: 'Paid' },
            { id: 'INV-2026-1050', patient: 'Aarav Singh', date: '11/09/2026', amount: 600, method: 'Due', status: 'Unsettled' }
          ], null, 2);
          filename += '.json';
        }
      } else if (dataset === 'patients') {
        if (format === 'csv') {
          content = 'UHID,Name,Mobile,Registered Date,Total Visits\nUHID-1001,Ananya Sharma,9876501234,01/09/2026,3\nUHID-1002,Karan Mehra,9876511223,04/09/2026,1\n';
          filename += '.csv';
        } else {
          content = JSON.stringify([
            { uhid: 'UHID-1001', name: 'Ananya Sharma', phone: '9876501234', registered: '01/09/2026', visits: 3 }
          ], null, 2);
          filename += '.json';
        }
      } else {
        content = 'ID,Title,Category,Amount,Date\nEXP-101,Vacutainer Tubes,Consumables,3500,13/09/2026\nEXP-102,Biochemistry Reagents,Reagents,8200,11/09/2026\n';
        filename += '.csv';
      }

      // Trigger browser download
      const blob = new Blob([content], { type: format === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setIsExporting(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="business-page">
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0' }}>Data Export & Compliance Archives</h2>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
          Extract structured audit data for accounting, compliance reports, and tax reconciliation.
        </p>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        maxWidth: '640px'
      }}>
        <form onSubmit={handleExport} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.4rem', color: '#334155' }}>
              Select Data Archive to Export
            </label>
            <select
              value={dataset}
              onChange={e => setDataset(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.9rem', boxSizing: 'border-box' }}
            >
              <option value="bills">Billing, Invoices & Cashier Shift Ledgers</option>
              <option value="patients">Patient Demographics & Medical UHID Registry</option>
              <option value="reports">Diagnostic Lab Test Reports & Findings</option>
              <option value="expenses">Operational Expenses & Supplier Ledger</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.4rem', color: '#334155' }}>
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.4rem', color: '#334155' }}>
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.4rem', color: '#334155' }}>
              Export File Format
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={() => setFormat('csv')}
                />
                CSV Spreadsheet (.csv - Excel, Google Sheets)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={format === 'json'}
                  onChange={() => setFormat('json')}
                />
                JSON Data Document (.json)
              </label>
            </div>
          </div>

          {downloadSuccess && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#15803d', fontSize: '0.875rem', backgroundColor: '#f0fdf4', padding: '0.75rem', borderRadius: '6px', border: '1px solid #bbf7d0' }}>
              <CheckCircleIcon style={{ width: '18px' }} />
              Export file generated and downloaded to your device!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '0.5rem' }}>
            <button
              type="submit"
              disabled={isExporting}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 1.4rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              <DocumentArrowDownIcon style={{ width: '20px' }} />
              {isExporting ? 'Generating Export...' : 'Generate & Download Export'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

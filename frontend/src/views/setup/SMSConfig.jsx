import React, { useState } from 'react';
import './SMSConfig.css';
import useDemoResource from '../../hooks/useDemoResource';

export default function SMSConfig() {
  const defaultSMS = {
    sendWelcome: true,
    sendBill: true,
    sendReportReady: true,
  };

  const { data: smsConfig, update: setSMSConfig } = useDemoResource('labsetu_setup_sms', defaultSMS);
  const [config, setConfig] = useState(smsConfig || defaultSMS);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [notice, setNotice] = useState('');

  const handleUpdate = (e) => {
    e.preventDefault();
    setSMSConfig(config);
    setNotice('SMS template configurations updated successfully.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div>
      <h2 className="setup-page-title">SMS Settings & Templates</h2>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      <div style={{ background: '#eff6ff', color: '#1e40af', padding: '1rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1rem' }}>
        SMS notifications are dispatched to registered patient mobile numbers. Current demo credit balance: <strong>100 SMS credits</strong>.
      </div>

      <div
        onClick={() => setShowHowItWorks(!showHowItWorks)}
        style={{ background: '#f8fafc', border: '1px solid #e5e7eb', padding: '0.75rem', borderRadius: '6px', color: '#334155', fontSize: '0.9rem', marginBottom: '1.5rem', cursor: 'pointer', fontWeight: '500', userSelect: 'none' }}
      >
        {showHowItWorks ? 'How it works? ▴' : 'How it works? ⌄'}
      </div>

      {showHowItWorks && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.85rem', color: '#475569' }}>
          <p style={{ margin: '0 0 0.5rem 0' }}>• <strong>Welcome SMS:</strong> Sent immediately when a new patient registration is created with their UHID.</p>
          <p style={{ margin: '0 0 0.5rem 0' }}>• <strong>Bill SMS:</strong> Dispatched when a payment transaction is recorded with payment breakdown & balance.</p>
          <p style={{ margin: 0 }}>• <strong>Report Ready SMS:</strong> Triggered once all lab tests for a case reach "Completed" status with instant online PDF download link.</p>
        </div>
      )}

      <form onSubmit={handleUpdate}>
        <div className="sms-phones-grid">
          {/* Phone 1 */}
          <div className="sms-phone-container">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '500', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.sendWelcome}
                onChange={(e) => setConfig({ ...config, sendWelcome: e.target.checked })}
              /> Send welcome SMS
            </label>
            <div className="mockup-phone">
              <div className="phone-screen">
                <div className="phone-header">HP-LABSMT</div>
                <div className="phone-body">
                  Welcome to LabSetu.<br/>
                  Please save for any enquiries.<br/><br/>
                  -<br/>
                  LabSetu Software
                </div>
              </div>
              <div className="phone-button"></div>
            </div>
          </div>

          {/* Phone 2 */}
          <div className="sms-phone-container">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '500', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.sendBill}
                onChange={(e) => setConfig({ ...config, sendBill: e.target.checked })}
              /> Send bill SMS
            </label>
            <div className="mockup-phone">
              <div className="phone-screen">
                <div className="phone-header">HP-LABSMT</div>
                <div className="phone-body">
                  Hello, Your Reg. no REG_NO<br/>
                  You paid FEE_PAID,<br/>
                  Total Fee: TOTAL_FEE<br/>
                  Balance: BALANCE<br/>
                  - From LabSetu<br/><br/>
                  -<br/>
                  LabSetu Software
                </div>
              </div>
              <div className="phone-button"></div>
            </div>
          </div>

          {/* Phone 3 */}
          <div className="sms-phone-container">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontWeight: '500', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={config.sendReportReady}
                onChange={(e) => setConfig({ ...config, sendReportReady: e.target.checked })}
              /> Send report ready SMS
            </label>
            <div className="mockup-phone">
              <div className="phone-screen">
                <div className="phone-header">HP-LABSMT</div>
                <div className="phone-body">
                  Your report is ready. Kindly collect from the lab or download online from your patient portal.<br/>
                  - from LabSetu<br/><br/>
                  -<br/>
                  LabSetu Software
                </div>
              </div>
              <div className="phone-button"></div>
            </div>
          </div>
        </div>

        <button type="submit" className="setup-btn-blue" style={{ marginTop: '2rem' }}>
          Update SMS Configuration
        </button>
      </form>
    </div>
  );
}

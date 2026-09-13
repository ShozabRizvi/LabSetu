import React from 'react';
import './SMSConfig.css';

export default function SMSConfig() {
  return (
    <div>
      <h2 className="setup-page-title">SMS Settings</h2>
      
      <div style={{background:'#eff6ff', color:'#1e40af', padding:'1rem', borderRadius:'6px', fontSize:'0.9rem', marginBottom:'1rem'}}>
        SMS is charged at 20p per credit. Buy credits from <u>SMS credits</u> page.
      </div>

      <div style={{background:'#f8fafc', border:'1px solid #e5e7eb', padding:'0.75rem', borderRadius:'6px', color:'#334155', fontSize:'0.9rem', marginBottom:'2rem', cursor:'pointer', fontWeight:'500'}}>
        How it works? ⌄
      </div>

      <div className="sms-phones-grid">
        {/* Phone 1 */}
        <div className="sms-phone-container">
          <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontWeight:'500'}}>
            <input type="checkbox" defaultChecked /> Send welcome sms
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
          <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontWeight:'500'}}>
            <input type="checkbox" defaultChecked /> Send bill sms
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
          <label style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem', fontWeight:'500'}}>
            <input type="checkbox" defaultChecked /> Send report ready sms
          </label>
          <div className="mockup-phone">
            <div className="phone-screen">
              <div className="phone-header">HP-LABSMT</div>
              <div className="phone-body">
                Your report is ready. Kindly collect from the lab/centre.<br/>
                - from LabSetu<br/><br/>
                -<br/>
                LabSetu Software
              </div>
            </div>
            <div className="phone-button"></div>
          </div>
        </div>
      </div>

      <button className="setup-btn-blue" style={{marginTop:'2rem'}}>Update</button>
    </div>
  );
}

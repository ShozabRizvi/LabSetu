import React from 'react';
import '../lab/LabShared.css'; // Reuse table styles
import { PlusIcon, ArrowDownTrayIcon, PrinterIcon, MagnifyingGlassIcon, XCircleIcon, PencilIcon } from '@heroicons/react/24/outline';

export default function Ratelist() {
  return (
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      
      {/* Top Filter Bar */}
      <div style={{display:'flex', gap:'1rem', alignItems:'center', flexWrap:'wrap', marginBottom:'1rem'}}>
        {/* Pills */}
        <div style={{display:'flex', gap:'0.5rem', background:'#f8fafc', padding:'0.5rem', borderRadius:'6px'}}>
          <button style={{padding:'0.5rem 1rem', background:'#dbeafe', color:'#1e3a8a', border:'none', borderRadius:'4px', fontWeight:'500'}}>Lab</button>
          <button style={{padding:'0.5rem 1rem', background:'transparent', border:'none', color:'#475569'}}>USG</button>
          <button style={{padding:'0.5rem 1rem', background:'transparent', border:'none', color:'#475569'}}>Digital X-ray</button>
          <button style={{padding:'0.5rem 1rem', background:'transparent', border:'none', color:'#475569'}}>X-ray</button>
          <button style={{padding:'0.5rem 1rem', background:'transparent', border:'none', color:'#475569'}}>Outsource Lab</button>
          <button style={{padding:'0.5rem 1rem', background:'transparent', border:'none', color:'#475569'}}>ECG</button>
        </div>
        
        {/* Bulk Update */}
        <div style={{display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.9rem'}}>
          Bulk update revenue share by percentage: 
          <input type="text" className="setup-input" style={{width:'50px', padding:'0.3rem'}} /> %
          <button className="setup-btn-blue" style={{background:'#f1f5f9', color:'#334155', border:'1px solid #cbd5e1'}}>Update all</button>
        </div>

        <div style={{marginLeft:'auto', display:'flex', gap:'0.5rem'}}>
          <button className="setup-btn-blue" style={{background:'transparent', color:'#475569', border:'1px solid #cbd5e1'}}><ArrowDownTrayIcon className="setup-icon" style={{width:'16px'}}/> Download CSV</button>
          <button className="setup-btn-blue"><PlusIcon className="setup-icon" style={{width:'16px'}}/> Add New</button>
          <button className="setup-btn-blue" style={{background:'transparent', color:'#475569', border:'1px solid #cbd5e1'}}><PrinterIcon className="setup-icon" style={{width:'16px'}}/> Print ratelist</button>
        </div>
      </div>

      <div style={{background:'#fce7f3', color:'#be185d', padding:'0.5rem 1rem', borderRadius:'4px', fontSize:'0.85rem', marginBottom:'1rem'}}>
        Use <strong>TAB</strong> button to change the rates one by one.
      </div>

      <div style={{display:'flex', gap:'1.5rem', marginBottom:'1rem', fontSize:'0.9rem'}}>
        <div style={{fontWeight:'600', color:'#2563eb', borderBottom:'2px solid #2563eb', paddingBottom:'0.5rem'}}>Active <span style={{background:'#e0e7ff', padding:'0.2rem 0.5rem', borderRadius:'10px'}}>295</span></div>
        <div style={{color:'#6b7280'}}>Inactive <span style={{background:'#f3f4f6', padding:'0.2rem 0.5rem', borderRadius:'10px'}}>0</span></div>
      </div>

      <div className="lab-tabs-row" style={{marginBottom:'1rem'}}>
        <div className="lab-tabs" style={{border:'none', gap:'1rem'}}>
          <button className="lab-tab active" style={{background:'#f8fafc', border:'1px solid #e5e7eb', borderRadius:'20px', padding:'0.3rem 1rem'}}>Tests</button>
          <button className="lab-tab" style={{background:'#ffffff', border:'1px solid transparent', padding:'0.3rem 1rem'}}>Packages</button>
          <button className="lab-tab" style={{background:'#ffffff', border:'1px solid transparent', padding:'0.3rem 1rem'}}>Panels</button>
          <button className="lab-tab" style={{background:'#ffffff', border:'1px solid transparent', padding:'0.3rem 1rem'}}>Bill only</button>
        </div>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>NAME</th>
            <th>ENTRY TYPE</th>
            <th>FEE</th>
            <th>REVENUE SHARE AMOUNT</th>
            <th>FOR GENDER</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {[
            {name: 'ABG'}, {name: 'ADA'}, {name: 'AEC'}, {name: 'AFB'}, {name: 'AFP'}
          ].map((row, idx) => (
            <tr key={idx} className="lab-hover-interactive">
              <td>{row.name} <PencilIcon style={{width:'14px', color:'#9ca3af', marginLeft:'0.5rem'}}/></td>
              <td>Test <span style={{color:'#9ca3af'}}>...</span></td>
              <td><input type="text" className="setup-input" defaultValue="100" style={{width:'80px', padding:'0.3rem'}} /></td>
              <td><input type="text" className="setup-input" defaultValue="0" style={{width:'80px', padding:'0.3rem'}} /></td>
              <td>
                <select className="setup-input" style={{width:'100px', padding:'0.3rem'}}>
                  <option>Both</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </td>
              <td><button className="lab-link-btn" style={{color:'#6b7280'}}><XCircleIcon style={{width:'16px'}}/> Remove</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

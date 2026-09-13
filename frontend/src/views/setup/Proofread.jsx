import React from 'react';
import '../lab/LabShared.css'; // For tabs
import { PencilIcon } from '@heroicons/react/24/outline';

export default function Proofread() {
  const categories = [
    "Haematology", "Biochemistry", "Serology & Immunology", 
    "Clinical Pathology", "Cytology", "Microbiology", "Endocrinology", "Histopathology", "Others", "Miscellaneous"
  ];

  return (
    <div>
      <h2 className="setup-page-title">Proofread</h2>

      <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem', overflowX:'auto', whiteSpace:'nowrap', paddingBottom:'0.5rem'}}>
        <span style={{fontWeight:'600', fontSize:'0.9rem'}}>Select category:</span>
        {categories.map((cat, idx) => (
          <button 
            key={cat} 
            style={{
              padding:'0.4rem 0.8rem', 
              background: idx === 0 ? '#2563eb' : 'transparent',
              color: idx === 0 ? 'white' : '#4b5563',
              border: 'none',
              borderRadius: '4px',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{background:'#fee2e2', color:'#b91c1c', padding:'0.75rem', borderRadius:'4px', fontSize:'0.85rem', marginBottom:'1.5rem'}}>
        ⚠️ <strong>IMPORTANT:</strong> It is required that you verify and update the normal values according to your needs.
      </div>

      <h3 style={{fontSize:'1.25rem', marginBottom:'1rem'}}>Haematology tests</h3>

      {/* Test Block 1 */}
      <div style={{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
          <h4 style={{margin:0, fontSize:'1rem', color:'#111827'}}>Hemoglobin, Hb (g/dl)</h4>
          <button className="lab-link-btn" style={{fontSize:'0.85rem'}}><PencilIcon className="lab-small-icon" /> Edit normal values</button>
        </div>
        
        <div style={{paddingLeft:'1rem', borderLeft:'2px solid #e5e7eb'}}>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'0.25rem'}}>M/F</div>
            <div style={{fontSize:'0.9rem'}}>17.0 - 23.0 (0D - 21D)</div>
            <div style={{fontSize:'0.9rem'}}>11.2 - 16.5 (21D - 10Y)</div>
          </div>
          <div style={{marginBottom:'1rem'}}>
            <div style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'0.25rem'}}>M</div>
            <div style={{fontSize:'0.9rem'}}>13.0 - 17.0 (10Y - 120Y)</div>
          </div>
          <div>
            <div style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'0.25rem'}}>F</div>
            <div style={{fontSize:'0.9rem'}}>12.0 - 15.0 (10Y - 120Y)</div>
          </div>
        </div>
      </div>

      {/* Test Block 2 */}
      <div style={{border:'1px solid #e5e7eb', borderRadius:'8px', padding:'1.5rem', marginBottom:'1rem'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem'}}>
          <h4 style={{margin:0, fontSize:'1rem', color:'#111827'}}>Total Leukocyte Count, TLC (cumm)</h4>
          <button className="lab-link-btn" style={{fontSize:'0.85rem'}}><PencilIcon className="lab-small-icon" /> Edit normal values</button>
        </div>
        
        <div style={{paddingLeft:'1rem', borderLeft:'2px solid #e5e7eb'}}>
          <div>
            <div style={{fontSize:'0.85rem', color:'#6b7280', marginBottom:'0.25rem'}}>M/F</div>
            <div style={{fontSize:'0.9rem'}}>9,000.0 - 30,000.0 (0D - 14D)</div>
            <div style={{fontSize:'0.9rem'}}>5,000.0 - 21,000.0 (15D - 2M)</div>
            <div style={{fontSize:'0.9rem'}}>5,000.0 - 19,000.0 (2M - 6Y)</div>
            <div style={{fontSize:'0.9rem'}}>4,800.0 - 10,800.0 (6Y - 120Y)</div>
          </div>
        </div>
      </div>
      
    </div>
  );
}

import React from 'react';
import '../lab/LabShared.css'; // Reuse table styles
import './TestPanels.css';
import { PlusIcon, QuestionMarkCircleIcon, ChevronDownIcon, ChevronUpDownIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function TestPanels() {
  const data = [
    {
      order: 1,
      name: "Complete Blood Count (CBC)",
      category: "Haematology",
      tests: "Hemoglobin, Total Leukocyte Count... (14 tests)",
      ratelist: "CBC with GBP, Complete Blood Count (CBC)"
    },
    {
      order: 2,
      name: "CBC (with absolute counts)",
      category: "Haematology",
      tests: "Hemoglobin, Total Leukocyte Count... (14 tests)",
      ratelist: "Antenatal Package, Cardiac package..."
    },
    {
      order: 3,
      name: "CBC with ESR",
      category: "Haematology",
      tests: "Hemoglobin, Total Leukocyte Count... (15 tests)",
      ratelist: "Anemia package, Arthritis Package..."
    },
    {
      order: 4,
      name: "BT & CT",
      category: "Haematology",
      tests: "Bleeding Time, Clotting Time (2 tests)",
      ratelist: "BT & CT"
    }
  ];

  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
        <h2 className="setup-page-title" style={{marginBottom: 0}}>Test panels</h2>
        <button className="setup-btn-blue"><PlusIcon className="setup-icon" style={{width:'18px'}} /> Add new</button>
      </div>
      
      <div className="test-panels-help-block">
        <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
          <QuestionMarkCircleIcon style={{width:'20px'}} />
          <span>How to reorder?</span>
        </div>
        <ChevronDownIcon style={{width:'18px'}} />
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>ORDER</th>
            <th>NAME</th>
            <th>CATEGORY</th>
            <th>TESTS</th>
            <th>RATELIST ENTRIES</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.order} className="lab-hover-interactive">
              <td>
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem', color:'#6b7280'}}>
                  <ChevronUpDownIcon style={{width:'16px'}} /> {row.order}.
                </div>
              </td>
              <td style={{fontWeight:'500'}}>{row.name}</td>
              <td>{row.category}</td>
              <td style={{fontSize:'0.85rem'}}>{row.tests}</td>
              <td style={{fontSize:'0.85rem'}}>{row.ratelist}</td>
              <td>
                <div className="lab-actions-inline">
                  <button className="lab-link-btn"><PencilIcon className="lab-small-icon" /> Edit</button>
                  <button className="lab-link-btn" style={{marginLeft:'0.5rem'}}><EyeIcon className="lab-small-icon" /> View</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

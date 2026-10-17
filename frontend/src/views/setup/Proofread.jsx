import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PencilIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useDemoResource from '../../hooks/useDemoResource';

export default function Proofread() {
  const categories = [
    'Haematology', 'Biochemistry', 'Serology & Immunology',
    'Clinical Pathology', 'Cytology', 'Microbiology', 'Endocrinology', 'Histopathology', 'Others'
  ];

  const initialTestLibrary = {
    'Haematology': [
      {
        id: 'hb',
        name: 'Hemoglobin, Hb (g/dl)',
        ranges: [
          { gender: 'M/F', age: '0D - 21D', val: '17.0 - 23.0' },
          { gender: 'M/F', age: '21D - 10Y', val: '11.2 - 16.5' },
          { gender: 'M', age: '10Y - 120Y', val: '13.0 - 17.0' },
          { gender: 'F', age: '10Y - 120Y', val: '12.0 - 15.0' },
        ]
      },
      {
        id: 'tlc',
        name: 'Total Leukocyte Count, TLC (cumm)',
        ranges: [
          { gender: 'M/F', age: '0D - 14D', val: '9,000.0 - 30,000.0' },
          { gender: 'M/F', age: '15D - 2M', val: '5,000.0 - 21,000.0' },
          { gender: 'M/F', age: '2M - 6Y', val: '5,000.0 - 19,000.0' },
          { gender: 'M/F', age: '6Y - 120Y', val: '4,800.0 - 10,800.0' },
        ]
      },
      {
        id: 'plt',
        name: 'Platelet Count (lakhs/cumm)',
        ranges: [
          { gender: 'M/F', age: 'All ages', val: '1.50 - 4.50' },
        ]
      }
    ],
    'Biochemistry': [
      {
        id: 'fbs',
        name: 'Fasting Blood Sugar (mg/dL)',
        ranges: [
          { gender: 'M/F', age: 'Adults', val: '70.0 - 100.0' },
        ]
      },
      {
        id: 's_chol',
        name: 'Serum Cholesterol (mg/dL)',
        ranges: [
          { gender: 'M/F', age: 'Adults', val: '125.0 - 200.0' },
        ]
      }
    ]
  };

  const { data: testLibrary, update: setTestLibrary } = useDemoResource('labsetu_setup_proofread', initialTestLibrary);
  const [activeCategory, setActiveCategory] = useState('Haematology');
  const [editingTest, setEditingTest] = useState(null);
  const [notice, setNotice] = useState('');

  const currentTests = testLibrary[activeCategory] || [
    {
      id: `${activeCategory.toLowerCase()}_default`,
      name: `${activeCategory} Standard Parameter`,
      ranges: [{ gender: 'M/F', age: 'Adults', val: 'Refer to kit insert' }]
    }
  ];

  const handleSaveEdit = (e) => {
    e.preventDefault();
    const updatedCategoryTests = currentTests.map(t => t.id === editingTest.id ? editingTest : t);
    setTestLibrary({
      ...testLibrary,
      [activeCategory]: updatedCategoryTests
    });
    setEditingTest(null);
    setNotice(`Reference ranges for "${editingTest.name}" updated successfully.`);
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div>
      <h2 className="setup-page-title">Proofread & Reference Intervals</h2>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.75rem', borderRadius: '6px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Category Pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', overflowX: 'auto', whiteSpace: 'nowrap', paddingBottom: '0.5rem' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#374151' }}>Select category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '0.45rem 0.9rem',
              background: activeCategory === cat ? '#15803d' : '#f1f5f9',
              color: activeCategory === cat ? 'white' : '#475569',
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.85rem',
              fontWeight: activeCategory === cat ? '600' : '500',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1.5rem', border: '1px solid #fca5a5' }}>
        ⚠️ <strong>IMPORTANT:</strong> Verify and calibrate laboratory normal values according to your machine reagent inserts and local population metrics.
      </div>

      <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', color: '#1e293b' }}>
        {activeCategory} Tests & Reference Ranges
      </h3>

      {/* Test list */}
      <div style={{ display: 'grid', gap: '1rem' }}>
        {currentTests.map((test) => (
          <div key={test.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1.25rem', background: '#ffffff', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', color: '#0f172a', fontWeight: '600' }}>{test.name}</h4>
              <button
                onClick={() => setEditingTest(JSON.parse(JSON.stringify(test)))}
                className="lab-link-btn"
                style={{ fontSize: '0.85rem', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <PencilIcon className="lab-small-icon" style={{ width: '15px' }} /> Edit normal values
              </button>
            </div>

            <div style={{ paddingLeft: '1rem', borderLeft: '3px solid #10b981' }}>
              {test.ranges.map((r, idx) => (
                <div key={idx} style={{ marginBottom: idx === test.ranges.length - 1 ? 0 : '0.75rem' }}>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                    {r.gender} ({r.age})
                  </div>
                  <div style={{ fontSize: '0.95rem', color: '#1e293b', fontWeight: '500' }}>
                    {r.val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingTest && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '8px', padding: '1.5rem', width: '100%', maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Edit Reference Values: {editingTest.name}</h3>
              <button onClick={() => setEditingTest(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              {editingTest.ranges.map((range, index) => (
                <div key={index} style={{ marginBottom: '1rem', background: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Gender</label>
                      <input
                        type="text"
                        className="setup-input"
                        value={range.gender}
                        onChange={(e) => {
                          const updated = [...editingTest.ranges];
                          updated[index].gender = e.target.value;
                          setEditingTest({ ...editingTest, ranges: updated });
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Age Bracket</label>
                      <input
                        type="text"
                        className="setup-input"
                        value={range.age}
                        onChange={(e) => {
                          const updated = [...editingTest.ranges];
                          updated[index].age = e.target.value;
                          setEditingTest({ ...editingTest, ranges: updated });
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>Normal Interval / Values</label>
                    <input
                      type="text"
                      className="setup-input"
                      value={range.val}
                      onChange={(e) => {
                        const updated = [...editingTest.ranges];
                        updated[index].val = e.target.value;
                        setEditingTest({ ...editingTest, ranges: updated });
                      }}
                      required
                    />
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" onClick={() => setEditingTest(null)} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="setup-btn-blue">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

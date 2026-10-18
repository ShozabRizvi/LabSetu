import React, { useState } from 'react';
import './Patients.css';
import { MagnifyingGlassIcon, EyeIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Patients() {
  const initialPatients = [
    { id: '101', uhid: 'UHID-2026-8901', name: 'Ananya Sharma', phone: '9876501234', address: 'Gomti Nagar, Lucknow', registeredOn: '01/09/2026', age: 28, gender: 'Female', bloodGroup: 'B+' },
    { id: '102', uhid: 'UHID-2026-8902', name: 'Riya Sharma', phone: '9876543210', address: 'Indira Nagar, Lucknow', registeredOn: '04/09/2026', age: 34, gender: 'Female', bloodGroup: 'O+' },
    { id: '103', uhid: 'UHID-2026-8903', name: 'Aarav Singh', phone: '9812345678', address: 'Hazratganj, Lucknow', registeredOn: '07/09/2026', age: 42, gender: 'Male', bloodGroup: 'A+' },
    { id: '104', uhid: 'UHID-2026-8904', name: 'Meera Verma', phone: '9798765432', address: 'Alambagh, Lucknow', registeredOn: '09/09/2026', age: 56, gender: 'Female', bloodGroup: 'AB+' },
    { id: '105', uhid: 'UHID-2026-8905', name: 'Vikram Joshi', phone: '9845012345', address: 'Mahanagar, Lucknow', registeredOn: '11/09/2026', age: 31, gender: 'Male', bloodGroup: 'B-' }
  ];

  const [patients] = useState(initialPatients);
  const [filters, setFilters] = useState({ uhid: '', firstName: '', lastName: '', mobile: '', id: '' });
  const [activeFilters, setActiveFilters] = useState({ uhid: '', firstName: '', lastName: '', mobile: '', id: '' });
  const [selectedPatient, setSelectedPatient] = useState(null);

  const handleSearch = () => {
    setActiveFilters({ ...filters });
  };

  const handleClear = () => {
    const empty = { uhid: '', firstName: '', lastName: '', mobile: '', id: '' };
    setFilters(empty);
    setActiveFilters(empty);
  };

  const filtered = patients.filter(p => {
    if (activeFilters.uhid && !p.uhid.toLowerCase().includes(activeFilters.uhid.toLowerCase())) return false;
    if (activeFilters.firstName && !p.name.toLowerCase().includes(activeFilters.firstName.toLowerCase())) return false;
    if (activeFilters.lastName && !p.name.toLowerCase().includes(activeFilters.lastName.toLowerCase())) return false;
    if (activeFilters.mobile && !p.phone.includes(activeFilters.mobile)) return false;
    if (activeFilters.id && !p.id.includes(activeFilters.id)) return false;
    return true;
  });

  return (
    <div className="patients-container">
      <h2>Patients Directory & Master Registry</h2>
      
      <div className="patients-form">
        <div className="p-row">
          <div className="p-field">
            <label>UHID</label>
            <input 
              type="text" 
              placeholder="e.g. 8901" 
              value={filters.uhid} 
              onChange={e => setFilters({ ...filters, uhid: e.target.value })} 
            />
          </div>
          <div className="p-field">
            <label>First name</label>
            <input 
              type="text" 
              placeholder="First name" 
              value={filters.firstName} 
              onChange={e => setFilters({ ...filters, firstName: e.target.value })} 
            />
          </div>
          <div className="p-field">
            <label>Last name</label>
            <input 
              type="text" 
              placeholder="Last name" 
              value={filters.lastName} 
              onChange={e => setFilters({ ...filters, lastName: e.target.value })} 
            />
          </div>
          <div className="p-field">
            <label>Mobile number</label>
            <input 
              type="text" 
              placeholder="Mobile digits" 
              value={filters.mobile} 
              onChange={e => setFilters({ ...filters, mobile: e.target.value })} 
            />
          </div>
          <div className="p-field">
            <label>ID</label>
            <input 
              type="text" 
              placeholder="e.g. 101" 
              value={filters.id} 
              onChange={e => setFilters({ ...filters, id: e.target.value })} 
            />
          </div>
        </div>

        <div className="p-row p-date-row">
          <div className="p-actions" style={{ marginLeft: 0 }}>
            <button type="button" className="p-search-btn" onClick={handleSearch}>
              <MagnifyingGlassIcon className="p-icon" /> Search
            </button>
            <button type="button" className="p-clear-btn" onClick={handleClear}>
              Clear
            </button>
          </div>
        </div>
      </div>

      <table className="patients-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>UHID</th>
            <th>NAME</th>
            <th>MOBILE NUMBER</th>
            <th>ADDRESS</th>
            <th>REGISTERED ON</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                No patients match the search criteria.
              </td>
            </tr>
          ) : (
            filtered.map(p => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>{p.uhid}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.phone}</td>
                <td>{p.address}</td>
                <td>{p.registeredOn}</td>
                <td>
                  <button
                    type="button"
                    onClick={() => setSelectedPatient(p)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      fontSize: '0.75rem',
                      cursor: 'pointer'
                    }}
                  >
                    <EyeIcon style={{ width: '14px' }} /> View Profile
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Patient Profile Modal */}
      {selectedPatient && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setSelectedPatient(null)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '480px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserCircleIcon style={{ width: '28px', color: '#15803d' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{selectedPatient.name}</h3>
              </div>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.85rem' }}>
              <div><span>UHID:</span> <strong style={{ color: '#15803d' }}>{selectedPatient.uhid}</strong></div>
              <div><span>Mobile Number:</span> <strong>{selectedPatient.phone}</strong></div>
              <div><span>Demographics:</span> {selectedPatient.age} Yrs · {selectedPatient.gender} · Blood Group: <strong>{selectedPatient.bloodGroup}</strong></div>
              <div><span>Address:</span> {selectedPatient.address}</div>
              <div><span>Registered On:</span> {selectedPatient.registeredOn}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
              <button type="button" onClick={() => setSelectedPatient(null)} style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

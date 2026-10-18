import React, { useState } from 'react';
import '../lab/LabShared.css';
import { PlusIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';

export default function EmployeeLogin() {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Jane Doe', role: 'Receptionist', lastLogin: '13/09/2026 09:00 AM' },
    { id: 2, name: 'Mark Evans', role: 'Lab Technician', lastLogin: '13/09/2026 08:45 AM' },
    { id: 3, name: 'Anna Lee', role: 'Manager', lastLogin: '12/09/2026 18:30 PM' }
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [form, setForm] = useState({ name: '', role: 'Receptionist' });

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setForm({ name: '', role: 'Receptionist' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setForm({ name: emp.name, role: emp.role });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEmp) {
      setEmployees(employees.map(emp => emp.id === editingEmp.id ? { ...emp, name: form.name, role: form.role } : emp));
    } else {
      const newEmp = {
        id: Date.now(),
        name: form.name,
        role: form.role,
        lastLogin: 'Never'
      };
      setEmployees([...employees, newEmp]);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="lab-view-container">
      <div className="lab-header-row" style={{justifyContent: 'space-between'}}>
        <h2>Employee login & staff access</h2>
        <button type="button" className="lab-btn lab-btn-blue" onClick={handleOpenAdd}>
          <PlusIcon className="lab-btn-icon"/> Add employee
        </button>
      </div>

      <table className="lab-data-table">
        <thead>
          <tr>
            <th>EMPLOYEE NAME</th>
            <th>ROLE</th>
            <th>LAST LOGIN</th>
            <th>ACTION</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="lab-hover-interactive">
              <td><strong>{emp.name}</strong></td>
              <td>{emp.role}</td>
              <td>{emp.lastLogin}</td>
              <td>
                <button 
                  type="button" 
                  className="lab-link-btn"
                  onClick={() => handleOpenEdit(emp)}
                >
                  <PencilIcon className="lab-small-icon"/> Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }} onClick={() => setIsModalOpen(false)}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', maxWidth: '440px', width: '100%', padding: '1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>{editingEmp ? 'Edit Employee Details' : 'Add Employee Account'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Staff Member Name</label>
                <input required type="text" placeholder="e.g. Jane Doe" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '500' }}>Staff Role</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '6px', boxSizing: 'border-box' }}>
                  <option>Receptionist</option>
                  <option>Lab Technician</option>
                  <option>Phlebotomist</option>
                  <option>Manager</option>
                  <option>Accountant</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.55rem 1rem', borderRadius: '6px', border: 'none', background: '#15803d', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Save Employee</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

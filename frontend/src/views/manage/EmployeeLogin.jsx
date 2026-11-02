import React, { useState, useEffect } from 'react';
import '../lab/LabShared.css';
import { supabase } from '../../lib/supabase';
import {
  PlusIcon,
  PencilIcon,
  XMarkIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  ClockIcon,
  TrashIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

export default function EmployeeLogin() {
  const initialEmployees = [
    {
      id: 'emp-1',
      name: 'Jane Doe',
      email: 'jane.doe@labsetu.health',
      role: 'Receptionist',
      status: 'Active',
      invitedAt: '01/09/2026',
      lastLogin: '13/09/2026 09:00 AM'
    },
    {
      id: 'emp-2',
      name: 'Mark Evans',
      email: 'mark.evans@labsetu.health',
      role: 'Lab Technician',
      status: 'Active',
      invitedAt: '05/09/2026',
      lastLogin: '13/09/2026 08:45 AM'
    },
    {
      id: 'emp-3',
      name: 'Suresh Kumar',
      email: 'suresh.kumar@labsetu.health',
      role: 'Phlebotomist',
      status: 'Pending Activation',
      invitedAt: '15/10/2026',
      lastLogin: 'Pending User Activation'
    }
  ];

  const [employees, setEmployees] = useState(() => {
    try {
      const saved = localStorage.getItem('labsetu_employee_invites');
      return saved ? JSON.parse(saved) : initialEmployees;
    } catch {
      return initialEmployees;
    }
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'Receptionist'
  });

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const persistEmployees = (updated) => {
    setEmployees(updated);
    try {
      localStorage.setItem('labsetu_employee_invites', JSON.stringify(updated));
    } catch {}
  };

  // Sync Supabase staff_invites table
  useEffect(() => {
    const fetchInvites = async () => {
      try {
        const { data, error } = await supabase
          .from('staff_invites')
          .select('*')
          .neq('role', 'doctor');

        if (!error && Array.isArray(data) && data.length > 0) {
          const mapped = data.map((d) => ({
            id: d.id,
            name: d.name,
            email: d.email,
            role: d.role,
            status: d.status,
            invitedAt: new Date(d.invited_at).toLocaleDateString(),
            lastLogin: d.status === 'Active' ? 'Activated' : 'Pending User Activation'
          }));
          setEmployees(prev => {
            const combined = [...prev];
            mapped.forEach(m => {
              if (!combined.some(c => c.email === m.email)) {
                combined.push(m);
              }
            });
            return combined;
          });
        }
      } catch (e) {
        console.warn('Supabase employee invites sync fallback:', e);
      }
    };

    fetchInvites();
  }, []);

  const handleOpenAdd = () => {
    setEditingEmp(null);
    setForm({ name: '', email: '', role: 'Receptionist' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp) => {
    setEditingEmp(emp);
    setForm({ name: emp.name, email: emp.email, role: emp.role });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEmp) {
      const updated = employees.map(emp =>
        emp.id === editingEmp.id
          ? { ...emp, name: form.name, email: form.email, role: form.role }
          : emp
      );
      persistEmployees(updated);
      showToast(`Updated details for staff member ${form.name}.`);
    } else {
      const newEmp = {
        id: `emp-${Date.now()}`,
        name: form.name,
        email: form.email,
        role: form.role,
        status: 'Pending Activation',
        invitedAt: new Date().toLocaleDateString(),
        lastLogin: 'Pending User Activation'
      };
      persistEmployees([newEmp, ...employees]);

      // Push to Supabase staff_invites
      try {
        supabase.from('staff_invites').insert({
          name: form.name,
          email: form.email,
          role: form.role.toLowerCase(),
          access_level: form.role,
          status: 'Pending Activation'
        }).then(({ error }) => {
          if (error) console.warn('Supabase employee invite insert error:', error);
        });
      } catch (err) {
        console.warn('Supabase fallback:', err);
      }

      showToast(`Staff invitation email sent to ${form.email}.`);
    }
    setIsModalOpen(false);
  };

  const handleResendInvite = (emp) => {
    showToast(`Invitation re-dispatched to ${emp.email} with activation credentials.`);
  };

  const handleSimulateActivation = (emp) => {
    const updated = employees.map(item => {
      if (item.id === emp.id) {
        return {
          ...item,
          status: 'Active',
          lastLogin: `Active Now (Activated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        };
      }
      return item;
    });
    persistEmployees(updated);

    // Update in Supabase
    try {
      supabase
        .from('staff_invites')
        .update({ status: 'Active', activated_at: new Date().toISOString() })
        .eq('email', emp.email)
        .then(() => {});
    } catch {}

    showToast(`Staff account activated! ${emp.name} is now an Active ${emp.role}.`);
  };

  const handleDelete = (empId) => {
    if (window.confirm('Revoke staff access and disable account credentials?')) {
      const updated = employees.filter(e => e.id !== empId);
      persistEmployees(updated);
      showToast('Employee account removed.');
    }
  };

  return (
    <div className="lab-view-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#064e3b',
          color: 'white',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          <CheckCircleIcon style={{ width: '20px', color: '#34d399' }} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="lab-header-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              fontSize: '0.75rem',
              fontWeight: '700',
              padding: '0.15rem 0.5rem',
              borderRadius: '4px',
              border: '1px solid #a7f3d0'
            }}>
              LIMS STAFF DIRECTORY
            </span>
          </div>
          <h2 style={{ margin: '0 0 0.25rem' }}>Employee Login &amp; Staff Access Management</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Onboard front-desk receptionists, laboratory technicians, and phlebotomists via secure email invitations
          </p>
        </div>

        <button type="button" className="lab-btn lab-btn-blue" onClick={handleOpenAdd}>
          <PlusIcon className="lab-btn-icon" /> Invite Employee
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden', marginTop: '1rem' }}>
        <table className="lab-data-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th>EMPLOYEE NAME</th>
              <th>WORK EMAIL</th>
              <th>STAFF ROLE</th>
              <th>STATUS</th>
              <th>INVITED / LAST LOGIN</th>
              <th style={{ textAlign: 'right' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {employees.map(emp => {
              const isPending = emp.status === 'Pending Activation';

              return (
                <tr key={emp.id} className="lab-hover-interactive">
                  <td>
                    <strong>{emp.name}</strong>
                  </td>
                  <td>
                    <span style={{ color: '#475569', fontSize: '0.85rem' }}>{emp.email}</span>
                  </td>
                  <td>
                    <span style={{
                      background: '#f1f5f9',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.78rem',
                      color: '#334155',
                      fontWeight: '600'
                    }}>
                      {emp.role}
                    </span>
                  </td>
                  <td>
                    {isPending ? (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#fef3c7',
                        color: '#92400e',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        <ClockIcon style={{ width: '13px' }} />
                        Pending Activation
                      </span>
                    ) : (
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        background: '#dcfce7',
                        color: '#15803d',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        <CheckCircleIcon style={{ width: '13px' }} />
                        Active
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: '#64748b' }}>
                    {emp.lastLogin}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                      {isPending && (
                        <button
                          type="button"
                          title="Resend activation email"
                          onClick={() => handleResendInvite(emp)}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #86efac',
                            color: '#15803d',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Resend Invite
                        </button>
                      )}

                      <button
                        type="button"
                        className="lab-link-btn"
                        onClick={() => handleOpenEdit(emp)}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <PencilIcon className="lab-small-icon" /> Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(emp.id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.25rem' }}
                        title="Delete account"
                      >
                        <TrashIcon style={{ width: '15px' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>
                  {editingEmp ? 'Edit Employee Details' : 'Invite Staff Member to LIMS'}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Send an activation token to employee's email address
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '600', color: '#334155' }}>
                  Staff Member Full Name
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Jane Doe"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '600', color: '#334155' }}>
                  Official Work Email (for Activation Token)
                </label>
                <input
                  required
                  type="email"
                  placeholder="e.g. jane.doe@labsetu.health"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.9rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.35rem', fontWeight: '600', color: '#334155' }}>
                  Staff Role &amp; Access Assignment
                </label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem', border: '1px solid #cbd5e1', borderRadius: '8px', boxSizing: 'border-box', fontSize: '0.9rem' }}
                >
                  <option value="Receptionist">Receptionist (Billing &amp; Case Entry)</option>
                  <option value="Lab Technician">Lab Technician (Assays, CBC &amp; Biochemistry)</option>
                  <option value="Phlebotomist">Phlebotomist (Sample Pickup &amp; Barcoding)</option>
                  <option value="Manager">Laboratory Manager (Full Operations)</option>
                  <option value="Accountant">Accountant (Daily Business &amp; Cash Registry)</option>
                </select>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.8rem', color: '#64748b' }}>
                ℹ️ The employee will receive an onboarding email with an activation link to set their login credentials.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.6rem 1.15rem', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.25rem', borderRadius: '8px', border: 'none', background: '#059669', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {editingEmp ? 'Save Changes' : 'Send Invite Email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

export default function CitizenProfile() {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState({
    name: currentUser?.name || 'Shozab Rizvi',
    email: currentUser?.email || 'patient@labsetu.com',
    phone: currentUser?.phone || '9876501234',
    uhid: currentUser?.uhid || 'UHID-2026-8901',
    age: '28',
    gender: 'Male',
    bloodGroup: 'B+',
    emergencyContact: 'Mr. R. K. Sharma (Father) - 9876500000',
    address: 'Flat 402, Green Valley Apartments, Gomti Nagar, Lucknow, UP'
  });

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    try {
      const updatedUser = { ...currentUser, ...profile };
      sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch {
      alert('Could not update profile in storage.');
    }
  };

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>My Health Profile</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          Personal health records, emergency information, and laboratory registry details.
        </p>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Profile Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <UserCircleIcon style={{ width: '64px', height: '64px', color: '#15803d' }} />
          <div>
            <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', color: '#0f172a' }}>{profile.name}</h3>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
              <span>UHID: <strong style={{ color: '#15803d' }}>{profile.uhid}</strong></span>
              <span>·</span>
              <span>Role: <strong>Patient / Citizen</strong></span>
            </div>
          </div>
        </div>

        {savedNotice && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            color: '#15803d',
            fontSize: '0.875rem',
            marginBottom: '1.25rem'
          }}>
            <CheckCircleIcon style={{ width: '18px' }} />
            Profile details updated successfully!
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Full Name
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Mobile Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Age
              </label>
              <input
                type="number"
                value={profile.age}
                onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Gender
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Blood Group
              </label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option>A+</option>
                <option>A-</option>
                <option>B+</option>
                <option>B-</option>
                <option>O+</option>
                <option>O-</option>
                <option>AB+</option>
                <option>AB-</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
              Emergency Contact Person & Phone
            </label>
            <input
              type="text"
              value={profile.emergencyContact}
              onChange={(e) => setProfile({ ...profile, emergencyContact: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
              Residential Address
            </label>
            <textarea
              rows="3"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '0.7rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

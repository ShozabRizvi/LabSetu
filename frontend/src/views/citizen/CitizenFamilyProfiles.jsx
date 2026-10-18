import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import useDemoResource from '../../hooks/useDemoResource';
import {
  UserGroupIcon,
  UserPlusIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenFamilyProfiles({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const defaultMembers = [
    {
      id: 'fam-1',
      name: 'Ramesh Sharma',
      relation: 'Self',
      age: '42 yrs',
      gender: 'Male',
      bloodGroup: 'B+',
      uhid: 'UHID-2026-8901',
      activeProfile: true
    },
    {
      id: 'fam-2',
      name: 'Sunita Sharma',
      relation: 'Spouse',
      age: '38 yrs',
      gender: 'Female',
      bloodGroup: 'O+',
      uhid: 'UHID-2026-9214',
      activeProfile: false
    },
    {
      id: 'fam-3',
      name: 'Dev Sharma',
      relation: 'Child (Son)',
      age: '12 yrs',
      gender: 'Male',
      bloodGroup: 'B+',
      uhid: 'UHID-2026-9480',
      activeProfile: false
    },
    {
      id: 'fam-4',
      name: 'Om Prakash Sharma',
      relation: 'Parent (Father)',
      age: '71 yrs',
      gender: 'Male',
      bloodGroup: 'B+',
      uhid: 'UHID-2026-7812',
      activeProfile: false
    }
  ];

  const { data: members, update: setMembers } = useDemoResource('labsetu_family_members', defaultMembers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState({
    name: '',
    relation: 'Parent',
    age: '',
    gender: 'Male',
    bloodGroup: 'A+'
  });

  const setActiveMember = (id) => {
    const updated = (members || []).map(m => ({
      ...m,
      activeProfile: m.id === id
    }));
    setMembers(updated);
    const selected = updated.find(m => m.id === id);
    setNotice(lang === 'hi' 
      ? `सक्रिय प्रोफ़ाइल बदली गई: ${selected?.name} (${selected?.relation})` 
      : `Switched active dashboard profile to: ${selected?.name} (${selected?.relation})`);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleAddMember = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const created = {
      id: `fam-${Date.now().toString().slice(-4)}`,
      name: form.name.trim(),
      relation: form.relation,
      age: `${form.age || '30'} yrs`,
      gender: form.gender,
      bloodGroup: form.bloodGroup,
      uhid: `UHID-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      activeProfile: false
    };
    setMembers([...(members || []), created]);
    setIsModalOpen(false);
    setForm({ name: '', relation: 'Parent', age: '', gender: 'Male', bloodGroup: 'A+' });
    setNotice(lang === 'hi' ? `${created.name} का प्रोफ़ाइल जोड़ा गया।` : `Family member ${created.name} added successfully.`);
    setTimeout(() => setNotice(''), 3500);
  };

  const handleDelete = (id) => {
    setMembers((members || []).filter(m => m.id !== id));
    setNotice(lang === 'hi' ? 'प्रोफ़ाइल हटा दी गई।' : 'Family member removed.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserGroupIcon style={{ width: '26px', color: '#15803d' }} />
            {lang === 'hi' ? 'पारिवारिक प्रोफ़ाइल (फैमिली हेल्थ रिकॉर्ड्स)' : 'Family Profiles & Dependent Health Records'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi'
              ? 'एक ही खाते से अपने माता-पिता, जीवनसाथी और बच्चों के मेडिकल टेस्ट और रिपोर्ट प्रबंधित करें'
              : 'Manage diagnostic bookings, history, and test reports for parents, spouse, and children in one account'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <UserPlusIcon style={{ width: '18px' }} />
          {lang === 'hi' ? 'नया सदस्य जोड़ें' : 'Add Family Member'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Profiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {(members || []).map((m) => (
          <div
            key={m.id}
            style={{
              background: 'white',
              border: m.activeProfile ? '2px solid #15803d' : '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              position: 'relative',
              boxShadow: m.activeProfile ? '0 4px 12px rgba(21, 128, 61, 0.12)' : '0 1px 3px rgba(0,0,0,0.03)'
            }}
          >
            {m.activeProfile && (
              <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                ✓ Active Profile
              </span>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: m.activeProfile ? '#dcfce7' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCircleIcon style={{ width: '32px', color: m.activeProfile ? '#15803d' : '#64748b' }} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a' }}>{m.name}</h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                  {m.relation} · {m.gender} ({m.age})
                </span>
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ color: '#64748b' }}>UHID Number:</span>
                <strong>{m.uhid}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Blood Group:</span>
                <strong style={{ color: '#dc2626' }}>{m.bloodGroup}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {!m.activeProfile ? (
                <button
                  onClick={() => setActiveMember(m.id)}
                  style={{ background: 'white', border: '1px solid #15803d', color: '#15803d', padding: '0.4rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                >
                  {lang === 'hi' ? 'इस प्रोफ़ाइल पर स्विच करें' : 'Switch to Profile'}
                </button>
              ) : (
                <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '600' }}>Currently Viewing</span>
              )}

              {m.relation !== 'Self' && (
                <button
                  onClick={() => handleDelete(m.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.4rem' }}
                  title="Remove Profile"
                >
                  <TrashIcon style={{ width: '18px' }} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Member Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '1.75rem', width: '100%', maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Add Family Dependent Member</h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Relationship
                  </label>
                  <select
                    value={form.relation}
                    onChange={(e) => setForm({ ...form, relation: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="Parent (Mother)">Parent (Mother)</option>
                    <option value="Parent (Father)">Parent (Father)</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Child (Son)">Child (Son)</option>
                    <option value="Child (Daughter)">Child (Daughter)</option>
                    <option value="Sibling">Sibling</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 65"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Gender
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    Blood Group
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', background: 'white', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Member Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

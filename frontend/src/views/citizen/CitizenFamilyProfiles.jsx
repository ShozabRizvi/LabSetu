import React, { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  UserGroupIcon,
  UserPlusIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenFamilyProfiles({ lang: propLang }) {
  const { lang: contextLang, t } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const { currentUser, activeUHID, switchActiveProfile } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [pendingDeleteMember, setPendingDeleteMember] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notice, setNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: '',
    relation: 'Spouse',
    age: '',
    gender: 'Female',
    bloodGroup: 'B+'
  });

  // Modal scrolling locks
  useEffect(() => {
    if (isAddModalOpen || pendingDeleteMember) {
      const original = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = original || '';
      };
    }
  }, [isAddModalOpen, pendingDeleteMember]);

  // Fetch family profiles & dependents from Supabase
  const fetchFamilyMembers = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      const primaryUserId = (currentUser?.id && typeof currentUser.id === 'string' && currentUser.id.includes('-'))
        ? currentUser.id
        : (sessionUserId || currentUser?.id || null);

      // 1. Fetch Primary User Profile for the "Self" Card from profiles & patients
      let profileRow = null;
      let patientSelfRow = null;

      if (primaryUserId) {
        try {
          const { data: pData } = await supabase.from('profiles').select('*').eq('id', primaryUserId).maybeSingle();
          if (pData) profileRow = pData;
        } catch {}

        try {
          const { data: ptData } = await supabase.from('patients').select('*').eq('id', primaryUserId).maybeSingle();
          if (ptData) patientSelfRow = ptData;
        } catch {}
      }

      const selfCard = {
        id: primaryUserId || 'self',
        name: profileRow?.full_name || patientSelfRow?.full_name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : 'Patient'),
        relation: 'Self',
        age: patientSelfRow?.age_years !== null && patientSelfRow?.age_years !== undefined
          ? `${patientSelfRow.age_years} yrs`
          : (currentUser?.age ? `${currentUser.age} yrs` : '—'),
        gender: patientSelfRow?.sex
          ? (patientSelfRow.sex.charAt(0).toUpperCase() + patientSelfRow.sex.slice(1))
          : (currentUser?.gender || '—'),
        bloodGroup: patientSelfRow?.blood_group || currentUser?.bloodGroup || '—',
        uhid: patientSelfRow?.patient_code || currentUser?.uhid || '—',
        isSelf: true
      };

      // 2. Query Supabase for family members / dependents
      let fetchedDependents = [];

      // Query patients table where emergency_contact = primaryUserId
      try {
        const { data: patData } = await supabase
          .from('patients')
          .select('*')
          .eq('emergency_contact', primaryUserId);
        if (Array.isArray(patData) && patData.length > 0) {
          fetchedDependents = patData.map(p => {
            let rel = 'Family Member';
            try {
              if (p.notes) {
                const parsed = JSON.parse(p.notes);
                if (parsed.relation) rel = parsed.relation;
              }
            } catch {}
            return {
              id: p.id,
              name: p.full_name,
              relation: rel,
              age: p.age_years ? `${p.age_years} yrs` : '35 yrs',
              gender: p.sex ? (p.sex.charAt(0).toUpperCase() + p.sex.slice(1)) : 'Other',
              bloodGroup: p.blood_group || 'O+',
              uhid: p.patient_code || ('DEP-' + Math.floor(Math.random() * 90000 + 10000)),
              isSelf: false
            };
          });
        }
      } catch {}

      // D: Check local cache for newly added members if remote returned empty
      if (fetchedDependents.length === 0) {
        try {
          const cached = localStorage.getItem('labsetu_family_members');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Ensure dependent cards never inherit parent UHID and filter out stale mock names
              fetchedDependents = parsed
                .filter(m => m.relation !== 'Self' && !['Dev', 'Sunita', 'Om Prakash'].includes(m.name))
                .map(m => ({
                  ...m,
                  uhid: (m.uhid && m.uhid !== selfCard.uhid && m.uhid !== currentUser?.uhid)
                    ? m.uhid
                    : ('DEP-' + Math.floor(Math.random() * 90000 + 10000))
                }));
            }
          }
        } catch {}
      }

      const combined = [selfCard, ...fetchedDependents];
      setMembers(combined);
      try {
        localStorage.setItem('labsetu_family_members', JSON.stringify(combined));
      } catch {}
    } catch (err) {
      console.warn('[CitizenFamilyProfiles] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  // Switch Active Profile (Updates global context activeUHID)
  const handleSwitchProfile = (member) => {
    switchActiveProfile(member);
    const msg = lang === 'hi'
      ? `सक्रिय प्रोफ़ाइल बदली गई: ${member.name} (${member.relation})`
      : `Switched active dashboard profile to: ${member.name} (${member.relation})`;
    setNotice(msg);
    setTimeout(() => setNotice(''), 3500);
  };

  // Add Member Modal Submit (INSERT to Supabase & local state update)
  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      setIsSubmitting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUserId = sessionData?.session?.user?.id;
      const primaryUserId = (currentUser?.id && typeof currentUser.id === 'string' && currentUser.id.includes('-'))
        ? currentUser.id
        : (sessionUserId || currentUser?.id || 'primary');

      const assignedUhid = 'DEP-' + Math.floor(Math.random() * 90000 + 10000);
      const memberUuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : 'fam-' + Math.random().toString(36).substring(2, 9);

      const parsedAge = form.age ? parseInt(form.age, 10) : 30;

      const newMember = {
        id: memberUuid,
        primary_user_id: primaryUserId,
        full_name: form.name.trim(),
        name: form.name.trim(),
        relation: form.relation,
        age: `${parsedAge} yrs`,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        blood_group: form.bloodGroup,
        uhid: assignedUhid,
        isSelf: false
      };

      // 1. Sync to Supabase patients table (family dependent with primaryUserId reference)
      try {
        await supabase.from('patients').insert({
          id: memberUuid,
          center_id: 'cb17e71d-cb76-49e6-a202-4a82c94de5d8',
          patient_code: assignedUhid,
          full_name: newMember.name,
          age_years: parsedAge,
          sex: newMember.gender.toLowerCase(),
          blood_group: newMember.bloodGroup,
          emergency_contact: primaryUserId,
          notes: JSON.stringify({ relation: newMember.relation, primary_user_id: primaryUserId }),
          is_active: true
        });
      } catch (err) {
        console.warn('Patient table insert note:', err);
      }

      // 4. Update local React state instantly so new card appears without refresh
      setMembers(prev => {
        const next = [...prev, newMember];
        try {
          localStorage.setItem('labsetu_family_members', JSON.stringify(next));
        } catch {}
        return next;
      });

      setIsAddModalOpen(false);
      setForm({ name: '', relation: 'Spouse', age: '', gender: 'Female', bloodGroup: 'B+' });
      setNotice(lang === 'hi' ? `${newMember.name} का प्रोफ़ाइल जोड़ा गया।` : `Family member ${newMember.name} added successfully.`);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.warn('Add member error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Handler (DELETE from Supabase)
  const confirmDelete = async () => {
    if (!pendingDeleteMember) return;
    const memberToDelete = pendingDeleteMember;

    try {
      setIsDeleting(true);

      // 1. DELETE from patients table
      try {
        await supabase.from('patients').delete().eq('id', memberToDelete.id);
      } catch {}

      // 2. Remove from local state
      setMembers(prev => {
        const next = prev.filter(m => m.id !== memberToDelete.id);
        try {
          localStorage.setItem('labsetu_family_members', JSON.stringify(next));
        } catch {}
        return next;
      });

      // 3. If currently viewing this deleted profile, switch back to Self
      if (activeUHID === memberToDelete.uhid) {
        const selfMember = members.find(m => m.isSelf);
        if (selfMember) {
          switchActiveProfile(selfMember);
        }
      }

      setNotice(lang === 'hi' ? `${memberToDelete.name} की प्रोफ़ाइल हटा दी गई।` : `Family profile for ${memberToDelete.name} removed.`);
      setTimeout(() => setNotice(''), 3500);
    } catch (err) {
      console.warn('Delete profile error:', err);
    } finally {
      setIsDeleting(false);
      setPendingDeleteMember(null);
    }
  };

  return (
    <div className="citizen-page">
      <div className="citizen-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="citizen-page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UserGroupIcon style={{ width: '26px', color: '#15803d' }} />
            {t('family.pageTitle')}
          </h1>
          <p className="citizen-page-subtitle">
            {t('family.subtitle')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.5rem 1rem',
            borderRadius: '0.5rem',
            border: 'none',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            cursor: 'pointer',
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <UserPlusIcon className="w-5 h-5" style={{ width: '20px', height: '20px' }} />
          <span>{t('family.add')}</span>
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac' }}>
          ✓ {notice}
        </div>
      )}

      {/* Profiles Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        {members.map((member) => {
          const isActive = (member.uhid === activeUHID) || (member.isSelf && !activeUHID);

          return (
            <div
              key={member.id || member.uhid}
              className={`hover:shadow-md transition-shadow duration-200 bg-white rounded-xl p-4 ${
                isActive ? 'border-2 border-emerald-500 bg-emerald-50/20' : 'border border-gray-200'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(236, 253, 245, 0.45)' : '#ffffff',
                border: isActive ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '0.75rem',
                padding: '1.25rem',
                position: 'relative',
                boxShadow: isActive ? '0 4px 14px rgba(16, 185, 129, 0.16)' : '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'box-shadow 200ms ease, border-color 200ms ease, background-color 200ms ease'
              }}
            >
              {isActive && (
                <span
                  className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: '#dcfce7',
                    color: '#15803d',
                    fontSize: '0.75rem',
                    fontWeight: '700',
                    padding: '0.2rem 0.65rem',
                    borderRadius: '20px'
                  }}
                >
                  ✓ Active Profile
                </span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: isActive ? '#dcfce7' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <UserCircleIcon style={{ width: '32px', height: '32px', color: isActive ? '#15803d' : '#64748b' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                    {member.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
                    {member.relation} · {member.gender} ({member.age})
                  </span>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ color: '#64748b' }}>UHID Number:</span>
                  <strong style={{ fontFamily: 'monospace', color: '#0f172a' }}>{member.uhid}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Blood Group:</span>
                  <strong style={{ color: '#dc2626' }}>{member.bloodGroup}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.25rem' }}>
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => handleSwitchProfile(member)}
                    className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 font-medium rounded-lg text-xs px-3 py-1.5 transition-colors cursor-pointer"
                    style={{
                      background: '#ffffff',
                      border: '1.5px solid #15803d',
                      color: '#15803d',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '6px',
                      fontSize: '0.825rem',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {lang === 'hi' ? 'इस प्रोफ़ाइल पर स्विच करें' : 'Switch to Profile'}
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#15803d', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <ShieldCheckIcon style={{ width: '16px', height: '16px' }} />
                    {lang === 'hi' ? 'वर्तमान में सक्रिय' : 'Currently Viewing'}
                  </span>
                )}

                {!member.isSelf && (
                  <button
                    type="button"
                    onClick={() => setPendingDeleteMember(member)}
                    className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '0.4rem',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Remove Profile"
                    aria-label={`Remove profile for ${member.name}`}
                  >
                    <TrashIcon style={{ width: '18px', height: '18px' }} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Add Member Modal */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '32rem',
              padding: '1.5rem',
              overflow: 'hidden',
              boxSizing: 'border-box'
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-modal-title"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem' }}>
              <h3 id="add-member-modal-title" style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                {lang === 'hi' ? 'परिवार का नया सदस्य जोड़ें' : 'Add Family Dependent Member'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
                aria-label="Close dialog"
              >
                <XMarkIcon style={{ width: '20px', height: '20px' }} />
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {t('profile.fullName')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priya Sharma"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {lang === 'hi' ? 'संबंध' : 'Relationship'}
                  </label>
                  <select
                    value={form.relation}
                    onChange={(e) => setForm({ ...form, relation: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Child (Son)">Child (Son)</option>
                    <option value="Child (Daughter)">Child (Daughter)</option>
                    <option value="Parent (Mother)">Parent (Mother)</option>
                    <option value="Parent (Father)">Parent (Father)</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {t('profile.age')}
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 35"
                    min="1"
                    max="120"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {t('profile.gender')}
                  </label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {t('profile.bloodGroup')}
                  </label>
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    style={{ width: '100%', padding: '0.625rem 0.75rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.875rem', boxSizing: 'border-box' }}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-600 hover:bg-gray-100 text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                  style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                  style={{
                    backgroundColor: '#059669',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.5rem 1.15rem',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmitting ? t('common.loading') : (lang === 'hi' ? 'सदस्य प्रोफ़ाइल सहेजें' : 'Save Member Profile')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Delete Protection) */}
      {pendingDeleteMember && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isDeleting) setPendingDeleteMember(null);
          }}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 overflow-hidden"
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              width: '100%',
              maxWidth: '28rem',
              padding: '1.5rem',
              boxSizing: 'border-box'
            }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
                flexShrink: 0
              }}>
                <ExclamationTriangleIcon style={{ width: '22px', height: '22px' }} />
              </div>
              <div>
                <h3 id="delete-dialog-title" style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                  {lang === 'hi' ? 'प्रोफ़ाइल हटाना चाहते हैं?' : 'Remove Family Profile?'}
                </h3>
              </div>
            </div>

            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
              {lang === 'hi'
                ? `क्या आप वाकई ${pendingDeleteMember.name} (${pendingDeleteMember.relation}) की प्रोफ़ाइल हटाना चाहते हैं?`
                : `Are you sure you want to remove ${pendingDeleteMember.name} (${pendingDeleteMember.relation})? This will detach their dependent medical records.`}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setPendingDeleteMember(null)}
                className="text-gray-600 hover:bg-gray-100 text-sm font-medium py-2 px-4 rounded-lg transition-colors cursor-pointer"
                style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer' }}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.5rem 1.15rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: isDeleting ? 'not-allowed' : 'pointer'
                }}
              >
                {isDeleting ? t('common.loading') : (lang === 'hi' ? 'हटाएं' : 'Confirm Remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

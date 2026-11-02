import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { PRESET_SECURITY_QUESTIONS } from '../../services/authService';
import {
  UserCircleIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  IdentificationIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function CitizenProfile() {
  const { currentUser, updateCurrentUser } = useAuth();
  const { t, lang } = useTranslation();

  // All states initialized to empty strings / null - strictly mapped to authenticated user
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    uhid: '',
    age: '',
    gender: '',
    bloodGroup: '',
    emergencyContact: '',
    address: '',
    securityQuestion: 'What is your childhood nickname?',
    securityAnswer: ''
  });
  const [loading, setLoading] = useState(true);

  const isProfileIncomplete = !profile.name?.trim() || !profile.phone?.trim() || !profile.address?.trim();
  const [isToastDismissed, setIsToastDismissed] = useState(false);

  // Auto-hide popup after 5000ms
  useEffect(() => {
    if (isProfileIncomplete && !loading) {
      setIsToastDismissed(false);
      const timer = setTimeout(() => {
        setIsToastDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isProfileIncomplete, loading]);

  const saveButtonRef = useRef(null);

  const scrollToSave = () => {
    saveButtonRef.current?.scrollIntoView({ behavior: 'smooth' });
    saveButtonRef.current?.focus();
  };

  // On Load (Hydration): SELECT directly from profiles & patients strictly for session user.id
  useEffect(() => {
    let isMounted = true;
    async function hydrateProfileFromDb() {
      try {
        setLoading(true);
        // Grab current authenticated session user.id
        const { data: sessionData } = await supabase.auth.getSession();
        const sessionUser = sessionData?.session?.user;
        const currentUserId = sessionUser?.id || currentUser?.id || null;
        const currentUserEmail = sessionUser?.email || currentUser?.email || null;

        let profileRow = null;
        let patientRow = null;

        // 1. SELECT from profiles table strictly for authenticated user (never by email)
        if (currentUserId && typeof currentUserId === 'string' && currentUserId.includes('-')) {
          const { data } = await supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle();
          if (data) profileRow = data;
        }

        // 2. SELECT from patients table for clinical demographics strictly for authenticated user (never by email)
        if (currentUserId && typeof currentUserId === 'string' && currentUserId.includes('-')) {
          const { data } = await supabase.from('patients').select('*').eq('id', currentUserId).maybeSingle();
          if (data) patientRow = data;
        }

        if (isMounted) {
          const loadedName = profileRow?.full_name || patientRow?.full_name || sessionUser?.user_metadata?.full_name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : '');
          const loadedEmail = profileRow?.email || patientRow?.email || currentUserEmail || '';
          const loadedPhone = profileRow?.phone || patientRow?.phone || currentUser?.phone || '';
          const loadedUhid = patientRow?.patient_code || profileRow?.uhid || currentUser?.uhid || '';
          const loadedAddress = patientRow?.address || currentUser?.address || '';
          const loadedBloodGroup = patientRow?.blood_group || currentUser?.bloodGroup || '';
          const loadedGender = patientRow?.sex ? (patientRow.sex.charAt(0).toUpperCase() + patientRow.sex.slice(1)) : (currentUser?.gender || '');
          const loadedAge = patientRow?.age_years !== null && patientRow?.age_years !== undefined ? String(patientRow.age_years) : (currentUser?.age ? String(currentUser.age) : '');
          const loadedEmergency = patientRow?.emergency_contact || currentUser?.emergencyContact || '';
          const loadedSq = profileRow?.security_question || profileRow?.security_question_1 || patientRow?.security_question || 'What is your childhood nickname?';
          const loadedSa = profileRow?.security_answer || profileRow?.security_answer_1 || patientRow?.security_answer || '';

          setProfile({
            name: loadedName,
            email: loadedEmail,
            phone: loadedPhone,
            uhid: loadedUhid,
            age: loadedAge,
            gender: loadedGender,
            bloodGroup: loadedBloodGroup,
            emergencyContact: loadedEmergency,
            address: loadedAddress,
            securityQuestion: loadedSq,
            securityAnswer: loadedSa
          });

          if (typeof updateCurrentUser === 'function' && (loadedName || loadedUhid || loadedPhone)) {
            updateCurrentUser({
              ...(currentUser || {}),
              id: currentUserId || currentUser?.id,
              name: loadedName || currentUser?.name,
              phone: loadedPhone || currentUser?.phone,
              uhid: loadedUhid || currentUser?.uhid
            });
          }
        }
      } catch (err) {
        console.warn('[CitizenProfile] Direct DB hydration error:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    hydrateProfileFromDb();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id, currentUser?.email]);

  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    const newName = profile.name.trim();
    const newPhone = profile.phone ? profile.phone.trim() : '';
    const user = currentUser || {};

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || user.id;

      // 1. MUST execute Supabase update on profiles table
      const cleanAnswer = (profile.securityAnswer || '').trim().toLowerCase();
      const profileUpdates = {
        full_name: newName,
        phone: newPhone || null,
        security_question: profile.securityQuestion,
        security_answer: cleanAnswer || null,
        security_question_1: profile.securityQuestion,
        security_answer_1: cleanAnswer || null,
        updated_at: new Date().toISOString()
      };

      if (currentUserId && typeof currentUserId === 'string' && currentUserId.includes('-')) {
        await supabase.from('profiles').update(profileUpdates).eq('id', currentUserId);
      }

      const patientUpdate = {
        full_name: newName,
        phone: newPhone || null,
        address: profile.address || null,
        blood_group: profile.bloodGroup || null,
        emergency_contact: profile.emergencyContact || null,
        age_years: profile.age ? parseInt(profile.age, 10) : null,
        sex: profile.gender ? profile.gender.toLowerCase() : null,
        security_question: profile.securityQuestion,
        security_answer: cleanAnswer || null,
        updated_at: new Date().toISOString()
      };
      if (currentUserId && typeof currentUserId === 'string' && currentUserId.includes('-')) {
        await supabase.from('patients').update(patientUpdate).eq('id', currentUserId);
      }

      // 2. Update local state and global auth state
      const updatedUser = {
        ...user,
        ...profile,
        id: currentUserId || user.id,
        name: newName,
        phone: newPhone
      };
      if (typeof updateCurrentUser === 'function') {
        updateCurrentUser(updatedUser);
      }
      sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.warn('Profile update error:', err);
      const updatedUser = { ...user, ...profile, name: newName, phone: newPhone };
      if (typeof updateCurrentUser === 'function') {
        updateCurrentUser(updatedUser);
      }
      sessionStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_patient_session', JSON.stringify(updatedUser));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    }
  };

  // Hydration Flash Guard: Render professional skeleton loader while fetching profile
  if (loading) {
    return (
      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div>
          <div style={{ width: '220px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '6px', marginBottom: '0.5rem' }} className="animate-pulse" />
          <div style={{ width: '340px', height: '16px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} className="animate-pulse" />
        </div>

        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '1.75rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {/* Header Skeleton */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e2e8f0' }} className="animate-pulse" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ width: '180px', height: '20px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} className="animate-pulse" />
              <div style={{ width: '240px', height: '14px', backgroundColor: '#f1f5f9', borderRadius: '4px' }} className="animate-pulse" />
            </div>
          </div>

          {/* Form Grid Skeleton */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div style={{ width: '90px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} className="animate-pulse" />
                <div style={{ width: '100%', height: '38px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} className="animate-pulse" />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
            <div style={{ width: '130px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} className="animate-pulse" />
            <div style={{ width: '100%', height: '38px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} className="animate-pulse" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1.5rem' }}>
            <div style={{ width: '100px', height: '14px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} className="animate-pulse" />
            <div style={{ width: '100%', height: '72px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }} className="animate-pulse" />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ width: '150px', height: '42px', backgroundColor: '#e2e8f0', borderRadius: '8px' }} className="animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>{t('profile.pageTitle')}</h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          {t('profile.subtitle')}
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
            <h3 style={{ margin: '0 0 0.2rem 0', fontSize: '1.2rem', color: '#0f172a' }}>{profile.name || (lang === 'hi' ? 'नया रोगी प्रोफ़ाइल' : 'New Patient Profile')}</h3>
            <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.85rem', color: '#64748b' }}>
              <span>UHID: <strong style={{ color: '#15803d' }}>{profile.uhid || (lang === 'hi' ? 'अभी आवंटित नहीं' : 'Not Assigned Yet')}</strong></span>
              <span>·</span>
              <span>Role: <strong>{lang === 'hi' ? 'रोगी / नागरिक' : 'Patient / Citizen'}</strong></span>
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
            {t('profile.savedSuccess')}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                {t('profile.fullName')}
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
                {t('profile.email')}
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
                {t('profile.phone')}
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
                {t('profile.age')}
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
                {t('profile.gender')}
              </label>
              <select
                value={profile.gender}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="">{lang === 'hi' ? 'लिंग चुनें' : 'Select Gender'}</option>
                <option>{lang === 'hi' ? 'महिला' : 'Female'}</option>
                <option>{lang === 'hi' ? 'पुरुष' : 'Male'}</option>
                <option>{lang === 'hi' ? 'अन्य' : 'Other'}</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                {t('profile.bloodGroup')}
              </label>
              <select
                value={profile.bloodGroup}
                onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              >
                <option value="">{lang === 'hi' ? 'रक्त समूह चुनें' : 'Select Blood Group'}</option>
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
              {t('profile.emergencyContact')}
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
              {t('profile.address')}
            </label>
            <textarea
              rows="3"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          {/* Security Question for Password Recovery */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.35rem' }}>
              Password Recovery Security Question
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              Used to reset your password without needing an email verification link or OTP.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                  Pre-set Security Question
                </label>
                <select
                  value={profile.securityQuestion}
                  onChange={(e) => setProfile({ ...profile, securityQuestion: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  {PRESET_SECURITY_QUESTIONS.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                  Security Answer
                </label>
                <input
                  type="text"
                  placeholder="Enter your confidential answer"
                  value={profile.securityAnswer}
                  onChange={(e) => setProfile({ ...profile, securityAnswer: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              ref={saveButtonRef}
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
              {t('profile.save')}
            </button>
          </div>
        </form>
      </div>

      {/* Redesigned Boxy Bottom-Right Profile Incomplete Toast */}
      {isProfileIncomplete && !isToastDismissed && (
        <div
          className="fixed bottom-6 right-6 z-50 w-72 p-5 bg-amber-50 border border-amber-200 rounded-xl shadow-xl flex flex-col justify-between"
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            zIndex: 9999,
            width: '18rem',
            padding: '1.25rem',
            backgroundColor: '#fffbeb',
            border: '1.5px solid #fde68a',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
          role="alert"
          aria-live="polite"
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#fef3c7',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b45309',
                flexShrink: 0
              }}>
                <ShieldCheckIcon style={{ width: '16px', height: '16px' }} />
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400e' }}>Profile Notice</span>
            </div>
            <button
              type="button"
              onClick={() => setIsToastDismissed(true)}
              title="Dismiss notification"
              aria-label="Dismiss notification"
              className="p-1 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#92400e',
                borderRadius: '6px'
              }}
            >
              <XMarkIcon style={{ width: '18px', height: '18px' }} />
            </button>
          </div>

          <p style={{
            margin: '0 0 1rem 0',
            fontSize: '0.85rem',
            lineHeight: '1.45',
            color: '#78350f',
            fontWeight: '400'
          }}>
            {t('profile.incompleteNotice')}
          </p>

          <button
            type="button"
            onClick={scrollToSave}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors text-center"
            style={{
              width: '100%',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              padding: '0.55rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              textAlign: 'center',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              transition: 'background-color 0.2s ease'
            }}
          >
            {t('profile.completeProfile')}
          </button>
        </div>
      )}
    </div>
  );
}

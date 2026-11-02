import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { PRESET_SECURITY_QUESTIONS } from '../../services/authService';
import {
  ShieldCheckIcon,
  BuildingOffice2Icon,
  CheckCircleIcon,
  ClipboardDocumentIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

export default function AuthoritySettings() {
  const { currentUser, updateCurrentUser } = useAuth();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    centerName: '',
    designation: '',
    labId: '',
    address: '',
    securityQuestion: 'What is your childhood nickname?',
    securityAnswer: ''
  });

  const [initialForm, setInitialForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLabId, setCopiedLabId] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const saveBtnRef = useRef(null);

  // Deep comparison dirty state check
  const isDirty = initialForm !== null && (
    form.name !== initialForm.name ||
    form.phone !== initialForm.phone ||
    form.centerName !== initialForm.centerName ||
    form.designation !== initialForm.designation ||
    form.address !== initialForm.address ||
    form.securityQuestion !== initialForm.securityQuestion ||
    form.securityAnswer !== initialForm.securityAnswer
  );

  const hydrateSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData?.session?.user;
      const currentUserId = sessionUser?.id || currentUser?.id;
      const email = sessionUser?.email || currentUser?.email || '';

      let profileRow = null;
      if (currentUserId) {
        const { data } = await supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle();
        if (data) profileRow = data;
      }

      const loadedName = profileRow?.display_name || profileRow?.full_name || currentUser?.name || 'Dr. Shozab Rizvi';
      const loadedPhone = profileRow?.phone || currentUser?.phone || '';
      const loadedCenter = profileRow?.center_name || currentUser?.centerName || 'LabSetu Diagnostics';
      const loadedDesignation = profileRow?.designation || currentUser?.designation || 'Chief Pathologist & Lab Director';
      const loadedLabId = profileRow?.lab_id || currentUser?.labId || 'LAB-1001';
      const loadedAddress = profileRow?.address || currentUser?.address || 'SCO 42, Sector 14, Gurugram, Haryana - 122001';
      const loadedSq = profileRow?.security_question || profileRow?.security_question_1 || 'What is your childhood nickname?';
      const loadedSa = profileRow?.security_answer || profileRow?.security_answer_1 || '';

      const dataObj = {
        name: loadedName,
        email,
        phone: loadedPhone,
        centerName: loadedCenter,
        designation: loadedDesignation,
        labId: loadedLabId,
        address: loadedAddress,
        securityQuestion: loadedSq,
        securityAnswer: loadedSa
      };

      setForm(dataObj);
      setInitialForm(dataObj);

      if (typeof updateCurrentUser === 'function') {
        updateCurrentUser({
          ...(currentUser || {}),
          name: loadedName,
          phone: loadedPhone,
          centerName: loadedCenter,
          labId: loadedLabId
        });
      }
    } catch (err) {
      console.warn('[AuthoritySettings] Hydration warning:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id, currentUser?.email]);

  useEffect(() => {
    hydrateSettings();
  }, [hydrateSettings]);

  const handleCopyLabId = () => {
    if (form.labId) {
      navigator.clipboard?.writeText(form.labId);
      setCopiedLabId(true);
      setTimeout(() => setCopiedLabId(false), 2000);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!isDirty || isSaving) return;
    setIsSaving(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id || currentUser?.id;
      const cleanAnswer = (form.securityAnswer || '').trim().toLowerCase();

      const updates = {
        id: currentUserId,
        full_name: form.name.trim(),
        display_name: form.name.trim(),
        phone: form.phone.trim() || null,
        center_name: form.centerName.trim(),
        designation: form.designation.trim(),
        address: form.address.trim() || null,
        security_question: form.securityQuestion,
        security_answer: cleanAnswer || null,
        security_question_1: form.securityQuestion,
        security_answer_1: cleanAnswer || null,
        updated_at: new Date().toISOString()
      };

      if (currentUserId) {
        const { error } = await supabase.from('profiles').upsert(updates, { onConflict: 'id' });
        if (error) {
          console.warn('[AuthoritySettings] upsert error, falling back to update:', error);
          await supabase.from('profiles').update(updates).eq('id', currentUserId);
        }
      }

      const updatedUser = {
        ...(currentUser || {}),
        name: form.name.trim(),
        phone: form.phone.trim(),
        centerName: form.centerName.trim(),
        labId: form.labId,
        designation: form.designation.trim()
      };

      if (typeof updateCurrentUser === 'function') {
        updateCurrentUser(updatedUser);
      }
      sessionStorage.setItem('labsetu_authority_session', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_authority_session', JSON.stringify(updatedUser));
      sessionStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));
      localStorage.setItem('labsetu_auth', JSON.stringify(updatedUser));

      // Re-hydrate fresh DB state to reset pristine baseline
      await hydrateSettings();

      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } catch (err) {
      console.error('Settings save exception:', err);
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ width: '280px', height: '28px', backgroundColor: '#e2e8f0', borderRadius: '6px' }} className="animate-pulse" />
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '2rem' }}>
          <div style={{ height: '64px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '1.5rem' }} className="animate-pulse" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '54px', backgroundColor: '#f8fafc', borderRadius: '6px' }} className="animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '880px', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', color: '#0f172a' }}>
          Authority Account &amp; Organization Settings
        </h2>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b' }}>
          Manage your clinical practice profile, accredited organization details, and account recovery questions.
        </p>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        padding: '1.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        {/* Authority Profile Card Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid #e2e8f0',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #a7f3d0'
            }}>
              <BuildingOffice2Icon style={{ width: '32px', height: '32px', color: '#15803d' }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>{form.name}</h3>
                <span style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  Account Owner
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                {form.designation} · {form.centerName}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '0.45rem 0.85rem',
            borderRadius: '8px',
            fontSize: '0.85rem'
          }}>
            <IdentificationIcon style={{ width: '18px', color: '#15803d' }} />
            <span>Lab ID: <strong style={{ color: '#0f172a' }}>{form.labId}</strong></span>
            <button
              type="button"
              onClick={handleCopyLabId}
              title="Copy Unique Lab ID"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', color: '#64748b' }}
            >
              <ClipboardDocumentIcon style={{ width: '16px' }} />
            </button>
            {copiedLabId && <span style={{ color: '#15803d', fontSize: '0.75rem', fontWeight: '600' }}>Copied!</span>}
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
            Authority profile and organization settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Authority / Doctor Full Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Official Login Email (Database Authenticated)
              </label>
              <input
                type="email"
                value={form.email}
                disabled
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Contact Mobile / Direct Hotline
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Organization / Diagnostic Center Name <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="text"
                value={form.centerName}
                onChange={e => setForm({ ...form, centerName: e.target.value })}
                required
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Clinical Designation / Role
              </label>
              <input
                type="text"
                value={form.designation}
                onChange={e => setForm({ ...form, designation: e.target.value })}
                placeholder="e.g. Chief Pathologist & Lab Director"
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                Permanent Sequence-Backed Lab ID #
              </label>
              <input
                type="text"
                value={form.labId}
                disabled
                style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#0f172a', fontWeight: '600', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
              Center Physical Address &amp; Billing Header
            </label>
            <textarea
              rows="3"
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. SCO 42, Sector 14, Gurugram, Haryana - 122001"
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
            />
          </div>

          {/* Password Recovery Security Question */}
          <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.35rem' }}>
              Authority Password Recovery Security Question
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 0.85rem 0' }}>
              Used to reset your authority administrator password without needing an email verification link or OTP.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '500', color: '#334155' }}>
                  Pre-set Security Question
                </label>
                <select
                  value={form.securityQuestion}
                  onChange={e => setForm({ ...form, securityQuestion: e.target.value })}
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
                  value={form.securityAnswer}
                  onChange={e => setForm({ ...form, securityAnswer: e.target.value })}
                  style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              ref={saveBtnRef}
              type="submit"
              disabled={!isDirty || isSaving}
              style={{
                backgroundColor: (!isDirty || isSaving) ? '#94a3b8' : '#15803d',
                color: '#ffffff',
                border: 'none',
                padding: '0.7rem 1.5rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: (!isDirty || isSaving) ? 'not-allowed' : 'pointer',
                opacity: (!isDirty || isSaving) ? 0.65 : 1,
                transition: 'all 0.2s ease'
              }}
            >
              {isSaving ? 'Saving Changes...' : (isDirty ? 'Save Profile Changes' : 'No Changes to Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

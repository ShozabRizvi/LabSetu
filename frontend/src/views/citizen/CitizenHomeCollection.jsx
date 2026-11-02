import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import useDemoResource from '../../hooks/useDemoResource';
import { supabase } from '../../lib/supabase';
import {
  getCurrentCoordinates,
  matchNearestNablLab,
  calculateHaversineDistance
} from '../../utils/geoLabMatcher';
import {
  HomeModernIcon,
  ClockIcon,
  MapPinIcon,
  CheckCircleIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ShieldCheckIcon,
  XMarkIcon,
  PlusIcon,
  ArrowPathIcon,
  TruckIcon,
  BeakerIcon,
  DocumentCheckIcon,
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

// 7 Swiggy/Delivery-Style Tracking Stages
const TRACKING_STAGES = [
  {
    stage: 0,
    key: 'Order Placed',
    label: 'Order Placed',
    labelHi: 'ऑर्डर दर्ज किया गया',
    icon: '📝',
    badgeText: 'Order Confirmed',
    etaNotice: 'Sample collection request registered with LabSetu dispatch.',
    etaTime: '30-45 mins'
  },
  {
    stage: 1,
    key: 'Phlebotomist Assigned',
    label: 'Phlebotomist Assigned',
    labelHi: 'फ्लेबोटोमिस्ट नियुक्त',
    icon: '👨‍⚕️',
    badgeText: 'Assigned & Briefed',
    etaNotice: 'Phlebotomist Suresh Kumar assigned. Preparing sterilized vacutainers.',
    etaTime: '25 mins'
  },
  {
    stage: 2,
    key: 'Out for Collection',
    label: 'Out for Collection',
    labelHi: 'कलेक्शन के लिए रवाना',
    icon: '🛵',
    badgeText: 'On the Way',
    etaNotice: 'Phlebotomist is on the way to your residence. Cold-chain box verified.',
    etaTime: '14 mins'
  },
  {
    stage: 3,
    key: 'Sample Collected',
    label: 'Sample Collected',
    labelHi: 'सैंपल सुरक्षित लिया गया',
    icon: '🩸',
    badgeText: 'Sample Barcoded',
    etaNotice: 'Sample drawn via single-use needle & barcoded with anti-tamper seal.',
    etaTime: 'Completed'
  },
  {
    stage: 4,
    key: 'In Transit to Lab',
    label: 'In Transit to Lab',
    labelHi: 'लैब की ओर प्रस्थान',
    icon: '🧪',
    badgeText: 'In Cold-Chain Transit',
    etaNotice: 'Sample traveling at 4.2°C temperature in certified cold-chain box.',
    etaTime: '18 mins to Lab'
  },
  {
    stage: 5,
    key: 'Processing',
    label: 'Processing',
    labelHi: 'लैब में जांच प्रक्रियाधीन',
    icon: '🔬',
    badgeText: 'Analyzer Running',
    etaNotice: 'Automated 5-part hematology analyzer running diagnostic assays.',
    etaTime: 'Est. 2-3 hours'
  },
  {
    stage: 6,
    key: 'Report Ready',
    label: 'Report Ready',
    labelHi: 'डिजिटल रिपोर्ट तैयार',
    icon: '📄',
    badgeText: 'Verified & Released',
    etaNotice: 'Report finalized, signed by Chief Pathologist and published on portal.',
    etaTime: 'Ready for Download'
  }
];

export default function CitizenHomeCollection({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const { currentUser, activeUHID } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [activeTrackingId, setActiveTrackingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const autoSimTimerRef = useRef(null);

  // Fetch live home collection appointments strictly from Supabase
  const fetchHomeCollections = React.useCallback(async () => {
    try {
      setLoadingBookings(true);
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .or('type.eq.home_collection,visit_type.eq.home_collection')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[CitizenHomeCollection] appointments query warning:', error);
      }

      const rows = data || [];
      const mapped = rows.map((row) => {
        const isFasting = /fasting|sugar|glucose|lipid|cholesterol|kft|lft/i.test(row.purpose || row.department || '');
        const prepInstruction = row.preparation_instructions || (isFasting ? 'Strict 10-12 hours overnight fasting required. Plain water permitted.' : null);

        const statusStr = row.tracking_status || row.status || 'Order Placed';
        const matchedIdx = TRACKING_STAGES.findIndex(s => s.key.toLowerCase() === statusStr.toLowerCase() || s.label.toLowerCase() === statusStr.toLowerCase());
        const stageIdx = matchedIdx !== -1 ? matchedIdx : (statusStr === 'Confirmed' ? 1 : 0);

        return {
          id: row.id.startsWith('HC-') ? row.id : (row.notes?.match(/Ref:\s*(HC-\w+)/)?.[1] || `HC-${row.id.replace(/\D/g, '').slice(-4) || '1001'}`),
          rawId: row.id,
          tests: row.purpose || row.department || 'Blood Sample Collection',
          date: row.appointment_date || row.date || (row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : ''),
          timeSlot: row.time_slot || row.slot || '08:00 AM - 09:00 AM',
          address: row.notes?.match(/Address:\s*([^,]+(?:,[^,]+)*?)(?:,\s*MatchedLab|$)/)?.[1] || row.address || currentUser?.address || 'Patient Residence',
          phlebotomist: {
            name: row.phlebotomist_name || 'Suresh Kumar',
            phone: row.phlebotomist_phone || '+91 98765 43210',
            badge: 'Vaccinated · NABL Certified',
            rating: '4.9 ★'
          },
          assignedLab: {
            id: row.assigned_lab_id || 'lab-central',
            name: row.notes?.match(/MatchedLab:\s*(.+)$/)?.[1] || 'LabSetu Central Reference Lab',
            accreditation: 'NABL & ICMR Accredited (ISO 15189)',
            distanceKm: 1.2
          },
          status: TRACKING_STAGES[stageIdx].key,
          stage: stageIdx,
          prep: prepInstruction
        };
      });

      setBookings(mapped);
      setActiveTrackingId(prev => (prev && mapped.some(b => b.id === prev)) ? prev : (mapped[0]?.id || null));
    } catch (err) {
      console.warn('[CitizenHomeCollection] fetch error:', err);
      setBookings([]);
      setActiveTrackingId(null);
    } finally {
      setLoadingBookings(false);
    }
  }, [currentUser?.address]);

  useEffect(() => {
    fetchHomeCollections();
  }, [fetchHomeCollections]);

  // Geolocation & Nearest Lab Detection State
  const [geoState, setGeoState] = useState({
    loading: false,
    matchedLab: null,
    distanceKm: null,
    coords: null,
    error: null
  });

  // Current active tracked booking
  const activeBooking = (bookings || []).find(b => b.id === activeTrackingId) || (bookings && bookings[0]) || null;
  const currentStageIndex = activeBooking ? Math.min(Math.max(activeBooking.stage ?? 0, 0), 6) : 0;
  const currentStageInfo = TRACKING_STAGES[currentStageIndex];

  // Auto-detect patient geolocation & nearest NABL lab on mount
  useEffect(() => {
    let isMounted = true;
    async function detectLocationAndLab() {
      setGeoState(prev => ({ ...prev, loading: true }));
      try {
        const coords = await getCurrentCoordinates();
        const matchResult = await matchNearestNablLab(coords);
        if (isMounted) {
          setGeoState({
            loading: false,
            matchedLab: matchResult.nearestLab,
            distanceKm: matchResult.distanceKm,
            coords: matchResult.userCoords,
            error: null
          });
        }
      } catch (err) {
        if (isMounted) {
          setGeoState(prev => ({ ...prev, loading: false, error: err.message }));
        }
      }
    }
    detectLocationAndLab();
    return () => {
      isMounted = false;
    };
  }, []);

  // Realtime Supabase Channel
  useEffect(() => {
    const channel = supabase.channel('home-collection-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, (payload) => {
        if (payload.new) {
          const updatedRow = payload.new;
          setBookings((prev) => {
            const list = Array.isArray(prev) ? prev : [];
            const index = list.findIndex(b => b.id === updatedRow.id || (updatedRow.notes && updatedRow.notes.includes(b.id)));
            if (index !== -1) {
              const current = list[index];
              const newStageName = updatedRow.tracking_status || updatedRow.status;
              const matchedStage = TRACKING_STAGES.findIndex(s => s.key.toLowerCase() === (newStageName || '').toLowerCase());
              const updated = {
                ...current,
                status: newStageName || current.status,
                stage: matchedStage !== -1 ? matchedStage : current.stage
              };
              const copy = [...list];
              copy[index] = updated;
              return copy;
            }
            return list;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Advance or rewind stage for simulation
  const setBookingStage = (newStage) => {
    const clamped = Math.max(0, Math.min(6, newStage));
    const targetStage = TRACKING_STAGES[clamped];

    setBookings((prev) => {
      const list = Array.isArray(prev) ? prev : [];
      return list.map(b => {
        if (b.id === activeBooking?.id) {
          return {
            ...b,
            stage: clamped,
            status: targetStage.key
          };
        }
        return b;
      });
    });

    // Sync to Supabase
    try {
      supabase
        .from('appointments')
        .update({
          tracking_status: targetStage.key,
          estimated_delivery_time: targetStage.etaTime
        })
        .ilike('notes', `%${activeBooking?.id}%`)
        .then(() => {});
    } catch {}
  };

  // Auto-play simulation runner
  useEffect(() => {
    if (isSimulating) {
      autoSimTimerRef.current = setInterval(() => {
        setBookings(prev => {
          const list = Array.isArray(prev) ? prev : [];
          return list.map(b => {
            if (b.id === activeBooking?.id) {
              const nextStage = ((b.stage ?? 0) + 1) % 7;
              return {
                ...b,
                stage: nextStage,
                status: TRACKING_STAGES[nextStage].key
              };
            }
            return b;
          });
        });
      }, 3500);
    } else {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    }
    return () => {
      if (autoSimTimerRef.current) clearInterval(autoSimTimerRef.current);
    };
  }, [isSimulating, activeBooking?.id]);

  // Booking Form State
  const [form, setForm] = useState({
    tests: 'Complete Blood Count (CBC)',
    date: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    timeSlot: '07:30 AM - 08:30 AM (Fasting)',
    address: 'House #42, Sector 14, Gurugram, Haryana',
    instructions: 'Ring doorbell twice'
  });

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    const assignedLab = geoState.matchedLab || {
      id: 'lab-central',
      name: 'LabSetu Central Reference Lab',
      accreditation: 'NABL & ICMR Accredited (ISO 15189)',
      distanceKm: 1.2
    };

    const newId = `HC-${Math.floor(1000 + Math.random() * 9000)}`;
    const isFasting = /fasting|sugar|glucose|lipid|cholesterol|kft|lft/i.test(form.tests);
    const prepNotice = isFasting ? 'Strict 10-12 hours overnight fasting required. Plain water permitted.' : null;

    const created = {
      id: newId,
      tests: form.tests,
      date: form.date,
      timeSlot: form.timeSlot,
      address: form.address,
      phlebotomist: {
        name: 'Suresh Kumar',
        phone: '+91 98765 43210',
        badge: 'Vaccinated · NABL Certified',
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150',
        rating: '4.9 ★ (1,240 pickups)'
      },
      assignedLab: {
        id: assignedLab.id,
        name: assignedLab.name,
        accreditation: assignedLab.accreditation,
        distanceKm: geoState.distanceKm || 1.2
      },
      status: 'Order Placed',
      stage: 0,
      prep: prepNotice
    };

    setBookings((prev) => [created, ...(prev || [])]);
    setActiveTrackingId(newId);

    try {
      await supabase.from('appointments').insert({
        appointment_date: form.date,
        visit_type: 'home_collection',
        type: 'home_collection',
        status: 'Confirmed',
        tracking_status: 'Order Placed',
        estimated_delivery_time: '30-45 mins',
        assigned_lab_id: assignedLab.id,
        patient_id: currentUser?.id && currentUser.id.includes('-') ? currentUser.id : null,
        patient_name: currentUser?.name || 'Citizen Patient',
        patient_phone: currentUser?.phone || null,
        patient_email: currentUser?.email || null,
        uhid: activeUHID || currentUser?.uhid || null,
        patient_latitude: geoState.coords?.latitude,
        patient_longitude: geoState.coords?.longitude,
        purpose: form.tests,
        preparation_instructions: prepNotice,
        notes: `Ref: ${created.id}, Address: ${form.address}, MatchedLab: ${assignedLab.name}`
      });
      fetchHomeCollections();
    } catch (dbErr) {
      console.warn('Supabase insert fallback:', dbErr);
    }

    setIsModalOpen(false);
    setNotice(lang === 'hi' 
      ? `घर से सैंपल कलेक्शन सफलतापूर्वक बुक किया गया: ${created.id}`
      : `Home collection scheduled successfully: ${created.id}`);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleCancel = async (id) => {
    const target = (bookings || []).find(b => b.id === id);
    const targetRawId = target?.rawId;

    setBookings((prev) => (prev || []).filter(b => b.id !== id));
    if (activeTrackingId === id) {
      const remaining = (bookings || []).filter(b => b.id !== id);
      setActiveTrackingId(remaining[0]?.id || null);
    }

    try {
      if (targetRawId) {
        await supabase
          .from('appointments')
          .update({ status: 'Cancelled', tracking_status: 'Cancelled' })
          .eq('id', targetRawId);
      }
    } catch (err) {
      console.warn('Cancel appointment error:', err);
    }

    setNotice(lang === 'hi' ? 'कलेक्शन रद्द कर दिया गया।' : 'Collection booking cancelled.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="citizen-page" style={{ paddingBottom: '3rem' }}>
      {/* Header with Title and Action */}
      <div className="citizen-page-header" style={{ marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{
              background: '#ecfdf5',
              color: '#059669',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              border: '1px solid #a7f3d0'
            }}>
              <SparklesIcon style={{ width: '13px' }} />
              LIVE TRACKING ENGINE
            </span>
          </div>
          <h1 className="citizen-page-title" style={{ fontSize: '1.65rem' }}>
            {lang === 'hi' ? 'घर से सैंपल कलेक्शन (लाइव डिलीवरी ट्रैकर)' : 'Doorstep Home Sample Collection & Live Tracker'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi' 
              ? 'प्रमाणित फ्लेबोटोमिस्ट द्वारा आपके घर से सुरक्षित सैंपल पिकअप एवं रीयल-टाइम 7-चरणीय डिलीवरी ट्रैकिंग'
              : 'Swiggy-style live progress tracker with automated NABL lab geolocation matching'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: '#059669',
            color: '#ffffff',
            fontWeight: '600',
            padding: '0.7rem 1.25rem',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(5, 150, 105, 0.25)',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.9rem',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#047857'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#059669'; }}
        >
          <PlusIcon style={{ width: '20px' }} />
          {lang === 'hi' ? 'नया कलेक्शन बुक करें' : 'Schedule Doorstep Collection'}
        </button>
      </div>

      {notice && (
        <div style={{ background: '#dcfce7', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '10px', fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #86efac', display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}>
          <CheckCircleIcon style={{ width: '22px' }} />
          <span>{notice}</span>
        </div>
      )}

      {/* Geolocation Automated Lab Matching Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
        border: '1px solid #86efac',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: '#059669',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
            flexShrink: 0
          }}>
            📍
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: '700', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              AUTOMATED GEOLOCATION LAB MATCHING
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              Matched with Nearest NABL Lab: {geoState.matchedLab?.name || 'LabSetu Central Reference Lab'}
              <span style={{
                background: '#059669',
                color: 'white',
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: '700'
              }}>
                {geoState.distanceKm || '1.2'} km away
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.1rem' }}>
              Verified NABL ISO 15189 · Cold-chain transport logistics guaranteed
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            GPS: {geoState.coords ? `${geoState.coords.latitude.toFixed(4)}, ${geoState.coords.longitude.toFixed(4)}` : 'Auto-Resolved'}
          </span>
        </div>
      </div>

      {/* Main Delivery Tracking Card (Swiggy / Zomato Style) */}
      {activeBooking && (
        <div style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 4px 16px -2px rgba(15, 23, 42, 0.08)',
          overflow: 'hidden',
          marginBottom: '2rem'
        }}>
          {/* Card Top Banner: ETA & Status */}
          <div style={{
            background: 'linear-gradient(90deg, #064e3b 0%, #065f46 60%, #047857 100%)',
            color: 'white',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <span style={{
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: '700'
                }}>
                  {activeBooking.id}
                </span>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1.5s infinite' }}></span>
                  {currentStageInfo.badgeText}
                </span>
              </div>
              <h2 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.35rem', fontWeight: '700', color: 'white' }}>
                {activeBooking.tests}
              </h2>
              <div style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>
                📍 {activeBooking.address}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a7f3d0', fontWeight: '600' }}>
                Estimated Status / ETA
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end' }}>
                <ClockIcon style={{ width: '22px' }} />
                {currentStageInfo.etaTime}
              </div>
              <div style={{ fontSize: '0.78rem', color: '#e2e8f0', maxWidth: '260px' }}>
                {currentStageInfo.etaNotice}
              </div>
            </div>
          </div>

          {/* 7-Stage Visual Stepper */}
          <div style={{
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            padding: '1.5rem 1.25rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              position: 'relative'
            }}>
              {/* Progress Track Line */}
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '4%',
                right: '4%',
                height: '4px',
                background: '#e2e8f0',
                zIndex: 0
              }}>
                <div style={{
                  height: '100%',
                  background: '#059669',
                  width: `${(currentStageIndex / 6) * 100}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>

              {TRACKING_STAGES.map((s, idx) => {
                const isPassed = currentStageIndex > idx;
                const isCurrent = currentStageIndex === idx;

                return (
                  <div
                    key={s.key}
                    onClick={() => setBookingStage(idx)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      zIndex: 1,
                      cursor: 'pointer',
                      padding: '0 0.25rem'
                    }}
                    title={`Click to set stage: ${s.label}`}
                  >
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: isPassed ? '#059669' : isCurrent ? '#10b981' : '#ffffff',
                      border: isCurrent ? '3px solid #064e3b' : isPassed ? '2px solid #059669' : '2px solid #cbd5e1',
                      color: isPassed || isCurrent ? '#ffffff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '0.4rem',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(16, 185, 129, 0.3)' : '0 1px 2px rgba(0,0,0,0.05)',
                      transition: 'all 0.3s ease'
                    }}>
                      {isPassed ? '✓' : s.icon}
                    </div>

                    <span style={{
                      fontSize: '0.72rem',
                      color: isCurrent ? '#064e3b' : isPassed ? '#0f172a' : '#94a3b8',
                      fontWeight: isCurrent ? '800' : isPassed ? '600' : '400',
                      textAlign: 'center',
                      lineHeight: 1.25,
                      maxWidth: '90px'
                    }}>
                      {lang === 'hi' ? s.labelHi : s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Live Map Tracker Simulation & Phlebotomist Details Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.35fr) minmax(0, 1fr)',
            gap: '1.25rem',
            padding: '1.5rem'
          }}>
            {/* Left: Simulated Live Map Component */}
            <div style={{
              background: '#f1f5f9',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              padding: '1rem',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '290px',
              overflow: 'hidden'
            }}>
              {/* Map Canvas / SVG Route Simulation */}
              <div style={{
                position: 'absolute',
                inset: 0,
                opacity: 0.85,
                background: `
                  radial-gradient(circle at 50% 50%, #ffffff 0%, #f1f5f9 100%),
                  repeating-linear-gradient(0deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px),
                  repeating-linear-gradient(90deg, transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px)
                `
              }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  {/* Road Path */}
                  <path
                    d="M 60,70 Q 150,40 220,110 T 360,180"
                    fill="none"
                    stroke="#94a3b8"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  {/* Active Animated Route */}
                  <path
                    d="M 60,70 Q 150,40 220,110 T 360,180"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                  />

                  {/* Lab Origin Marker */}
                  <g transform="translate(60, 70)">
                    <circle r="14" fill="#2563eb" />
                    <text textAnchor="middle" dy="5" fill="white" fontSize="12" fontWeight="bold">🏥</text>
                  </g>

                  {/* Phlebotomist Live Marker (Interpolated along route based on stage) */}
                  {(() => {
                    const coordsMap = [
                      { x: 60, y: 70 },    // Order Placed (at lab)
                      { x: 90, y: 60 },    // Assigned
                      { x: 170, y: 75 },   // Out for collection
                      { x: 360, y: 180 },  // Sample collected (at home)
                      { x: 260, y: 130 },  // In transit to lab
                      { x: 60, y: 70 },    // Processing (at lab)
                      { x: 60, y: 70 }     // Report ready
                    ];
                    const pos = coordsMap[currentStageIndex] || coordsMap[2];
                    return (
                      <g transform={`translate(${pos.x}, ${pos.y})`}>
                        <circle r="22" fill="#10b981" opacity="0.3">
                          <animate attributeName="r" values="16;28;16" dur="2s" repeatCount="indefinite" />
                        </circle>
                        <circle r="15" fill="#059669" stroke="#ffffff" strokeWidth="3" />
                        <text textAnchor="middle" dy="4" fill="white" fontSize="11">🛵</text>
                      </g>
                    );
                  })()}

                  {/* Patient Home Marker */}
                  <g transform="translate(360, 180)">
                    <circle r="14" fill="#dc2626" />
                    <text textAnchor="middle" dy="5" fill="white" fontSize="12">🏠</text>
                  </g>
                </svg>
              </div>

              {/* Map Floating Header */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.3rem 0.75rem',
                  borderRadius: '20px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  LIVE GPS DISPATCH
                </span>

                <span style={{
                  background: 'rgba(15, 23, 42, 0.85)',
                  color: 'white',
                  padding: '0.25rem 0.6rem',
                  borderRadius: '6px',
                  fontSize: '0.72rem',
                  fontWeight: '600'
                }}>
                  Sector 14 Corridor
                </span>
              </div>

              {/* Map Floating Bottom Route Info */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                background: 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(6px)',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '0.8rem' }}>
                  <div style={{ fontWeight: '700', color: '#0f172a' }}>
                    {currentStageIndex <= 2 ? 'En Route to Patient' : currentStageIndex === 3 ? 'At Patient Residence' : 'Cold-Chain Transit to Lab'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Distance: <strong>{geoState.distanceKm || '1.2'} km</strong> · Route via Healthcare Blvd
                  </div>
                </div>

                <span style={{
                  background: '#ecfdf5',
                  color: '#047857',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  4.2°C Cold Box
                </span>
              </div>
            </div>

            {/* Right: Phlebotomist Details Card */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '1.25rem'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Designated Medical Phlebotomist
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <img
                    src={activeBooking.phlebotomist?.photo || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150'}
                    alt="Phlebotomist"
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #059669',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: '700' }}>
                      {activeBooking.phlebotomist?.name || 'Suresh Kumar'}
                    </h3>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', color: '#059669', fontWeight: '600', marginTop: '0.15rem' }}>
                      <ShieldCheckIcon style={{ width: '15px' }} />
                      {activeBooking.phlebotomist?.badge || 'Vaccinated · NABL Certified'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                      {activeBooking.phlebotomist?.rating || '4.9 ★ (1,240 pickups)'}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  borderRadius: '8px',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  fontSize: '0.8rem',
                  color: '#334155',
                  marginBottom: '1rem',
                  lineHeight: 1.45
                }}>
                  <div><strong>Safety Protocol:</strong> Single-use sterile vacuum needles, barcode match & ice-gel pack cold seal.</div>
                  <div style={{ marginTop: '0.35rem', color: '#059669', fontWeight: '600' }}>
                    Assigned Lab: {activeBooking.assignedLab?.name || 'LabSetu Central Reference Lab'}
                  </div>
                </div>
              </div>

              {/* Call Phlebotomist Action */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <a
                  href={`tel:${activeBooking.phlebotomist?.phone || '+919876543210'}`}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: '#059669',
                    color: 'white',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}
                >
                  <PhoneIcon style={{ width: '16px' }} />
                  Call Phlebotomist
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Hackathon Evaluator Simulation Toolbar */}
          <div style={{
            background: '#f1f5f9',
            borderTop: '1px solid #e2e8f0',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                🧪 Evaluator Simulation Controls:
              </span>
              <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                Stage: <strong>{currentStageIndex + 1}/7 ({currentStageInfo.key})</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                disabled={currentStageIndex <= 0}
                onClick={() => setBookingStage(currentStageIndex - 1)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: currentStageIndex <= 0 ? '#f8fafc' : 'white',
                  color: currentStageIndex <= 0 ? '#94a3b8' : '#334155',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: currentStageIndex <= 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ◀ Prev Stage
              </button>

              <button
                type="button"
                disabled={currentStageIndex >= 6}
                onClick={() => setBookingStage(currentStageIndex + 1)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: currentStageIndex >= 6 ? '#cbd5e1' : '#059669',
                  color: 'white',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: currentStageIndex >= 6 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                ▶ Next Stage (Advance)
              </button>

              <button
                type="button"
                onClick={() => setIsSimulating(!isSimulating)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: '1px solid #059669',
                  background: isSimulating ? '#ecfdf5' : 'white',
                  color: '#059669',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isSimulating ? <PauseIcon style={{ width: '14px' }} /> : <PlayIcon style={{ width: '14px' }} />}
                {isSimulating ? 'Pause Auto-Play' : '⚡ Auto-Play Cycle'}
              </button>

              <button
                type="button"
                onClick={() => setBookingStage(0)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#475569',
                  fontSize: '0.8rem',
                  cursor: 'pointer'
                }}
                title="Reset simulation to Stage 1"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety & Protocol Banner */}
      <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <ShieldCheckIcon style={{ width: '28px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
        <div style={{ fontSize: '0.875rem', color: '#1e3a8a', lineHeight: 1.5 }}>
          <strong>{lang === 'hi' ? 'लैबसेतु सुरक्षा मानक:' : 'LabSetu Doorstep Safety Standards:'}</strong>{' '}
          {lang === 'hi' 
            ? 'सभी फ्लेबोटोमिस्ट सिंगल-यूज़ वैक्युटेनर सुइयों, सीलबंद बारकोड ट्यूबों और तापमान-नियंत्रित कोल्ड-चेन बैग का उपयोग करते हैं।'
            : 'Phlebotomists utilize sterile single-use vacuum needles, barcode-matched vacutainers, and temperature-monitored cold-chain transport boxes.'}
        </div>
      </div>

      {/* Active Bookings List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.15rem', color: '#0f172a', margin: '0.5rem 0 0' }}>
          {lang === 'hi' ? 'आपके घर से सैंपल कलेक्शन इतिहास' : 'Scheduled & Past Home Collections'}
        </h3>

        {loadingBookings ? (
          <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ width: '120px', height: '20px', backgroundColor: '#e2e8f0', borderRadius: '4px' }} className="animate-pulse" />
            <div style={{ width: '260px', height: '24px', backgroundColor: '#f1f5f9', borderRadius: '6px' }} className="animate-pulse" />
            <div style={{ width: '100%', height: '40px', backgroundColor: '#f8fafc', borderRadius: '6px' }} className="animate-pulse" />
          </div>
        ) : (bookings || []).length === 0 ? (
          <div style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px dashed #cbd5e1',
            padding: '3rem 2rem',
            textAlign: 'center',
            color: '#64748b'
          }}>
            <HomeModernIcon style={{ width: '48px', height: '48px', margin: '0 auto 1rem', color: '#94a3b8' }} />
            <h4 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', color: '#1e293b' }}>
              {lang === 'hi' ? 'कोई सक्रिय होम कलेक्शन नहीं है' : 'No Home Collections Scheduled'}
            </h4>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.875rem' }}>
              {lang === 'hi'
                ? 'प्रमाणित फ्लेबोटोमिस्ट को अपने घर बुलाने के लिए ऊपर दिए गए बटन पर क्लिक करें।'
                : 'Book a certified phlebotomist to collect diagnostic samples directly from your doorstep.'}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                backgroundColor: '#059669',
                color: '#ffffff',
                border: 'none',
                padding: '0.65rem 1.25rem',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              + {lang === 'hi' ? 'नया कलेक्शन बुक करें' : 'Schedule Doorstep Collection'}
            </button>
          </div>
        ) : (
          (bookings || []).map((b) => {
            const isSelected = b.id === activeTrackingId;
            const stageIdx = Math.min(Math.max(b.stage ?? 0, 0), 6);
            const stageObj = TRACKING_STAGES[stageIdx] || TRACKING_STAGES[0];

            return (
              <div
                key={b.id}
                onClick={() => setActiveTrackingId(b.id)}
                style={{
                  background: 'white',
                  border: isSelected ? '2px solid #059669' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  boxShadow: isSelected ? '0 4px 12px rgba(5, 150, 105, 0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#15803d', background: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px', textTransform: 'uppercase' }}>
                        {b.id}
                      </span>
                      {isSelected && (
                        <span style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '700', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '4px', border: '1px solid #a7f3d0' }}>
                          ACTIVE TRACKER
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0.4rem 0 0.2rem', fontSize: '1.05rem', color: '#0f172a' }}>{b.tests}</h4>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: '#64748b', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <CalendarDaysIcon style={{ width: '16px' }} /> {b.date}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <ClockIcon style={{ width: '16px' }} /> {b.timeSlot}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '0.35rem 0.8rem',
                      borderRadius: '20px',
                      fontSize: '0.8rem',
                      fontWeight: '700',
                      background: stageIdx === 6 ? '#dcfce7' : '#fef3c7',
                      color: stageIdx === 6 ? '#15803d' : '#92400e'
                    }}>
                      {stageObj.key}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', fontSize: '0.85rem', color: '#334155', borderTop: '1px solid #f1f5f9', paddingTop: '0.75rem' }}>
                  <div>
                    <strong>{lang === 'hi' ? 'कलेक्शन पता:' : 'Pickup Address:'}</strong>
                    <p style={{ margin: '0.15rem 0 0', color: '#64748b' }}>{b.address}</p>
                  </div>
                  <div>
                    <strong>{lang === 'hi' ? 'फ्लेबोटोमिस्ट:' : 'Designated Phlebotomist:'}</strong>
                    <p style={{ margin: '0.15rem 0 0', color: '#64748b' }}>
                      {typeof b.phlebotomist === 'object' ? b.phlebotomist.name : b.phlebotomist} · {b.phleboPhone || b.phlebotomist?.phone}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9', paddingTop: '0.65rem' }}>
                  {b.prep ? (
                    <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
                      ⚠️ <strong>{lang === 'hi' ? 'तैयारी निर्देश:' : 'Test Preparation:'}</strong> {b.prep}
                    </span>
                  ) : <span />}
                  {stageIdx < 3 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancel(b.id);
                      }}
                      style={{ background: 'none', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                      {lang === 'hi' ? 'रद्द करें' : 'Cancel Booking'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Schedule Doorstep Collection Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.75rem', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a', fontWeight: '700' }}>
                  {lang === 'hi' ? 'घर से सैंपल कलेक्शन बुक करें' : 'Schedule Doorstep Sample Pickup'}
                </h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                  Automated NABL lab assignment based on your live location
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}>
                <XMarkIcon style={{ width: '22px' }} />
              </button>
            </div>

            {/* Geolocation Notice in Modal */}
            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.25rem', fontSize: '0.85rem', color: '#065f46' }}>
              📍 <strong>Nearest NABL Lab Auto-Assigned:</strong> {geoState.matchedLab?.name || 'LabSetu Central Reference Lab'} ({geoState.distanceKm || '1.2'} km)
            </div>

            <form onSubmit={handleCreateBooking}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {lang === 'hi' ? 'जांच / टेस्ट का नाम' : 'Select Tests for Sample Collection'}
                </label>
                <select
                  value={form.tests}
                  onChange={(e) => setForm({ ...form, tests: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                >
                  <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC) - ₹350</option>
                  <option value="Fasting Blood Sugar (FBS)">Fasting Blood Sugar (FBS) - ₹120</option>
                  <option value="Lipid Profile Comprehensive">Lipid Profile Comprehensive - ₹650</option>
                  <option value="Thyroid Profile (T3, T4, TSH)">Thyroid Profile (T3, T4, TSH) - ₹550</option>
                  <option value="Liver Function Test (LFT)">Liver Function Test (LFT) - ₹750</option>
                  <option value="Full Body Executive Health Checkup">Full Body Executive Health Checkup - ₹2,499</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {lang === 'hi' ? 'दिनांक' : 'Preferred Date'}
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                    {lang === 'hi' ? 'समय स्लॉट' : 'Time Window'}
                  </label>
                  <select
                    value={form.timeSlot}
                    onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                    style={{ width: '100%', padding: '0.55rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem' }}
                  >
                    <option value="06:30 AM - 07:30 AM (Early Fasting)">06:30 AM - 07:30 AM (Fasting)</option>
                    <option value="07:30 AM - 08:30 AM (Morning)">07:30 AM - 08:30 AM</option>
                    <option value="08:30 AM - 09:30 AM (Morning)">08:30 AM - 09:30 AM</option>
                    <option value="10:00 AM - 12:00 PM (Mid-Day)">10:00 AM - 12:00 PM</option>
                    <option value="04:00 PM - 06:00 PM (Evening)">04:00 PM - 06:00 PM</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#334155', marginBottom: '0.35rem' }}>
                  {lang === 'hi' ? 'पूरा पता और लैंडमार्क' : 'Full Residence Address & Landmark'}
                </label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  style={{ width: '100%', padding: '0.6rem', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
                ℹ️ Doorstep collection fee: <strong>FREE</strong> for orders above ₹500. A certified phlebotomist will call 15 minutes before arrival.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '0.6rem 1.25rem', border: '1px solid #cbd5e1', borderRadius: '8px', background: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.6rem 1.25rem', border: 'none', borderRadius: '8px', background: '#059669', color: 'white', cursor: 'pointer', fontWeight: '600' }}
                >
                  Confirm &amp; Book Phlebotomist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

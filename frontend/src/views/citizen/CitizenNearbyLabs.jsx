import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  BuildingOffice2Icon,
  MapPinIcon,
  StarIcon,
  CheckBadgeIcon,
  ClockIcon,
  HomeModernIcon,
  FunnelIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import './CitizenDashboard.css';

export default function CitizenNearbyLabs({ lang: propLang }) {
  const { lang: contextLang } = useLanguage();
  const lang = propLang || contextLang || 'en';
  const navigate = useNavigate();
  const [filterHomePickup, setFilterHomePickup] = useState(false);
  const [filterNablOnly, setFilterNablOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const labs = [
    {
      id: 'lab-1',
      name: 'LabSetu Central Diagnostic Reference Lab',
      accreditation: 'NABL & ICMR Accredited (ISO 15189)',
      nabl: true,
      distance: '1.2 km away',
      address: 'Main Healthcare Boulevard, Sector 14, Gurugram',
      rating: '4.9',
      reviewCount: '1,420',
      nextSlot: 'Today, 03:30 PM',
      homePickup: true,
      homePickupFee: 'FREE above ₹500',
      priceList: {
        cbc: 350,
        lipid: 650,
        sugar: 100,
        thyroid: 550
      }
    },
    {
      id: 'lab-2',
      name: 'MaxPath Precision Laboratories',
      accreditation: 'NABL Certified & CAP Accredited',
      nabl: true,
      distance: '2.8 km away',
      address: 'City Center Mall Arcade, Ground Floor, Gurugram',
      rating: '4.8',
      reviewCount: '890',
      nextSlot: 'Today, 04:15 PM',
      homePickup: true,
      homePickupFee: '₹50 flat',
      priceList: {
        cbc: 400,
        lipid: 700,
        sugar: 120,
        thyroid: 600
      }
    },
    {
      id: 'lab-3',
      name: 'Apollo Clinical Diagnostic Point',
      accreditation: 'NABL Accredited Regional Hub',
      nabl: true,
      distance: '4.1 km away',
      address: 'Near Metro Pillar #128, Golf Course Road',
      rating: '4.7',
      reviewCount: '2,150',
      nextSlot: 'Tomorrow, 08:00 AM',
      homePickup: true,
      homePickupFee: 'FREE above ₹400',
      priceList: {
        cbc: 380,
        lipid: 680,
        sugar: 110,
        thyroid: 580
      }
    },
    {
      id: 'lab-4',
      name: 'Sanjeevani Community Path Lab',
      accreditation: 'State Medical Council Registered',
      nabl: false,
      distance: '0.8 km away',
      address: 'Opposite Civil Hospital Gate, Old Railway Road',
      rating: '4.5',
      reviewCount: '410',
      nextSlot: 'Today, 02:45 PM',
      homePickup: false,
      homePickupFee: 'Clinic Visit Only',
      priceList: {
        cbc: 280,
        lipid: 550,
        sugar: 80,
        thyroid: 450
      }
    }
  ];

  const filteredLabs = labs.filter(lab => {
    const matchesSearch = lab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          lab.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesHome = filterHomePickup ? lab.homePickup : true;
    const matchesNabl = filterNablOnly ? lab.nabl : true;
    return matchesSearch && matchesHome && matchesNabl;
  });

  return (
    <div className="citizen-page">
      <div className="citizen-page-header">
        <div>
          <h1 className="citizen-page-title">
            {lang === 'hi' ? 'निकटतम प्रमाणित प्रयोगशालाएं' : 'Nearby Participating Diagnostic Labs'}
          </h1>
          <p className="citizen-page-subtitle">
            {lang === 'hi'
              ? 'सत्यापित दरों, दूरी, प्रमाणन (NABL) और होम कलेक्शन सुविधा के आधार पर लैब की तुलना करें'
              : 'Compare verified test charges, credentials, physical distance, and doorstep pickup options'}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0.45rem 0.75rem', width: '320px' }}>
          <MagnifyingGlassIcon style={{ width: '18px', color: '#64748b', marginRight: '0.5rem' }} />
          <input
            type="text"
            placeholder={lang === 'hi' ? 'लैब का नाम या इलाका खोजें...' : 'Search by lab name, sector, landmark...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterHomePickup}
              onChange={(e) => setFilterHomePickup(e.target.checked)}
            />
            {lang === 'hi' ? 'केवल होम कलेक्शन उपलब्ध' : 'Home Pickup Available'}
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={filterNablOnly}
              onChange={(e) => setFilterNablOnly(e.target.checked)}
            />
            {lang === 'hi' ? 'केवल NABL मान्यता प्राप्त' : 'NABL / CAP Accredited Only'}
          </label>
        </div>
      </div>

      {/* Labs List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {filteredLabs.map(lab => (
          <div key={lab.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>{lab.name}</h3>
                  {lab.nabl && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                      <CheckBadgeIcon style={{ width: '14px' }} /> NABL
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                    <MapPinIcon style={{ width: '15px', color: '#15803d' }} /> {lab.distance} · {lab.address}
                  </span>
                  <span>⭐ <strong>{lab.rating}</strong> ({lab.reviewCount} patient reviews)</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => navigate('/portal/appointments/book')}
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', padding: '0.45rem 0.9rem' }}
                >
                  Book In-Lab Slot
                </button>
                {lab.homePickup && (
                  <button
                    onClick={() => navigate('/portal/home-collection')}
                    style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#15803d', padding: '0.45rem 0.85rem', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                  >
                    Doorstep Pickup
                  </button>
                )}
              </div>
            </div>

            {/* Price Comparison Strip for Common Tests */}
            <div style={{ background: '#f8fafc', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                {lang === 'hi' ? 'सत्यापित जांच दरें (पारदर्शी मूल्य)' : 'Verified Laboratory Pricing:'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>CBC (Hemogram)</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>₹ {lab.priceList.cbc}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Lipid Profile</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>₹ {lab.priceList.lipid}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Fasting Sugar</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>₹ {lab.priceList.sugar}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Thyroid (T3/T4/TSH)</span>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>₹ {lab.priceList.thyroid}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.85rem', fontSize: '0.8rem', color: '#64748b' }}>
              <span>🕒 Next Open Phlebotomy Slot: <strong style={{ color: '#15803d' }}>{lab.nextSlot}</strong></span>
              <span>🏠 Home Collection: <strong>{lab.homePickupFee}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

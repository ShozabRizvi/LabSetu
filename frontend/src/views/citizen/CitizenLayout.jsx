import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import './CitizenLayout.css';
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  UserCircleIcon,
  CalendarDaysIcon,
  DocumentChartBarIcon,
  CreditCardIcon,
  SquaresPlusIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  XMarkIcon,
  Bars3Icon,
  HomeModernIcon,
  SparklesIcon,
  BuildingOffice2Icon,
  BellAlertIcon,
  UserGroupIcon,
  LockClosedIcon,
  MicrophoneIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

export default function CitizenLayout() {
  const { currentUser, logout, activeUHID, activeMember } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Language state from global context
  const { lang, setLang, t } = useLanguage();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Lab Report Ready', desc: 'Your Complete Blood Count (CBC) report has been published.', time: '2 hours ago', read: false },
    { id: 2, title: 'Appointment Confirmed', desc: 'Appointment booked for tomorrow at 10:00 AM.', time: '1 day ago', read: false },
    { id: 3, title: 'Payment Receipt Available', desc: 'Invoice #INV-2026-1049 receipt is available for download.', time: '3 days ago', read: true }
  ]);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  const isProfileIncomplete = (!currentUser?.name || !currentUser?.phone || !currentUser?.address);
  const [isProfileToastDismissed, setIsProfileToastDismissed] = useState(false);

  // Auto-hide popup after 5000ms
  useEffect(() => {
    if (isProfileIncomplete) {
      setIsProfileToastDismissed(false);
      const timer = setTimeout(() => {
        setIsProfileToastDismissed(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [currentUser?.name, currentUser?.phone, currentUser?.address, isProfileIncomplete]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    localStorage.removeItem('labsetu_patient_session');
    localStorage.removeItem('labsetu_auth');
    localStorage.removeItem('labsetu_active_uhid');
    localStorage.removeItem('labsetu_active_member');
    sessionStorage.clear();
    await logout('citizen');
    navigate('/login');
  };

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/portal/tests?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="citizen-layout-container">
      {/* Top Header */}
      <header className="citizen-header">
        <div className="citizen-header-left">
          <button 
            className="citizen-mobile-menu-btn" 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            <Bars3Icon style={{ width: '24px', height: '24px' }} />
          </button>
          <NavLink to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <img src={logo} alt="LabSetu Logo" className="citizen-logo" />
            <span className="citizen-brand">
              Lab<span className="citizen-brand-highlight">Setu</span>
            </span>
          </NavLink>
          <span className="citizen-badge">
            {lang === 'hi' ? 'नागरिक पोर्टल' : 'Citizen Portal'}
          </span>
        </div>

        {/* Search and voice assistant entry */}
        <div className="citizen-header-center">
          <form onSubmit={handleGlobalSearch} className="citizen-search-wrapper" style={{ position: 'relative' }}>
            <MagnifyingGlassIcon className="citizen-search-icon" />
            <input
              type="text"
              placeholder={lang === 'hi' ? 'टेस्ट रिपोर्ट, बिल, जांच खोजें...' : 'Search test reports, diagnostic scans, bills...'}
              className="citizen-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => navigate('/portal/assistant')}
              aria-label={lang === 'hi' ? 'लैबसेतु AI वॉइस असिस्टेंट खोलें' : 'Open LabSetu AI voice assistant'}
              title={lang === 'hi' ? 'लैबसेतु AI से बात करें' : 'Talk to LabSetu AI'}
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#15803d',
                padding: '0.2rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <MicrophoneIcon style={{ width: '18px' }} />
            </button>
          </form>
        </div>

        {/* Right Header Navigation */}
        <div className="citizen-header-right">
          {/* Language Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: '#f8fafc', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
            <button
              type="button"
              onClick={() => setLang('en')}
              style={{
                border: 'none',
                background: lang === 'en' ? '#15803d' : 'transparent',
                color: lang === 'en' ? 'white' : '#64748b',
                padding: '0.2rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('hi')}
              style={{
                border: 'none',
                background: lang === 'hi' ? '#15803d' : 'transparent',
                color: lang === 'hi' ? 'white' : '#64748b',
                padding: '0.2rem 0.45rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              हिं
            </button>
          </div>

          <button 
            type="button" 
            className="citizen-header-link" 
            onClick={() => navigate('/portal/support')}
          >
            <QuestionMarkCircleIcon className="citizen-icon" /> {lang === 'hi' ? 'मदद एवं शिकायतें' : 'Help & Support'}
          </button>

          {/* Notifications Dropdown */}
          <div style={{ position: 'relative' }} ref={notifRef}>
            <button
              type="button"
              className="citizen-icon-btn"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              title="Notifications"
            >
              <BellIcon className="citizen-icon" />
              {unreadCount > 0 && <span className="citizen-notif-badge">{unreadCount}</span>}
            </button>

            {isNotificationsOpen && (
              <div className="citizen-dropdown notif-dropdown">
                <div className="notif-header">
                  <strong>Notifications</strong>
                  {unreadCount > 0 && (
                    <button type="button" className="notif-clear-btn" onClick={markAllRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.map(n => (
                    <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`}>
                      <div className="notif-title-row">
                        <span className="notif-title">{n.title}</span>
                        <span className="notif-time">{n.time}</span>
                      </div>
                      <p className="notif-desc">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu Dropdown */}
          <div style={{ position: 'relative' }} ref={userMenuRef}>
            <button
              type="button"
              className="citizen-user-btn"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <UserCircleIcon className="citizen-user-avatar" />
              <div className="citizen-user-meta">
                <span className="citizen-user-name">{activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : 'Patient')}</span>
                <span className="citizen-user-role">{activeMember && activeMember.relation !== 'Self' ? `${activeMember.relation} Profile` : 'Patient / Citizen'}</span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="citizen-dropdown user-dropdown">
                <div className="user-dropdown-header">
                  <strong>{activeMember?.name || (currentUser?.name && !currentUser.name.includes('@') ? currentUser.name : 'Patient')}</strong>
                  <span className="user-uhid">{activeUHID || currentUser?.uhid || '—'}</span>
                  <span className="user-email">{currentUser?.email}</span>
                </div>
                <div className="user-dropdown-links">
                  <NavLink 
                    to="/portal/profile" 
                    className="user-dropdown-link" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <UserCircleIcon style={{ width: '18px' }} /> My Health Profile
                  </NavLink>
                  <NavLink 
                    to="/portal/appointments" 
                    className="user-dropdown-link" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <CalendarDaysIcon style={{ width: '18px' }} /> My Bookings
                  </NavLink>
                  <NavLink 
                    to="/portal/reports" 
                    className="user-dropdown-link" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <DocumentChartBarIcon style={{ width: '18px' }} /> Diagnostic Reports
                  </NavLink>
                  <NavLink 
                    to="/portal/privacy" 
                    className="user-dropdown-link" 
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    <LockClosedIcon style={{ width: '18px' }} /> Privacy &amp; Consent
                  </NavLink>
                  <button 
                    type="button" 
                    className="user-dropdown-link logout-btn" 
                    onClick={handleLogout}
                  >
                    <ArrowRightOnRectangleIcon style={{ width: '18px' }} /> {lang === 'hi' ? 'लॉग आउट' : 'Sign Out'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="citizen-body">
        {/* Sidebar Navigation */}
        <aside className={`citizen-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <NavLink 
            to="/portal/appointments/book" 
            className="citizen-book-btn"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            + {lang === 'hi' ? 'जांच बुक करें' : 'Book Appointment'}
          </NavLink>

          <nav className="citizen-nav">
            <NavLink
              to="/portal/assistant"
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <SparklesIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'जाँच सहायक' : 'LabSetu Assistant'}
            </NavLink>
            <NavLink 
              to="/portal/dashboard" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <SquaresPlusIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </NavLink>

            <NavLink 
              to="/portal/tests" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <MagnifyingGlassIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'जांच व दरें खोजें' : 'Find Tests & Prices'}
            </NavLink>

            <NavLink 
              to="/portal/appointments" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <CalendarDaysIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'मेरी बुकिंग्स (4-स्टेज ट्रैकर)' : 'My Bookings & Tracker'}
            </NavLink>

            <NavLink 
              to="/portal/home-collection" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <HomeModernIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'होम सैंपल कलेक्शन' : 'Home Collection'}
            </NavLink>

            <NavLink 
              to="/portal/reports" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <DocumentChartBarIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'लैब रिपोर्ट्स' : 'My Reports'}
            </NavLink>

            <NavLink 
              to="/portal/explainer" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <SparklesIcon className="citizen-nav-icon" />
              Clinova
            </NavLink>

            <NavLink 
              to="/portal/labs" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BuildingOffice2Icon className="citizen-nav-icon" />
              {lang === 'hi' ? 'निकटतम लैब्स' : 'Nearby Labs'}
            </NavLink>

            <NavLink 
              to="/portal/reminders" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <BellAlertIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'फास्टिंग व रिमाइंडर' : 'Reminders & Prep'}
            </NavLink>

            <NavLink 
              to="/portal/family" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserGroupIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'पारिवारिक प्रोफ़ाइल' : 'Family Profiles'}
            </NavLink>

            <NavLink 
              to="/portal/bills" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <CreditCardIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'बिल एवं रसीदें' : 'Bills & Receipts'}
            </NavLink>

            <NavLink 
              to="/portal/privacy" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <LockClosedIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'गोपनीयता व सहमति' : 'Privacy Settings'}
            </NavLink>

            <NavLink 
              to="/portal/profile" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <UserCircleIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}
            </NavLink>
          </nav>
        </aside>

        {/* Content Outlet with Lang Prop & Sliding Page Transition */}
        <main className="citizen-main-content">
          <div key={location.pathname} className="layout-slide-wrapper">
            <Outlet context={{ lang }} />
          </div>
        </main>
      </div>

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="citizen-modal-overlay">
          <div className="citizen-modal-box">
            <div className="citizen-modal-header">
              <h3>LabSetu Citizen Support Desk</h3>
              <button 
                type="button" 
                className="citizen-modal-close" 
                onClick={() => setIsHelpModalOpen(false)}
              >
                <XMarkIcon style={{ width: '20px' }} />
              </button>
            </div>
            <div className="citizen-modal-body">
              <p>Welcome to the LabSetu Patient Helpdesk. How can we assist you today?</p>
              <div className="help-options-grid">
                <div className="help-option-item">
                  <strong>📞 Patient Helpline</strong>
                  <p>1800-200-8899 (Toll Free, 6:30 AM - 10:00 PM)</p>
                </div>
                <div className="help-option-item">
                  <strong>📧 Email Support</strong>
                  <p>support@labsetu.com</p>
                </div>
                <div className="help-option-item">
                  <strong>⏱️ Report Release Status</strong>
                  <p>Check the "My Reports" tab for real-time verification and instant PDF downloads.</p>
                </div>
                <div className="help-option-item">
                  <strong>🏥 Doorstep Phlebotomy</strong>
                  <p>Book home collection from "Home Collection" or call dispatch at +91 98765 43210.</p>
                </div>
              </div>
            </div>
            <div className="citizen-modal-footer">
              <button 
                type="button" 
                className="citizen-modal-btn" 
                onClick={() => setIsHelpModalOpen(false)}
              >
                Close Support Desk
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redesigned Boxy Bottom-Right Profile Incomplete Toast */}
      {isProfileIncomplete && !isProfileToastDismissed && location.pathname !== '/portal/profile' && (
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
              onClick={() => setIsProfileToastDismissed(true)}
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
            Your details are still in progress. Complete your profile by pressing this button.
          </p>

          <button
            type="button"
            onClick={() => navigate('/portal/profile')}
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
            Complete Profile
          </button>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';
import { useAuth } from '../../context/AuthContext';
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
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Language state: 'en' | 'hi'
  const [lang, setLang] = useState(() => localStorage.getItem('labsetu_language') || 'en');

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Lab Report Ready', desc: 'Your Complete Blood Count (CBC) report has been published.', time: '2 hours ago', read: false },
    { id: 2, title: 'Appointment Confirmed', desc: 'Appointment booked for tomorrow at 10:00 AM.', time: '1 day ago', read: false },
    { id: 3, title: 'Payment Receipt Available', desc: 'Invoice #INV-2026-1049 receipt is available for download.', time: '3 days ago', read: true }
  ]);

  const userMenuRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('labsetu_language', lang);
  }, [lang]);

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

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const handleVoiceSearch = () => {
    setIsVoiceListening(true);
    setTimeout(() => {
      setIsVoiceListening(false);
      setSearchQuery('Complete Blood Count');
      navigate('/portal/tests');
    }, 2000);
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

        {/* Global Search with Voice Assistant Simulation */}
        <div className="citizen-header-center">
          <form onSubmit={handleGlobalSearch} className="citizen-search-wrapper" style={{ position: 'relative' }}>
            <MagnifyingGlassIcon className="citizen-search-icon" />
            <input
              type="text"
              placeholder={isVoiceListening 
                ? (lang === 'hi' ? '🎙️ सुन रहे हैं... बोलिए (उदा. "सीबीसी टेस्ट")' : '🎙️ Listening... speak test name...') 
                : (lang === 'hi' ? 'टेस्ट रिपोर्ट, बिल, जांच खोजें...' : 'Search test reports, diagnostic scans, bills...')}
              className="citizen-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              title={lang === 'hi' ? 'आवाज़ द्वारा खोजें' : 'Voice Search'}
              style={{
                position: 'absolute',
                right: '0.6rem',
                top: '50%',
                transform: 'translateY(-50%)',
                background: isVoiceListening ? '#fee2e2' : 'none',
                border: 'none',
                cursor: 'pointer',
                color: isVoiceListening ? '#ef4444' : '#64748b',
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
            onClick={() => setIsHelpModalOpen(true)}
          >
            <QuestionMarkCircleIcon className="citizen-icon" /> {lang === 'hi' ? 'मदद' : 'Help & Support'}
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
                <span className="citizen-user-name">{currentUser?.name || 'Ramesh Sharma'}</span>
                <span className="citizen-user-role">Patient / Citizen</span>
              </div>
            </button>

            {isUserMenuOpen && (
              <div className="citizen-dropdown user-dropdown">
                <div className="user-dropdown-header">
                  <strong>{currentUser?.name || 'Ramesh Sharma'}</strong>
                  <span className="user-uhid">{currentUser?.uhid || 'UHID-2026-8901'}</span>
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
                    <ArrowRightOnRectangleIcon style={{ width: '18px' }} /> Sign Out
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
              {lang === 'hi' ? 'एआई रिपोर्ट एक्सप्लेनर' : 'AI Report Explainer'}
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
              to="/portal/support" 
              className={({ isActive }) => `citizen-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <QuestionMarkCircleIcon className="citizen-nav-icon" />
              {lang === 'hi' ? 'मदद एवं शिकायतें' : 'Support & Tickets'}
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

          <div className="citizen-sidebar-footer">
            <div className="support-card">
              <span className="support-badge">{lang === 'hi' ? 'हेल्पलाइन' : 'Helpline'}</span>
              <p className="support-text">{lang === 'hi' ? '24x7 आपातकालीन सहायता' : 'Need urgent assistance?'}</p>
              <a href="tel:18002008899" className="support-phone">📞 1800-200-8899</a>
            </div>
            <button type="button" className="citizen-logout-sidebar" onClick={handleLogout}>
              <ArrowRightOnRectangleIcon style={{ width: '18px' }} /> {lang === 'hi' ? 'लॉग आउट' : 'Sign Out'}
            </button>
          </div>
        </aside>

        {/* Content Outlet with Lang Prop */}
        <main className="citizen-main-content">
          <Outlet context={{ lang }} />
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
    </div>
  );
}

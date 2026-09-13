import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';
import './MainLayout.css';
import { 
  MagnifyingGlassIcon, 
  QuestionMarkCircleIcon, 
  Cog6ToothIcon, 
  PlayCircleIcon, 
  BellIcon, 
  UserCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ComputerDesktopIcon,
  CameraIcon,
  IdentificationIcon,
  BuildingOfficeIcon,
  ListBulletIcon,
  DocumentTextIcon,
  StarIcon,
  ChatBubbleLeftIcon,
  ClipboardDocumentIcon,
  CheckBadgeIcon,
  CalendarIcon,
  WalletIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  ReceiptRefundIcon,
  GlobeAltIcon,
  FilmIcon,
  UserGroupIcon,
  ArrowsRightLeftIcon,
  UserPlusIcon,
  DocumentCheckIcon,
  ArchiveBoxIcon,
  ChartPieIcon,
  Squares2X2Icon,
  InformationCircleIcon,
  CalculatorIcon,
  DocumentIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  UserIcon,
  CurrencyRupeeIcon,
  EnvelopeIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

export default function MainLayout() {
  const location = useLocation();
  const [isBusinessExpanded, setIsBusinessExpanded] = useState(false);
  const [isCasesExpanded, setIsCasesExpanded] = useState(false);
  const [isLabExpanded, setIsLabExpanded] = useState(false);
  const [isUsgExpanded, setIsUsgExpanded] = useState(false);
  const [isXrayExpanded, setIsXrayExpanded] = useState(false);
  const [isManageExpanded, setIsManageExpanded] = useState(false);
  const [isSetupExpanded, setIsSetupExpanded] = useState(false);
  const [isUserMenuExpanded, setIsUserMenuExpanded] = useState(false);
  const [isNewNavEnabled, setIsNewNavEnabled] = useState(true);

  const setupDropdownRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (setupDropdownRef.current && !setupDropdownRef.current.contains(event.target)) {
        setIsSetupExpanded(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuExpanded(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length > 1) {
      const lastPart = pathParts[pathParts.length - 1];
      const title = lastPart.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
      document.title = `LabSetu - ${title}`;
    } else {
      document.title = 'LabSetu';
    }
  }, [location]);

  return (
    <div className="layout-container">
      {/* Top Header */}
      <header className="layout-header">
        <div className="layout-header-left">
          <img src={logo} alt="LabSetu Logo" className="layout-logo" />
          <span className="layout-brand">Lab<span className="layout-brand-highlight">Setu</span></span>
        </div>
        <div className="layout-header-center">
          <div className="layout-search-wrapper">
            <MagnifyingGlassIcon className="layout-icon search-icon" />
            <input 
              type="text" 
              placeholder="Search any bills, reports" 
              className="layout-search-input" 
            />
          </div>
        </div>
        <div className="layout-header-right">
          <a href="#help" className="layout-header-link"><QuestionMarkCircleIcon className="layout-icon" /> Help</a>
          
          {/* Setup Dropdown */}
          <div style={{position: 'relative'}} ref={setupDropdownRef}>
            <button 
              className="layout-header-link" 
              style={{background: 'none', border: 'none'}}
              onClick={() => setIsSetupExpanded(!isSetupExpanded)}
            >
              <Cog6ToothIcon className="layout-icon" /> Setup <ChevronDownIcon style={{width:'16px'}} />
            </button>

            <div className={`layout-setup-dropdown ${isSetupExpanded ? 'active' : ''}`}>
              <NavLink to="/app/setup/kyc" onClick={() => setIsSetupExpanded(false)}><IdentificationIcon/> KYC</NavLink>
              <NavLink to="/app/setup/center-details" onClick={() => setIsSetupExpanded(false)}><BuildingOfficeIcon/> Center details</NavLink>
              <NavLink to="/app/setup/ratelist" onClick={() => setIsSetupExpanded(false)}><ListBulletIcon/> Ratelist</NavLink>
              <NavLink to="/app/setup/letterhead" onClick={() => setIsSetupExpanded(false)}><DocumentTextIcon/> Letterhead</NavLink>
              <NavLink to="/app/setup/google-review" onClick={() => setIsSetupExpanded(false)}><StarIcon/> Build google review</NavLink>
              <NavLink to="/app/setup/sms" onClick={() => setIsSetupExpanded(false)}><ChatBubbleLeftIcon/> SMS</NavLink>
              <NavLink to="/app/setup/case-reg-no" onClick={() => setIsSetupExpanded(false)}><ClipboardDocumentIcon/> Case reg. no.</NavLink>
              <NavLink to="/app/setup/panels" onClick={() => setIsSetupExpanded(false)}><BeakerIcon/> Panels</NavLink>
              <NavLink to="/app/setup/proofread" onClick={() => setIsSetupExpanded(false)}><CheckBadgeIcon/> Proofread</NavLink>
            </div>
          </div>

          <a href="#video" className="layout-header-link"><PlayCircleIcon className="layout-icon" /> Watch Video</a>
          <button className="layout-icon-btn"><BellIcon className="layout-icon" /></button>
          
          {/* User Menu Dropdown */}
          <div style={{position: 'relative'}} ref={userMenuRef}>
            <button 
              className="layout-icon-btn" 
              onClick={() => setIsUserMenuExpanded(!isUserMenuExpanded)}
            >
              <UserCircleIcon className="layout-icon" />
            </button>

            <div className={`layout-user-dropdown ${isUserMenuExpanded ? 'active' : ''}`}>
              <div className="user-menu-header">
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem'}}>
                  <span style={{fontWeight:'700', fontSize:'1rem'}}>Shozab Rizvi</span>
                  <span style={{backgroundColor:'#22c55e', color:'white', padding:'0.15rem 0.4rem', borderRadius:'4px', fontSize:'0.7rem', fontWeight:'600'}}>Account owner</span>
                </div>
                <div style={{color:'#6b7280', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:'0.25rem'}}>
                  Lab ID #: 61326885 
                  <ClipboardDocumentIcon style={{width:'16px', cursor:'pointer'}} className="layout-icon-hover" />
                </div>
              </div>
              
              <div className="user-menu-highlight">
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <CurrencyRupeeIcon style={{width:'18px'}} />
                  <span>My today's total : Rs.0</span>
                </div>
                <ChevronDownIcon style={{width:'16px'}} />
              </div>

              <div className="user-menu-links">
                <a className="user-menu-link" onClick={() => setIsUserMenuExpanded(false)}><UserIcon style={{width:'18px'}} /> My account</a>
                <a className="user-menu-link" onClick={() => setIsUserMenuExpanded(false)}><BeakerIcon style={{width:'18px'}} /> Lab account</a>
                <a className="user-menu-link" onClick={() => setIsUserMenuExpanded(false)}><PlusCircleIcon style={{width:'18px'}} /> Setup a new lab</a>
                <a className="user-menu-link" onClick={() => setIsUserMenuExpanded(false)}><EnvelopeIcon style={{width:'18px'}} /> Email subscription preferences</a>
              </div>

              <div className="user-menu-footer">
                <span>Enable new navigation</span>
                <label className="toggle-switch">
                  <input type="checkbox" checked={isNewNavEnabled} onChange={() => setIsNewNavEnabled(!isNewNavEnabled)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Layout Body */}
      <div className="layout-body">
        {/* Left Sidebar */}
        <aside className="layout-sidebar">
          <NavLink to="/app/cases/new-bill" className="layout-new-bill-btn" style={{textDecoration:'none', textAlign:'center', display:'block'}}>+ New bill</NavLink>
          <nav className="layout-nav">
            <NavLink to="/app/getting-started" className={({isActive}) => `layout-nav-item ${isActive ? 'layout-nav-active' : ''}`}>Getting Started</NavLink>
            <NavLink to="/app/dashboard" className={({isActive}) => `layout-nav-item ${isActive ? 'layout-nav-active' : ''}`}>Dashboard</NavLink>
            
            {/* Business Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsBusinessExpanded(true)}
              onMouseLeave={() => setIsBusinessExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsBusinessExpanded(!isBusinessExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <ChartBarIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> Business
                </div>
                {isBusinessExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isBusinessExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/business/daily" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><CalendarIcon/> Daily business</NavLink>
                  <NavLink to="/app/business/expenses" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><WalletIcon/> Expenses</NavLink>
                  <NavLink to="/app/business/due-reports" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentDuplicateIcon/> Due reports</NavLink>
                  <NavLink to="/app/business/activities" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><BellIcon/> Activities</NavLink>
                  <NavLink to="/app/business/referral" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><UsersIcon/> Referral business</NavLink>
                  <NavLink to="/app/business/case-wise" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentTextIcon/> Case wise report</NavLink>
                  <NavLink to="/app/business/analysis" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ChartBarIcon/> Business analysis</NavLink>
                  <NavLink to="/app/business/data-export" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ArrowDownTrayIcon/> Data export</NavLink>
                </div>
              </div>
            </div>

            {/* Cases Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsCasesExpanded(true)}
              onMouseLeave={() => setIsCasesExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsCasesExpanded(!isCasesExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <ClipboardDocumentListIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> Cases
                </div>
                {isCasesExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isCasesExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/business/daily" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ReceiptRefundIcon/> Bills</NavLink>
                  <NavLink to="/app/cases/outsource" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><GlobeAltIcon/> Outsource cases</NavLink>
                  <NavLink to="/app/cases/ctscan" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><FilmIcon/> Ct scan cases</NavLink>
                  <NavLink to="/app/cases/patients" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><UserGroupIcon/> Patients</NavLink>
                  <NavLink to="/app/cases/transactions" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ArrowsRightLeftIcon/> Transactions</NavLink>
                  <NavLink to="/app/cases/referral-doctors" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><UserPlusIcon/> Referral Doctors</NavLink>
                  <NavLink to="/app/cases/agents" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><IdentificationIcon/> Agents</NavLink>
                </div>
              </div>
            </div>

            {/* Lab Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsLabExpanded(true)}
              onMouseLeave={() => setIsLabExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsLabExpanded(!isLabExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <BeakerIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> Lab
                </div>
                {isLabExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isLabExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/lab/todays-reports" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentCheckIcon/> Today's reports</NavLink>
                  <NavLink to="/app/lab/search-reports" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><MagnifyingGlassIcon/> Search reports</NavLink>
                  <NavLink to="/app/lab/test-packages" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ArchiveBoxIcon/> Test packages</NavLink>
                  <NavLink to="/app/lab/analytics" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ChartPieIcon/> Lab analytics</NavLink>
                  <NavLink to="/app/lab/test-categories" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><Squares2X2Icon/> Test categories</NavLink>
                  <NavLink to="/app/lab/interpretations" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><InformationCircleIcon/> Interpretations</NavLink>
                  <NavLink to="/app/lab/test-counts" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><CalculatorIcon/> Test counts</NavLink>
                </div>
              </div>
            </div>

            {/* USG Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsUsgExpanded(true)}
              onMouseLeave={() => setIsUsgExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsUsgExpanded(!isUsgExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <ComputerDesktopIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> USG
                </div>
                {isUsgExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isUsgExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/usg/todays-cases" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentIcon/> Today's cases</NavLink>
                  <NavLink to="/app/usg/search-cases" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><MagnifyingGlassIcon/> Search cases</NavLink>
                  <NavLink to="/app/usg/report-templates" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentDuplicateIcon/> Report templates</NavLink>
                  <NavLink to="/app/usg/signatures" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><PencilSquareIcon/> Signatures</NavLink>
                </div>
              </div>
            </div>

            {/* Digital X-Ray Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsXrayExpanded(true)}
              onMouseLeave={() => setIsXrayExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsXrayExpanded(!isXrayExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <CameraIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> Digital X-ray
                </div>
                {isXrayExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isXrayExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/xray/todays-cases" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentIcon/> Today's cases</NavLink>
                  <NavLink to="/app/xray/search-cases" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><MagnifyingGlassIcon/> Search cases</NavLink>
                  <NavLink to="/app/xray/report-templates" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><DocumentDuplicateIcon/> Report templates</NavLink>
                  <NavLink to="/app/xray/signatures" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><PencilSquareIcon/> Signatures</NavLink>
                </div>
              </div>
            </div>

            {/* Manage Menu */}
            <div 
              className="layout-nav-group"
              onMouseEnter={() => setIsManageExpanded(true)}
              onMouseLeave={() => setIsManageExpanded(false)}
            >
              <button 
                className="layout-nav-item layout-nav-button"
                onClick={() => setIsManageExpanded(!isManageExpanded)}
              >
                <div style={{display:'flex', alignItems:'center', gap:'0.5rem'}}>
                  <Cog6ToothIcon className="layout-icon" style={{width:'18px', height:'18px'}} /> Manage
                </div>
                {isManageExpanded ? <ChevronUpIcon className="layout-nav-chevron" /> : <ChevronDownIcon className="layout-nav-chevron" />}
              </button>
              
              <div className={`layout-submenu-wrapper ${isManageExpanded ? 'expanded' : ''}`}>
                <div className="layout-submenu">
                  <NavLink to="/app/manage/browser-security" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><ShieldCheckIcon/> Browser security</NavLink>
                  <NavLink to="/app/manage/employee-login" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><UsersIcon/> Employee login</NavLink>
                  <NavLink to="/app/manage/doctor-access" className={({isActive}) => `layout-submenu-item ${isActive ? 'layout-nav-active' : ''}`}><UserIcon/> Doctor access</NavLink>
                </div>
              </div>
            </div>

          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="layout-main-content">
          <div key={location.pathname} className="layout-fade-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

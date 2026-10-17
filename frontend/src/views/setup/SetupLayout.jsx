import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './SetupLayout.css';
import { 
  BuildingOffice2Icon, 
  ListBulletIcon,
  DocumentTextIcon,
  StarIcon,
  ChatBubbleLeftEllipsisIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  CheckBadgeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

export default function SetupLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { to: 'kyc', label: 'KYC', icon: <IdentificationIcon className="setup-icon" /> },
    { to: 'center-details', label: 'Center details', icon: <BuildingOffice2Icon className="setup-icon" /> },
    { to: 'ratelist', label: 'Ratelist', icon: <ListBulletIcon className="setup-icon" /> },
    { to: 'letterhead', label: 'Letterhead', icon: <DocumentTextIcon className="setup-icon" /> },
    { to: 'google-review', label: 'Google review', icon: <StarIcon className="setup-icon" /> },
    { to: 'sms', label: 'SMS', icon: <ChatBubbleLeftEllipsisIcon className="setup-icon" /> },
    { to: 'case-reg-no', label: 'Case reg. no.', icon: <ClipboardDocumentCheckIcon className="setup-icon" /> },
    { to: 'panels', label: 'Panels', icon: <BeakerIcon className="setup-icon" /> },
    { to: 'proofread', label: 'Proofread', icon: <CheckBadgeIcon className="setup-icon" /> },
  ];

  const currentPathEnd = location.pathname.split('/').pop();
  const currentIndex = links.findIndex(l => l.to === currentPathEnd);

  const handlePrev = () => {
    if (currentIndex > 0) {
      navigate(`/app/setup/${links[currentIndex - 1].to}`);
    }
  };

  const handleNext = () => {
    if (currentIndex >= 0 && currentIndex < links.length - 1) {
      navigate(`/app/setup/${links[currentIndex + 1].to}`);
    } else {
      navigate('/app/dashboard');
    }
  };

  return (
    <div className="setup-layout-container">
      <aside className="setup-sidebar">
        <div className="setup-sidebar-header">
          <h2>Setup Guide</h2>
        </div>
        <nav className="setup-nav">
          {links.map(link => (
            <NavLink 
              key={link.to}
              to={`/app/setup/${link.to}`}
              className={({isActive}) => `setup-nav-item ${isActive ? 'active' : ''}`}
            >
              {link.icon}
              <span style={{flex: 1}}>{link.label}</span>
              <span className="setup-nav-chevron">›</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="setup-sidebar-footer">
          <button 
            type="button" 
            className="setup-skip-btn"
            onClick={() => navigate('/app/dashboard')}
          >
            Skip setup »
          </button>
          <div className="setup-footer-controls">
            <button 
              type="button" 
              className="setup-control-btn"
              onClick={handlePrev}
              disabled={currentIndex <= 0}
            >
              ‹ Prev
            </button>
            <button 
              type="button" 
              className="setup-control-btn primary"
              onClick={handleNext}
            >
              {currentIndex === links.length - 1 ? 'Finish ›' : 'Next ›'}
            </button>
          </div>
        </div>
      </aside>
      
      <main className="setup-main-content">
        <div key={location.pathname} className="layout-fade-wrapper setup-content-card">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

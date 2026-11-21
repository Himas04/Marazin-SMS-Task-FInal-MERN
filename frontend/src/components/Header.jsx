import React from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { IconMenu } from './Icons.jsx';

const TITLES = {
  dashboard: 'System Overview & Analytics',
  staff: 'Faculty & Staff Administration',
  students: 'Student Directory & Records',
  courses: 'Course Curriculum & Catalog',
  enrollments: 'Student Enrollments',
  attendance: 'Attendance Register',
  profile: 'Institutional Profile & Smart ID',
};

export const Header = ({ currentTab, onNavigateProfile, onToggleMenu }) => {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button 
          className="btn-icon mobile-menu-btn"
          onClick={onToggleMenu}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <IconMenu size={20} />
        </button>
        <h1 className="topbar-title">{TITLES[currentTab] || 'Dashboard'}</h1>
      </div>
      <div className="topbar-right">
        <span className="topbar-date" style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontWeight: 600 }}>
          {today}
        </span>
        <div 
          onClick={onNavigateProfile}
          title="View profile & ID card"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: '0.88rem',
            color: '#fff',
            boxShadow: '0 4px 14px var(--primary-glow), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            cursor: 'pointer',
            border: '2px solid #fff',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

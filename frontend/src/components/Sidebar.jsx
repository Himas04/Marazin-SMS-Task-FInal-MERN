import React from 'react';
import { 
  IconLayoutDashboard, 
  IconUsers, 
  IconBookOpen, 
  IconClipboardList, 
  IconCheckSquare, 
  IconLogOut, 
  IconGraduationCap,
  IconBriefcase,
  IconUser,
  IconX
} from './Icons.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export const Sidebar = ({ currentTab, onSelectTab, isOpen, onClose }) => {
  const { user, logout } = useAuth();

  let navItems;

  if (user?.role === 'admin') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { id: 'staff', label: 'Faculty & Staff', icon: IconBriefcase },
      { id: 'students', label: 'Students', icon: IconUsers },
      { id: 'courses', label: 'Courses', icon: IconBookOpen },
      { id: 'enrollments', label: 'Enrollments', icon: IconClipboardList },
      { id: 'attendance', label: 'Attendance', icon: IconCheckSquare },
      { id: 'profile', label: 'My ID & Profile', icon: IconUser },
    ];
  } else if (user?.role === 'staff') {
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { id: 'students', label: 'Students', icon: IconUsers },
      { id: 'courses', label: 'Courses', icon: IconBookOpen },
      { id: 'enrollments', label: 'Enrollments', icon: IconClipboardList },
      { id: 'attendance', label: 'Attendance', icon: IconCheckSquare },
      { id: 'profile', label: 'My ID & Profile', icon: IconUser },
    ];
  } else {
    // Student
    navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
      { id: 'courses', label: 'Available Courses', icon: IconBookOpen },
      { id: 'attendance', label: 'My Attendance', icon: IconCheckSquare },
      { id: 'profile', label: 'My Smart ID & Profile', icon: IconGraduationCap },
    ];
  }

  const handleNavClick = (tabId) => {
    onSelectTab(tabId);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${isOpen ? 'active' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div className="logo-badge">
              <IconGraduationCap size={24} />
            </div>
            <div className="logo-text">
              <h2>EduPulse</h2>
              <p>
                {user?.role === 'admin' ? 'Admin Hub' : user?.role === 'staff' ? 'Staff Portal' : 'Student Portal'}
              </p>
            </div>
          </div>

          <button 
            className="btn-icon mobile-close-btn"
            onClick={onClose}
            title="Close menu"
            aria-label="Close menu"
          >
            <IconX size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => handleNavClick(item.id)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div 
            className="user-profile-badge"
            style={{ cursor: 'pointer' }}
            onClick={() => handleNavClick('profile')}
            title="Click to view your profile & ID card"
          >
            <div className="user-info">
              <div className="user-name" title={user?.name || 'User'}>
                {user?.name || 'User'}
              </div>
              <div className="user-role">
                {user?.role === 'admin' ? 'Super Admin' : user?.role === 'staff' ? 'Faculty / Staff' : 'Student'}
              </div>
            </div>
            <button 
              className="btn-icon" 
              title="Sign out"
              onClick={(e) => {
                e.stopPropagation();
                logout();
              }}
            >
              <IconLogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

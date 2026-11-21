import React, { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { Header } from './components/Header.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { StaffPage } from './pages/StaffPage.jsx';
import { StudentsPage } from './pages/StudentsPage.jsx';
import { CoursesPage } from './pages/CoursesPage.jsx';
import { EnrollmentsPage } from './pages/EnrollmentsPage.jsx';
import { AttendancePage } from './pages/AttendancePage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { IconGraduationCap } from './components/Icons.jsx';

export const App = () => {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#fcfafb',
        color: 'var(--text-muted)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          boxShadow: '0 8px 24px var(--primary-glow)',
          animation: 'pulse 1.5s infinite ease-in-out',
          marginBottom: '20px',
        }}>
          <IconGraduationCap size={32} />
        </div>
        <p style={{ fontWeight: 700, letterSpacing: '0.05em', color: 'var(--primary-dark)' }}>Loading EduPulse Portal...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  // Guard: if student attempts to navigate to staff-only or admin-only tabs
  const isStudent = user.role === 'student';
  const effectiveTab = isStudent && (currentTab === 'staff' || currentTab === 'students' || currentTab === 'enrollments')
    ? 'dashboard'
    : currentTab;

  return (
    <div className="app-container">
      <Sidebar 
        currentTab={effectiveTab} 
        onSelectTab={setCurrentTab}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <div className="main-wrapper">
        <Header 
          currentTab={effectiveTab} 
          onNavigateProfile={() => setCurrentTab('profile')}
          onToggleMenu={() => setMobileMenuOpen((prev) => !prev)}
        />

        <main className="content-body">
          {effectiveTab === 'dashboard' && <Dashboard onNavigate={setCurrentTab} />}
          {effectiveTab === 'staff' && <StaffPage />}
          {effectiveTab === 'students' && <StudentsPage />}
          {effectiveTab === 'courses' && <CoursesPage />}
          {effectiveTab === 'enrollments' && <EnrollmentsPage />}
          {effectiveTab === 'attendance' && <AttendancePage />}
          {effectiveTab === 'profile' && <ProfilePage />}
        </main>
      </div>
    </div>
  );
};

export default App;

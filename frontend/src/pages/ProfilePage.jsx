import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { studentsApi, authApi } from '../api.js';
import { useToast } from '../components/Toast.jsx';
import { 
  IconGraduationCap, 
  IconPrinter, 
  IconCheckSquare, 
  IconLock, 
  IconUser
} from '../components/Icons.jsx';

export const ProfilePage = () => {
  const { user, refreshUser } = useAuth();
  const { addToast } = useToast();

  const [studentProfile, setStudentProfile] = useState(null);

  // Form states
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Password change states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user?.role === 'student') {
      loadStudentProfile();
    }
  }, [user]);

  const loadStudentProfile = async () => {
    try {
      const res = await studentsApi.getMyProfile();
      setStudentProfile(res.student);
      if (res.student?.phone) {
        setPhone(res.student.phone);
      }
    } catch (err) {
      console.error('Could not load student profile:', err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await authApi.updateProfile({ name, phone });
      addToast('Profile updated successfully!', 'success');
      if (refreshUser) refreshUser();
      if (user?.role === 'student') loadStudentProfile();
    } catch (err) {
      addToast(err.message || 'Failed to update profile', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast('New passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword({ currentPassword, newPassword });
      addToast('Password changed successfully!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setChangingPassword(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isStudent = user?.role === 'student';
  const attendanceRecords = studentProfile?.attendance || [];
  const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
  const attendanceRate = attendanceRecords.length > 0 
    ? Math.round((presentCount / attendanceRecords.length) * 100) 
    : 100;
  const enrollments = studentProfile?.enrollments || [];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.06) 0%, rgba(159, 18, 57, 0.03) 100%)',
        border: '1px solid rgba(128, 0, 32, 0.12)',
        boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '1.6rem',
            fontWeight: 800,
            boxShadow: '0 8px 25px var(--primary-glow), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            border: '2px solid #fff',
          }}>
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user?.name}</h2>
              <span className={`badge ${isStudent ? 'badge-info' : user?.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
                {user?.role?.toUpperCase()}
              </span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
              {isStudent 
                ? `Student ID: ${studentProfile?.studentId || user?.studentId || 'Pending'} • Enrolled Academy Scholar`
                : `${user?.email} • Institutional Account`}
            </p>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handlePrint}>
          <IconPrinter size={16} /> Print ID Card
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Column: Digital ID Card & Academic Standing */}
        <div>
          {/* Official Smart ID Card */}
          <div className="id-card">
            <div className="id-card-header">
              <div className="id-card-badge">
                <IconGraduationCap size={22} />
              </div>
              <div>
                <div className="id-card-title">EduPulse Institute of Technology</div>
                <div className="id-card-sub">
                  {isStudent ? 'OFFICIAL STUDENT SMART PASS' : user?.role === 'admin' ? 'SYSTEM ADMINISTRATOR PASS' : 'FACULTY & STAFF CREDENTIAL'}
                </div>
              </div>
            </div>

            <div className="id-card-body">
              <div className="id-card-avatar">
                {user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'EP'}
              </div>

              <div className="id-card-info">
                <div className="id-card-name">{user?.name}</div>
                <div className="id-card-number">
                  ID: {isStudent ? (studentProfile?.studentId || user?.studentId || 'STU-OFFICIAL') : `FAC-${user?._id?.slice(-6).toUpperCase()}`}
                </div>

                <div className="id-card-grid">
                  <div>
                    <div className="id-card-label">Institutional Email</div>
                    <div className="id-card-val" style={{ wordBreak: 'break-all' }}>{user?.email}</div>
                  </div>
                  <div>
                    <div className="id-card-label">Designation</div>
                    <div className="id-card-val">{isStudent ? 'Registered Student' : user?.role === 'admin' ? 'Super Administrator' : 'Academic Faculty'}</div>
                  </div>
                  {isStudent && (
                    <>
                      <div>
                        <div className="id-card-label">Gender / DOB</div>
                        <div className="id-card-val">
                          {studentProfile?.gender || '—'} • {studentProfile?.dateOfBirth ? new Date(studentProfile.dateOfBirth).toLocaleDateString() : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="id-card-label">Emergency Guardian</div>
                        <div className="id-card-val">
                          {studentProfile?.guardianName || 'On Record'}
                        </div>
                      </div>
                    </>
                  )}
                  <div>
                    <div className="id-card-label">Security Clearance</div>
                    <div className="id-card-val">
                      <span className="badge badge-success">
                        <span className="badge-dot" /> Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="id-card-footer">
              <div className="id-card-barcode">
                {[14, 22, 18, 24, 16, 24, 20, 16, 22, 18, 24, 14, 20, 24, 16, 22, 18, 24].map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} />
                ))}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
                VALID INSTITUTIONAL CREDENTIAL
              </div>
            </div>
          </div>

          {/* If Student: Academic Standing Gauges */}
          {isStudent && (
            <div className="card" style={{ marginTop: '24px' }}>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <IconCheckSquare size={18} style={{ color: 'var(--primary-light)' }} />
                Academic Standing & Attendance
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '18px' }}>
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Attendance Rate</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: attendanceRate >= 75 ? 'var(--success)' : 'var(--warning)', marginTop: '4px' }}>
                    {attendanceRate}%
                  </div>
                  <div style={{
                    height: '6px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '3px',
                    marginTop: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ height: '100%', width: `${attendanceRate}%`, background: attendanceRate >= 75 ? 'var(--success)' : 'var(--warning)' }} />
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Enrolled Courses</div>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--secondary)', marginTop: '4px' }}>
                    {enrollments.length}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Active Curricula
                  </div>
                </div>
              </div>

              {enrollments.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    My Current Enrolled Courses
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {enrollments.map((enr) => (
                      <div key={enr._id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                      }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{enr.course?.courseName || 'Course'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{enr.course?.courseCode} • Batch {enr.batch}</div>
                        </div>
                        <span className="badge badge-success">
                          <span className="badge-dot" /> {enr.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Edit Profile & Change Password */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Edit Profile Form */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconUser size={18} style={{ color: 'var(--primary-light)' }} />
              Personal Information
            </h3>

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Institutional Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
                <small style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Institutional email can only be changed by Administrator.
                </small>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatingProfile}
                style={{ marginTop: '8px' }}
              >
                {updatingProfile ? 'Saving...' : 'Update Details'}
              </button>
            </form>
          </div>

          {/* Change Password */}
          <div className="card">
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconLock size={18} style={{ color: 'var(--warning)' }} />
              Security & Password
            </h3>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                disabled={changingPassword}
                style={{ marginTop: '8px' }}
              >
                {changingPassword ? 'Updating Password...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

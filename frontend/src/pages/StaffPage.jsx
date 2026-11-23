import React, { useState, useEffect } from 'react';
import { staffApi, coursesApi } from '../api.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { 
  IconUsers, 
  IconPlus, 
  IconTrash, 
  IconEdit,
  IconMail, 
  IconPhone, 
  IconBriefcase, 
  IconShield,
  IconKey,
  IconDownload,
  IconList,
  IconGrid,
  IconBookOpen
} from '../components/Icons.jsx';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
  department: 'Academic Faculty',
  phone: '',
};

const DEPARTMENTS = [
  'All Departments',
  'Academic Faculty',
  'Computer Science',
  'Engineering & Tech',
  'Administration',
  'Admissions & Registrar',
];

export const StaffPage = () => {
  const [staffList, setStaffList] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All Departments');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [editingStaff, setEditingStaff] = useState(null);

  const [passwordResetCandidate, setPasswordResetCandidate] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchStaffAndCourses = async () => {
    try {
      setLoading(true);
      const [staffRes, crsRes] = await Promise.all([
        staffApi.getAll().catch(() => ({ staff: [] })),
        coursesApi.getAll().catch(() => ({ courses: [] })),
      ]);
      setStaffList(staffRes.staff || []);
      setCoursesList(crsRes.courses || []);
    } catch (err) {
      addToast(err.message || 'Failed to fetch staff data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaffAndCourses();
  }, []);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setFormData(INITIAL_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      department: staff.department || 'Academic Faculty',
      phone: staff.phone || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStaff) {
        await staffApi.update(editingStaff._id, {
          name: formData.name,
          department: formData.department,
          phone: formData.phone,
        });
        addToast('Staff details updated successfully!', 'success');
      } else {
        await staffApi.create(formData);
        addToast('Staff member provisioned successfully! They can now log in.', 'success');
      }
      setIsFormOpen(false);
      fetchStaffAndCourses();
    } catch (err) {
      addToast(err.message || 'Failed to save staff member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenResetPassword = (staff) => {
    setPasswordResetCandidate(staff);
    setNewPassword('');
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      addToast('Password must be at least 6 characters', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await staffApi.resetPassword(passwordResetCandidate._id, newPassword);
      addToast(`Password updated for ${passwordResetCandidate.name}!`, 'success');
      setPasswordResetCandidate(null);
      setNewPassword('');
    } catch (err) {
      addToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteCandidate) return;
    setSubmitting(true);
    try {
      await staffApi.delete(deleteCandidate._id);
      addToast('Staff member access revoked', 'success');
      setDeleteCandidate(null);
      fetchStaffAndCourses();
    } catch (err) {
      addToast(err.message || 'Failed to delete staff member', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (staffList.length === 0) {
      addToast('No staff records to export', 'error');
      return;
    }
    const headers = ['Name', 'Email', 'Department', 'Phone', 'Role', 'Date Joined'];
    const rows = staffList.map((s) => [
      `"${s.name}"`,
      `"${s.email}"`,
      `"${s.department || 'Academic Faculty'}"`,
      `"${s.phone || ''}"`,
      `"${s.role}"`,
      `"${s.createdAt ? new Date(s.createdAt).toLocaleDateString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `faculty_directory_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Staff directory exported to CSV!', 'success');
  };

  const filteredStaff = staffList.filter((s) => {
    const term = search.toLowerCase();
    const matchesSearch = (
      s.name?.toLowerCase().includes(term) ||
      s.email?.toLowerCase().includes(term) ||
      s.department?.toLowerCase().includes(term)
    );
    const matchesDept = selectedDept === 'All Departments' || s.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  // KPI calculations
  const totalStaff = staffList.length;
  const facultyCount = staffList.filter(s => (s.department || '').toLowerCase().includes('faculty') || (s.department || '').toLowerCase().includes('science') || (s.department || '').toLowerCase().includes('tech')).length;
  const adminStaffCount = totalStaff - facultyCount;

  return (
    <div>
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.06) 0%, rgba(159, 18, 57, 0.03) 100%)',
        border: '1px solid rgba(128, 0, 32, 0.12)',
        boxShadow: 'var(--shadow-md)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 28px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-info">
              <IconShield size={12} /> Institutional Command
            </span>
            <span className="badge badge-success">
              <span className="badge-dot" /> Faculty Directory
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Faculty & Staff Administration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', maxWidth: '580px' }}>
            Provision instructor and administrative accounts, manage departments, oversee teaching loads, and issue password credentials.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <IconDownload size={16} /> Export Directory
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <IconPlus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Faculty & Staff</div>
            <div className="stat-val">{loading ? '-' : totalStaff}</div>
          </div>
          <div className="stat-icon"><IconUsers size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Teaching Faculty</div>
            <div className="stat-val" style={{ color: 'var(--primary)' }}>{loading ? '-' : facultyCount}</div>
          </div>
          <div className="stat-icon"><IconBriefcase size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Administrative Staff</div>
            <div className="stat-val" style={{ color: 'var(--secondary)' }}>{loading ? '-' : adminStaffCount}</div>
          </div>
          <div className="stat-icon"><IconShield size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Curricula Managed</div>
            <div className="stat-val">{loading ? '-' : coursesList.length}</div>
          </div>
          <div className="stat-icon"><IconBookOpen size={24} /></div>
        </div>
      </div>

      {/* Toolbar & Department Filters */}
      <div className="card toolbar" style={{ marginBottom: '20px' }}>
        <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="search-box" style={{ maxWidth: '320px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search faculty by name, email, or dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Department Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', maxWidth: '100%' }}>
            {DEPARTMENTS.map((dept) => {
              const active = selectedDept === dept;
              return (
                <button
                  key={dept}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: active ? 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)' : 'rgba(128, 0, 32, 0.05)',
                    color: active ? '#fff' : 'var(--text-main)',
                    fontWeight: 700,
                    fontSize: '0.78rem',
                    padding: '5px 12px',
                    whiteSpace: 'nowrap',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                  }}
                  onClick={() => setSelectedDept(dept)}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'inline-flex', background: 'rgba(128, 0, 32, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
          <button
            type="button"
            className="btn-icon"
            style={{
              background: viewMode === 'cards' ? '#fff' : 'transparent',
              color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-dim)',
              boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
              padding: '6px',
            }}
            title="Card Directory View"
            onClick={() => setViewMode('cards')}
          >
            <IconGrid size={16} />
          </button>
          <button
            type="button"
            className="btn-icon"
            style={{
              background: viewMode === 'table' ? '#fff' : 'transparent',
              color: viewMode === 'table' ? 'var(--primary)' : 'var(--text-dim)',
              boxShadow: viewMode === 'table' ? 'var(--shadow-sm)' : 'none',
              padding: '6px',
            }}
            title="Table View"
            onClick={() => setViewMode('table')}
          >
            <IconList size={16} />
          </button>
        </div>
      </div>

      {/* Directory Content: Cards or Table */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading faculty directory...
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <IconUsers size={36} className="empty-state-icon" />
            <h3>No Staff Members Found</h3>
            <p>Try clearing filters or provision a new faculty staff account above.</p>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        /* CARDS DIRECTORY VIEW */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px' }}>
          {filteredStaff.map((staff) => {
            const initials = staff.name
              ? staff.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
              : 'ST';

            return (
              <div key={staff._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--secondary) 0%, #1e40af 100%)',
                        color: '#fff',
                        fontWeight: 800,
                        fontSize: '1.05rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(30, 64, 175, 0.25)',
                      }}>
                        {initials}
                      </div>

                      <div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {staff.name}
                        </h4>
                        <span className="badge badge-info" style={{ fontSize: '0.72rem', marginTop: '2px' }}>
                          {staff.department || 'Academic Faculty'}
                        </span>
                      </div>
                    </div>

                    <span className="badge badge-success">
                      <span className="badge-dot" /> Active
                    </span>
                  </div>

                  {/* Contact Details */}
                  <div style={{
                    fontSize: '0.82rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '16px',
                    padding: '10px 12px',
                    background: 'rgba(128, 0, 32, 0.03)',
                    borderRadius: 'var(--radius-md)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconMail size={14} style={{ color: 'var(--primary)' }} />
                      <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{staff.email}</span>
                    </div>
                    {staff.phone ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <IconPhone size={14} style={{ color: 'var(--primary)' }} />
                        <span>{staff.phone}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-dim)' }}>
                        <IconPhone size={14} /> <span>Phone unlisted</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '5px 10px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => handleOpenResetPassword(staff)}
                  >
                    <IconKey size={14} /> Reset Pass
                  </button>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      title="Edit Staff Member"
                      onClick={() => handleOpenEdit(staff)}
                    >
                      <IconEdit size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ color: '#f87171' }}
                      title="Revoke Staff Access"
                      onClick={() => setDeleteCandidate(staff)}
                    >
                      <IconTrash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="card" style={{ padding: 0 }}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Faculty / Staff Member</th>
                  <th>Institutional Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStaff.map((staff) => (
                  <tr key={staff._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{staff.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Joined {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.86rem' }}>
                      {staff.email}
                    </td>
                    <td>
                      <span className="badge badge-info">{staff.department || 'Academic Faculty'}</span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {staff.phone || '—'}
                    </td>
                    <td>
                      <span className="badge badge-success">
                        <span className="badge-dot" /> Faculty Staff
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="Reset Password"
                          onClick={() => handleOpenResetPassword(staff)}
                        >
                          <IconKey size={14} /> Password
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          title="Edit Staff Member"
                          onClick={() => handleOpenEdit(staff)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: '#f87171' }}
                          title="Revoke Staff Access"
                          onClick={() => setDeleteCandidate(staff)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingStaff ? `Edit Faculty Staff: ${editingStaff.name}` : 'Provision New Staff Member'}
        maxWidth="580px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="staff-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingStaff ? 'Save Changes' : 'Create Staff Account')}
            </button>
          </>
        }
      >
        <form id="staff-form" onSubmit={handleSaveStaff}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Dr. Jonathan Vance"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="faculty@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={Boolean(editingStaff)} // Email cannot be edited once created
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                className="form-select"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                required
              >
                <option value="Academic Faculty">Academic Faculty</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Engineering & Tech">Engineering & Tech</option>
                <option value="Administration">Administration</option>
                <option value="Admissions & Registrar">Admissions & Registrar</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            {!editingStaff && (
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 555-0182"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Admin Reset Password Modal */}
      <Modal
        isOpen={Boolean(passwordResetCandidate)}
        onClose={() => setPasswordResetCandidate(null)}
        title={`Reset Password: ${passwordResetCandidate?.name}`}
        maxWidth="460px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setPasswordResetCandidate(null)}>
              Cancel
            </button>
            <button type="submit" form="reset-pass-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Resetting...' : 'Set New Password'}
            </button>
          </>
        }
      >
        <form id="reset-pass-form" onSubmit={handleConfirmResetPassword}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
            Set a new password for staff account <strong style={{ color: 'var(--text-main)' }}>{passwordResetCandidate?.email}</strong>.
          </p>
          <div className="form-group">
            <label className="form-label">New Password *</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter at least 6 characters..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Revoke Staff Access"
        maxWidth="450px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteStaff} disabled={submitting}>
              {submitting ? 'Revoking...' : 'Revoke Account'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to revoke system access for{' '}
          <strong style={{ color: 'var(--text-main)' }}>{deleteCandidate?.name}</strong> ({deleteCandidate?.email})?
          They will no longer be able to log in to the faculty portal.
        </p>
      </Modal>
    </div>
  );
};

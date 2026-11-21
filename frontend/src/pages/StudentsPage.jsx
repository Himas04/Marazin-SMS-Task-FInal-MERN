import React, { useState, useEffect } from 'react';
import { studentsApi, coursesApi, enrollmentsApi } from '../api.js';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { StudentDossierModal } from '../components/StudentDossierModal.jsx';
import { 
  IconSearch, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconUsers,
  IconEye,
  IconCheckSquare,
  IconBookOpen,
  IconDownload,
  IconPrinter,
  IconList,
  IconGrid,
  IconAlertCircle,
  IconPhone,
  IconMail
} from '../components/Icons.jsx';

const INITIAL_FORM = {
  studentId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  dateOfBirth: '',
  address: '',
  guardianName: '',
  guardianPhone: '',
  status: 'Active',
};

export const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState('all'); // 'all' | 'active' | 'at-risk' | 'inactive'
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  const [loading, setLoading] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [profileCandidate, setProfileCandidate] = useState(null);
  const [enrollCandidate, setEnrollCandidate] = useState(null);
  const [enrollForm, setEnrollForm] = useState({ courseId: '', batch: '2026-Cohort' });
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchCourses = async () => {
    try {
      const res = await coursesApi.getAll();
      setCoursesList(res.courses || []);
    } catch (err) {
      console.error('Failed to load courses for enrollment:', err);
    }
  };

  const fetchStudents = async (page = 1) => {
    try {
      setLoading(true);
      const res = await studentsApi.getAll({
        search,
        status: statusFilter,
        page,
        limit: pagination.limit,
      });
      setStudents(res.students || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch students', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    fetchStudents(1);
  }, [search, statusFilter]);

  const handleOpenCreate = () => {
    setEditingStudent(null);
    setFormData({
      ...INITIAL_FORM,
      studentId: `STU${Math.floor(1000 + Math.random() * 9000)}`,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      gender: student.gender || 'Male',
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      address: student.address || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      status: student.status || 'Active',
    });
    setIsFormOpen(true);
  };

  const handleSaveStudent = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingStudent) {
        await studentsApi.update(editingStudent._id, formData);
        addToast('Student details updated successfully!', 'success');
      } else {
        await studentsApi.create(formData);
        addToast('Student registered & provisioned successfully!', 'success');
      }
      setIsFormOpen(false);
      fetchStudents(pagination.page);
    } catch (err) {
      addToast(err.message || 'Error saving student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setSubmitting(true);
    try {
      await studentsApi.delete(deleteCandidate._id);
      addToast('Student record permanently removed', 'success');
      setDeleteCandidate(null);
      fetchStudents(pagination.page);
    } catch (err) {
      addToast(err.message || 'Failed to delete student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenQuickEnroll = (student) => {
    setEnrollCandidate(student);
    setEnrollForm({
      courseId: coursesList[0]?._id || '',
      batch: '2026-Cohort',
    });
  };

  const handleConfirmEnroll = async (e) => {
    e.preventDefault();
    if (!enrollForm.courseId) {
      addToast('Please select a course to enroll', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await enrollmentsApi.create({
        student: enrollCandidate._id,
        course: enrollForm.courseId,
        batch: enrollForm.batch || '2026-Cohort',
      });
      addToast(`Enrolled ${enrollCandidate.firstName} into course!`, 'success');
      setEnrollCandidate(null);
      fetchStudents(pagination.page);
    } catch (err) {
      addToast(err.message || 'Failed to enroll student', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      addToast('No student records to export', 'error');
      return;
    }
    const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 'Gender', 'Status', 'Attendance Rate %', 'Courses Enrolled'];
    const rows = students.map((s) => [
      `"${s.studentId}"`,
      `"${s.firstName}"`,
      `"${s.lastName}"`,
      `"${s.email}"`,
      `"${s.phone || ''}"`,
      `"${s.gender || ''}"`,
      `"${s.status}"`,
      s.attendanceRate !== undefined ? `${s.attendanceRate}%` : '100%',
      s.enrollmentCount || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Student roster exported to CSV!', 'success');
  };

  const handlePrintRoster = () => {
    window.print();
  };

  // Filter students by quick filter pills
  const filteredStudents = students.filter((s) => {
    if (quickFilter === 'active') return s.status === 'Active';
    if (quickFilter === 'inactive') return s.status === 'Inactive';
    if (quickFilter === 'at-risk') return (s.attendanceRate !== undefined && s.attendanceRate < 75);
    return true;
  });

  // Calculate live roster KPIs
  const totalInPage = students.length;
  const activeCount = students.filter(s => s.status === 'Active').length;
  const atRiskCount = students.filter(s => s.attendanceRate !== undefined && s.attendanceRate < 75).length;
  const avgAttendance = totalInPage > 0 
    ? Math.round(students.reduce((acc, s) => acc + (s.attendanceRate || 100), 0) / totalInPage) 
    : 100;

  return (
    <div>
      {/* Top KPI Summary Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Registered Scholars</div>
            <div className="stat-val">{pagination.total || totalInPage}</div>
          </div>
          <div className="stat-icon"><IconUsers size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Active Enrollment Status</div>
            <div className="stat-val" style={{ color: 'var(--success)' }}>{activeCount}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}>
            <IconCheckSquare size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Average Attendance Rate</div>
            <div className="stat-val" style={{ color: avgAttendance >= 75 ? 'var(--success)' : 'var(--warning)' }}>
              {avgAttendance}%
            </div>
          </div>
          <div className="stat-icon"><IconCheckSquare size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Attendance At-Risk (&lt;75%)</div>
            <div className="stat-val" style={{ color: atRiskCount > 0 ? 'var(--danger)' : 'var(--text-main)' }}>
              {atRiskCount}
            </div>
          </div>
          <div className="stat-icon" style={{ background: atRiskCount > 0 ? 'rgba(220, 38, 38, 0.1)' : undefined, color: atRiskCount > 0 ? 'var(--danger)' : undefined }}>
            <IconAlertCircle size={24} />
          </div>
        </div>
      </div>

      {/* Action Toolbar & Filters */}
      <div className="card toolbar" style={{ marginBottom: '20px' }}>
        <div className="toolbar-left" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div className="search-box">
            <span className="search-icon"><IconSearch size={18} /></span>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by ID, name, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '150px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          {/* Quick Filter Tabs */}
          <div style={{ display: 'inline-flex', background: 'rgba(128, 0, 32, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: quickFilter === 'all' ? '#fff' : 'transparent',
                color: quickFilter === 'all' ? 'var(--primary)' : 'var(--text-dim)',
                boxShadow: quickFilter === 'all' ? 'var(--shadow-sm)' : 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px',
              }}
              onClick={() => setQuickFilter('all')}
            >
              All ({students.length})
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: quickFilter === 'active' ? '#fff' : 'transparent',
                color: quickFilter === 'active' ? 'var(--success)' : 'var(--text-dim)',
                boxShadow: quickFilter === 'active' ? 'var(--shadow-sm)' : 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px',
              }}
              onClick={() => setQuickFilter('active')}
            >
              Active
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: quickFilter === 'at-risk' ? '#fff' : 'transparent',
                color: quickFilter === 'at-risk' ? 'var(--danger)' : 'var(--text-dim)',
                boxShadow: quickFilter === 'at-risk' ? 'var(--shadow-sm)' : 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px',
              }}
              onClick={() => setQuickFilter('at-risk')}
            >
              At-Risk (&lt;75%) {atRiskCount > 0 && `(${atRiskCount})`}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: quickFilter === 'inactive' ? '#fff' : 'transparent',
                color: quickFilter === 'inactive' ? 'var(--text-main)' : 'var(--text-dim)',
                boxShadow: quickFilter === 'inactive' ? 'var(--shadow-sm)' : 'none',
                fontWeight: 700,
                fontSize: '0.78rem',
                padding: '4px 10px',
              }}
              onClick={() => setQuickFilter('inactive')}
            >
              Inactive
            </button>
          </div>
        </div>

        {/* View Mode Toggle & Primary Actions */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(128, 0, 32, 0.05)', borderRadius: 'var(--radius-md)', padding: '3px', marginRight: '6px' }}>
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
            <button
              type="button"
              className="btn-icon"
              style={{
                background: viewMode === 'cards' ? '#fff' : 'transparent',
                color: viewMode === 'cards' ? 'var(--primary)' : 'var(--text-dim)',
                boxShadow: viewMode === 'cards' ? 'var(--shadow-sm)' : 'none',
                padding: '6px',
              }}
              title="Card Roster View"
              onClick={() => setViewMode('cards')}
            >
              <IconGrid size={16} />
            </button>
          </div>

          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} title="Export CSV Roster">
            <IconDownload size={16} /> Export CSV
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handlePrintRoster} title="Print Student Roll">
            <IconPrinter size={16} /> Print
          </button>
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <IconPlus size={18} /> Add Student
          </button>
        </div>
      </div>

      {/* Main View: Table View OR Cards Grid View */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading student roster...
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <IconUsers size={36} className="empty-state-icon" />
            <h3>No students found</h3>
            <p>Try adjusting your search criteria, reset quick filter pills, or register a new scholar.</p>
          </div>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name & Email</th>
                  <th>Contact</th>
                  <th>Attendance Health</th>
                  <th>Curricula</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  const rate = student.attendanceRate !== undefined ? student.attendanceRate : 100;
                  const isAtRisk = rate < 75;

                  return (
                    <tr key={student._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary)' }}>
                        {student.studentId}
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.94rem' }}>
                          {student.firstName} {student.lastName}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {student.email}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {student.phone ? (
                          <div>📞 {student.phone}</div>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                        {student.guardianName && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Guardian: {student.guardianName}</div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className={`badge ${rate >= 75 ? 'badge-success' : rate >= 60 ? 'badge-warning' : 'badge-danger'}`} style={{ fontWeight: 800 }}>
                            {rate}% Attendance
                          </span>
                          {isAtRisk && (
                            <span title="Attendance below 75% threshold" style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>
                              ⚠️
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '3px' }}>
                          {student.totalClasses || 0} classes logged
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info" style={{ fontWeight: 700 }}>
                          📚 {student.enrollmentCount || 0} Courses
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot" />
                          {student.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Enroll in Course"
                            onClick={() => handleOpenQuickEnroll(student)}
                          >
                            ⚡ Enroll
                          </button>
                          <button 
                            className="btn-icon" 
                            title="See Profile & Digital ID"
                            style={{ color: 'var(--primary)' }}
                            onClick={() => setProfileCandidate(student._id)}
                          >
                            <IconEye size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            title="Edit Student"
                            onClick={() => handleOpenEdit(student)}
                          >
                            <IconEdit size={16} />
                          </button>
                          <button 
                            className="btn-icon" 
                            title="Delete Student" 
                            style={{ color: '#f87171' }}
                            onClick={() => setDeleteCandidate(student)}
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="pagination" style={{ padding: '16px 24px', margin: '0' }}>
            <div>
              Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
              >
                Previous
              </button>
              <span style={{ padding: '0 8px', fontWeight: 600 }}>
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* CARDS GRID VIEW */
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            {filteredStudents.map((student) => {
              const rate = student.attendanceRate !== undefined ? student.attendanceRate : 100;
              const isAtRisk = rate < 75;
              const initials = `${student.firstName?.[0] || ''}${student.lastName?.[0] || ''}`.toUpperCase();

              return (
                <div key={student._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '22px' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '1rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 10px rgba(128, 0, 32, 0.25)',
                        }}>
                          {initials || 'ST'}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                            {student.firstName} {student.lastName}
                          </h4>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                            {student.studentId}
                          </span>
                        </div>
                      </div>

                      <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        <span className="badge-dot" /> {student.status}
                      </span>
                    </div>

                    {/* Contact Details */}
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <IconMail size={14} /> <span>{student.email}</span>
                      </div>
                      {student.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <IconPhone size={14} /> <span>{student.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Stats Pill Row */}
                    <div style={{
                      background: 'rgba(128, 0, 32, 0.04)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px',
                    }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Attendance</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: rate >= 75 ? 'var(--success)' : rate >= 60 ? 'var(--warning)' : 'var(--danger)' }}>
                            {rate}%
                          </span>
                          {isAtRisk && <span title="Below 75% target">⚠️</span>}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Curricula</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--primary-dark)', marginTop: '2px' }}>
                          {student.enrollmentCount || 0} Courses
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    borderTop: '1px solid var(--border-subtle)',
                    paddingTop: '14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                      onClick={() => handleOpenQuickEnroll(student)}
                    >
                      ⚡ Quick Enroll
                    </button>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        className="btn-icon" 
                        title="See Profile & Digital ID"
                        style={{ color: 'var(--primary)' }}
                        onClick={() => setProfileCandidate(student._id)}
                      >
                        <IconEye size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Edit Student"
                        onClick={() => handleOpenEdit(student)}
                      >
                        <IconEdit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        title="Delete Student" 
                        style={{ color: '#f87171' }}
                        onClick={() => setDeleteCandidate(student)}
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls for Cards */}
          <div className="card pagination" style={{ padding: '16px 24px', margin: '0' }}>
            <div>
              Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </div>
            <div className="pagination-controls">
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchStudents(pagination.page - 1)}
              >
                Previous
              </button>
              <span style={{ padding: '0 8px', fontWeight: 600 }}>
                {pagination.page} / {pagination.totalPages || 1}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchStudents(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingStudent ? 'Edit Student Details' : 'Register New Student'}
        maxWidth="680px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="student-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingStudent ? 'Save Changes' : 'Enroll Student')}
            </button>
          </>
        }
      >
        <form id="student-form" onSubmit={handleSaveStudent}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input
                type="text"
                className="form-input"
                value={formData.studentId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select
                className="form-select"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Jane"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="jane.doe@school.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input
                type="date"
                className="form-input"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Academic Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Graduated">Graduated</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <textarea
              className="form-textarea"
              placeholder="Full street address, city, and zip..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={2}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Guardian Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="Robert Doe"
                value={formData.guardianName}
                onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Guardian Phone</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+1 555-0123"
                value={formData.guardianPhone}
                onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* 1-Click Course Quick-Enroll Modal */}
      <Modal
        isOpen={Boolean(enrollCandidate)}
        onClose={() => setEnrollCandidate(null)}
        title={`Enroll Student: ${enrollCandidate?.firstName} ${enrollCandidate?.lastName} (${enrollCandidate?.studentId})`}
        maxWidth="500px"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setEnrollCandidate(null)}>
              Cancel
            </button>
            <button type="submit" form="quick-enroll-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </>
        }
      >
        <form id="quick-enroll-form" onSubmit={handleConfirmEnroll}>
          <div style={{ marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Select an active curriculum course to assign to this student cohort:
          </div>

          <div className="form-group">
            <label className="form-label">Target Course Curriculum *</label>
            <select
              className="form-select"
              value={enrollForm.courseId}
              onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
              required
            >
              <option value="">Select an active course...</option>
              {coursesList.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} — {c.courseName} ({c.duration || 'Semester'})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Class Batch / Cohort</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 2026-Cohort, Batch-A"
              value={enrollForm.batch}
              onChange={(e) => setEnrollForm({ ...enrollForm, batch: e.target.value })}
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Student Deletion"
        maxWidth="450px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Student'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to permanently delete student{' '}
          <strong style={{ color: 'var(--text-main)' }}>
            {deleteCandidate?.firstName} {deleteCandidate?.lastName} ({deleteCandidate?.studentId})
          </strong>?
          This action cannot be undone.
        </p>
      </Modal>

      {/* Student Dossier & ID Modal */}
      <StudentDossierModal
        studentId={profileCandidate}
        isOpen={Boolean(profileCandidate)}
        onClose={() => setProfileCandidate(null)}
      />
    </div>
  );
};

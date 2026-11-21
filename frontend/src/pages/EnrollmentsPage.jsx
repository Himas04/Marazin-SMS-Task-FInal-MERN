import React, { useState, useEffect } from 'react';
import { enrollmentsApi, studentsApi, coursesApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconClipboardList 
} from '../components/Icons.jsx';

const INITIAL_FORM = {
  student: '',
  course: '',
  batch: '2026-Fall',
  status: 'Active',
};

export const EnrollmentsPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Filters
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const { addToast } = useToast();

  const fetchDependencies = async () => {
    if (isStudent) return;
    try {
      const [stuRes, crsRes] = await Promise.all([
        studentsApi.getAll({ limit: 100 }),
        coursesApi.getAll(),
      ]);
      setStudents(stuRes.students || []);
      setCourses(crsRes.courses || []);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const res = await enrollmentsApi.getMy();
        setEnrollments(res.enrollments || []);
      } else {
        const res = await enrollmentsApi.getAll({
          course: filterCourse,
          status: filterStatus,
        });
        setEnrollments(res.enrollments || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch enrollments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [isStudent]);

  useEffect(() => {
    fetchEnrollments();
  }, [filterCourse, filterStatus, isStudent]);

  const handleOpenCreate = () => {
    setEditingEnrollment(null);
    setFormData({
      student: students[0]?._id || '',
      course: courses[0]?._id || '',
      batch: '2026-Fall',
      status: 'Active',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (enrollment) => {
    setEditingEnrollment(enrollment);
    setFormData({
      student: enrollment.student?._id || '',
      course: enrollment.course?._id || '',
      batch: enrollment.batch || '',
      status: enrollment.status || 'Active',
    });
    setIsFormOpen(true);
  };

  const handleSaveEnrollment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingEnrollment) {
        await enrollmentsApi.update(editingEnrollment._id, formData);
        addToast('Enrollment updated successfully!', 'success');
      } else {
        await enrollmentsApi.create(formData);
        addToast('Student successfully enrolled into course!', 'success');
      }
      setIsFormOpen(false);
      fetchEnrollments();
    } catch (err) {
      addToast(err.message || 'Failed to process enrollment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setSubmitting(true);
    try {
      await enrollmentsApi.delete(deleteCandidate._id);
      addToast('Enrollment deleted', 'success');
      setDeleteCandidate(null);
      fetchEnrollments();
    } catch (err) {
      addToast(err.message || 'Failed to delete enrollment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Top Filter & Action Toolbar */}
      {!isStudent && (
        <div className="card toolbar">
          <div className="toolbar-left">
            <select
              className="form-select"
              style={{ width: '220px' }}
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.courseCode} - {c.courseName}
                </option>
              ))}
            </select>

            <select
              className="form-select"
              style={{ width: '160px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <IconPlus size={18} /> Enroll Student
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                {!isStudent && <th>Student</th>}
                <th>Course</th>
                <th>Batch</th>
                <th>Enrolled Date</th>
                <th>Status</th>
                {!isStudent && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isStudent ? 4 : 6} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading enrollments...
                  </td>
                </tr>
              ) : enrollments.length === 0 ? (
                <tr>
                  <td colSpan={isStudent ? 4 : 6}>
                    <div className="empty-state">
                      <IconClipboardList size={36} className="empty-state-icon" />
                      <h3>No enrollments recorded</h3>
                      <p>
                        {isStudent 
                          ? 'You are not currently enrolled in any course.' 
                          : 'Register students into courses to view and manage class rosters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                enrollments.map((enr) => (
                  <tr key={enr._id}>
                    {!isStudent && (
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {enr.student ? `${enr.student.firstName} ${enr.student.lastName}` : 'Deleted Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {enr.student?.studentId}
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600 }}>{enr.course?.courseName || 'Deleted Course'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                        {enr.course?.courseCode}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{enr.batch}</span>
                    </td>
                    <td>
                      {enr.enrollmentDate ? new Date(enr.enrollmentDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${
                        enr.status === 'Active' ? 'badge-success' : enr.status === 'Completed' ? 'badge-info' : 'badge-warning'
                      }`}>
                        <span className="badge-dot" />
                        {enr.status}
                      </span>
                    </td>
                    {!isStudent && (
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-icon" 
                          title="Edit Enrollment"
                          onClick={() => handleOpenEdit(enr)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Delete Enrollment" 
                          style={{ color: '#f87171' }}
                          onClick={() => setDeleteCandidate(enr)}
                        >
                          <IconTrash size={16} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Enrollment Modal */}
      {!isStudent && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingEnrollment ? 'Edit Course Enrollment' : 'Enroll Student into Course'}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="enrollment-form" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : (editingEnrollment ? 'Save Changes' : 'Confirm Enrollment')}
              </button>
            </>
          }
        >
          <form id="enrollment-form" onSubmit={handleSaveEnrollment}>
            <div className="form-group">
              <label className="form-label">Student *</label>
              <select
                className="form-select"
                value={formData.student}
                onChange={(e) => setFormData({ ...formData, student: e.target.value })}
                required
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.studentId} - {s.firstName} {s.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Course *</label>
              <select
                className="form-select"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                required
              >
                <option value="">Select a course...</option>
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Batch Identifier *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 2026-Fall, Cohort-A"
                  value={formData.batch}
                  onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Dropped">Dropped</option>
                </select>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {!isStudent && (
        <Modal
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          title="Confirm Enrollment Cancellation"
          maxWidth="450px"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Cancel Enrollment'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to remove the enrollment for{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {deleteCandidate?.student ? `${deleteCandidate.student.firstName} ${deleteCandidate.student.lastName}` : 'this student'}
            </strong>{' '}
            in{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {deleteCandidate?.course?.courseName || 'this course'}
            </strong>?
          </p>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { attendanceApi, studentsApi, coursesApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCheckSquare,
  IconSearch 
} from '../components/Icons.jsx';

const getTodayString = () => new Date().toISOString().split('T')[0];

const INITIAL_FORM = {
  student: '',
  course: '',
  date: getTodayString(),
  status: 'Present',
  remarks: '',
};

export const AttendancePage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';

  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);

  // Filters
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [filterCourse, setFilterCourse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(false);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
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

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      if (isStudent) {
        const res = await attendanceApi.getMy();
        setAttendance(res.attendance || []);
      } else {
        const res = await attendanceApi.getAll({
          date: selectedDate,
          course: filterCourse,
          status: filterStatus,
        });
        setAttendance(res.attendance || []);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [isStudent]);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, filterCourse, filterStatus, isStudent]);

  const handleOpenCreate = () => {
    setEditingRecord(null);
    setFormData({
      student: students[0]?._id || '',
      course: courses[0]?._id || '',
      date: selectedDate || getTodayString(),
      status: 'Present',
      remarks: '',
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (rec) => {
    setEditingRecord(rec);
    setFormData({
      student: rec.student?._id || '',
      course: rec.course?._id || '',
      date: rec.date ? rec.date.split('T')[0] : getTodayString(),
      status: rec.status || 'Present',
      remarks: rec.remarks || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingRecord) {
        await attendanceApi.update(editingRecord._id, formData);
        addToast('Attendance record updated!', 'success');
      } else {
        await attendanceApi.create(formData);
        addToast('Attendance logged successfully!', 'success');
      }
      setIsFormOpen(false);
      fetchAttendance();
    } catch (err) {
      addToast(err.message || 'Failed to record attendance', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setSubmitting(true);
    try {
      await attendanceApi.delete(deleteCandidate._id);
      addToast('Attendance record deleted', 'success');
      setDeleteCandidate(null);
      fetchAttendance();
    } catch (err) {
      addToast(err.message || 'Failed to delete record', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // KPI calculations
  const totalRecords = attendance.length;
  const presentCount = attendance.filter((a) => a.status === 'Present').length;
  const absentCount = attendance.filter((a) => a.status === 'Absent').length;
  const lateCount = attendance.filter((a) => a.status === 'Late').length;
  const rate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 100;

  return (
    <div>
      {/* Attendance Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Records</div>
            <div className="stat-val">{totalRecords}</div>
          </div>
          <div className="stat-icon"><IconCheckSquare size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Present</div>
            <div className="stat-val" style={{ color: 'var(--success)' }}>{presentCount}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)' }}>
            <IconCheckSquare size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Absent</div>
            <div className="stat-val" style={{ color: 'var(--danger)' }}>{absentCount}</div>
          </div>
          <div className="stat-icon" style={{ background: 'rgba(220, 38, 38, 0.1)', color: 'var(--danger)' }}>
            <IconCheckSquare size={24} />
          </div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Attendance Rate</div>
            <div className="stat-val" style={{ color: rate >= 75 ? 'var(--success)' : 'var(--warning)' }}>
              {rate}%
            </div>
          </div>
          <div className="stat-icon"><IconCheckSquare size={24} /></div>
        </div>
      </div>

      {/* Top Filter & Action Toolbar */}
      {!isStudent && (
        <div className="card toolbar">
          <div className="toolbar-left">
            <input
              type="date"
              className="form-input"
              style={{ width: '180px' }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />

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
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Late">Late</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <IconPlus size={18} /> Mark Attendance
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
                <th>Date</th>
                <th>Status</th>
                <th>Remarks</th>
                {!isStudent && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isStudent ? 4 : 6} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading attendance register...
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={isStudent ? 4 : 6}>
                    <div className="empty-state">
                      <IconCheckSquare size={36} className="empty-state-icon" />
                      <h3>No attendance records</h3>
                      <p>
                        {isStudent 
                          ? 'No attendance records logged for your classes yet.' 
                          : 'No entries found for the selected date and filters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendance.map((rec) => (
                  <tr key={rec._id}>
                    {!isStudent && (
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                          {rec.student ? `${rec.student.firstName} ${rec.student.lastName}` : 'Deleted Student'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {rec.student?.studentId}
                        </div>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.course?.courseName || 'Deleted Course'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {rec.course?.courseCode}
                        </span>
                        {rec.moduleTitle && (
                          <span className="badge badge-info" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                            📖 {rec.moduleTitle}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {rec.date ? new Date(rec.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <span className={`badge ${
                        rec.status === 'Present' ? 'badge-success' : rec.status === 'Absent' ? 'badge-danger' : 'badge-warning'
                      }`}>
                        <span className="badge-dot" />
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {rec.remarks || '—'}
                    </td>
                    {!isStudent && (
                      <td style={{ textAlign: 'right' }}>
                        <button 
                          className="btn-icon" 
                          title="Edit Record"
                          onClick={() => handleOpenEdit(rec)}
                        >
                          <IconEdit size={16} />
                        </button>
                        <button 
                          className="btn-icon" 
                          title="Delete Record" 
                          style={{ color: '#f87171' }}
                          onClick={() => setDeleteCandidate(rec)}
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

      {/* Add / Edit Attendance Modal */}
      {!isStudent && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          title={editingRecord ? 'Edit Attendance Entry' : 'Log Student Attendance'}
          footer={
            <>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" form="attendance-form" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : (editingRecord ? 'Save Changes' : 'Log Record')}
              </button>
            </>
          }
        >
          <form id="attendance-form" onSubmit={handleSaveAttendance}>
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
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Late">Late</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Remarks</label>
              <input
                type="text"
                className="form-input"
                placeholder="Optional notes (e.g. Excused, Doctor note)..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {!isStudent && (
        <Modal
          isOpen={!!deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          title="Delete Attendance Record"
          maxWidth="450px"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Deleting...' : 'Delete Entry'}
              </button>
            </>
          }
        >
          <p style={{ color: 'var(--text-muted)' }}>
            Are you sure you want to delete this attendance log for{' '}
            <strong style={{ color: 'var(--text-main)' }}>
              {deleteCandidate?.student ? `${deleteCandidate.student.firstName} ${deleteCandidate.student.lastName}` : 'this student'}
            </strong>{' '}
            on {deleteCandidate?.date ? new Date(deleteCandidate.date).toLocaleDateString() : 'this date'}?
          </p>
        </Modal>
      )}
    </div>
  );
};

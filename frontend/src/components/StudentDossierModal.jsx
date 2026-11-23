import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { studentsApi } from '../api.js';
import { 
  IconGraduationCap, 
  IconPrinter, 
  IconCheckSquare, 
  IconBookOpen 
} from './Icons.jsx';

export const StudentDossierModal = ({ studentId, isOpen, onClose }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'courses' | 'attendance'

  useEffect(() => {
    if (isOpen && studentId) {
      loadStudentProfile(studentId);
    } else {
      setStudent(null);
    }
  }, [isOpen, studentId]);

  const loadStudentProfile = async (id) => {
    try {
      setLoading(true);
      const res = await studentsApi.getOne(id);
      setStudent(res.student);
    } catch (err) {
      console.error('Failed to load student details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const attendanceRecords = student?.attendance || [];
  const totalAttendance = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(r => r.status === 'Present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 100;

  const enrollments = student?.enrollments || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? `${student.firstName} ${student.lastName} — Student Dossier` : 'Student Profile'}
      maxWidth="720px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <button type="button" className="btn btn-secondary" onClick={handlePrint}>
            <IconPrinter size={16} /> Print ID / Dossier
          </button>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {loading || !student ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading student dossier...
        </div>
      ) : (
        <div>
          {/* Modal Tabs */}
          <div className="modal-tabs">
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'card' ? 'active' : ''}`}
              onClick={() => setActiveTab('card')}
            >
              Digital ID Card
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              Enrolled Courses ({enrollments.length})
            </button>
            <button
              type="button"
              className={`modal-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
            >
              Attendance Records ({attendanceRecords.length})
            </button>
          </div>

          {/* Tab 1: Digital ID Card */}
          {activeTab === 'card' && (
            <div>
              <div className="id-card">
                <div className="id-card-header">
                  <div className="id-card-badge">
                    <IconGraduationCap size={20} />
                  </div>
                  <div>
                    <div className="id-card-title">EduPulse Academy</div>
                    <div className="id-card-sub">OFFICIAL STUDENT IDENTITY CARD</div>
                  </div>
                </div>

                <div className="id-card-body">
                  <div className="id-card-avatar">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>

                  <div className="id-card-info">
                    <div className="id-card-name">
                      {student.firstName} {student.lastName}
                    </div>
                    <div className="id-card-number">
                      ID: {student.studentId}
                    </div>

                    <div className="id-card-grid">
                      <div>
                        <div className="id-card-label">Email</div>
                        <div className="id-card-val" style={{ wordBreak: 'break-all' }}>{student.email}</div>
                      </div>
                      <div>
                        <div className="id-card-label">Phone</div>
                        <div className="id-card-val">{student.phone || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="id-card-label">Gender / DOB</div>
                        <div className="id-card-val">
                          {student.gender || 'Not specified'} • {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div className="id-card-label">Status</div>
                        <div className="id-card-val">
                          <span className={`badge ${student.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                            <span className="badge-dot" /> {student.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {student.guardianName && (
                  <div style={{
                    marginTop: '16px',
                    padding: '10px 14px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}>
                    <strong style={{ color: 'var(--text-muted)' }}>Emergency / Guardian:</strong>{' '}
                    <span>{student.guardianName} ({student.guardianPhone || 'No phone'})</span>
                  </div>
                )}

                <div className="id-card-footer">
                  <div className="id-card-barcode">
                    {[16, 24, 18, 22, 14, 24, 20, 16, 24, 18, 22, 14, 20, 24, 16, 22].map((h, i) => (
                      <span key={i} style={{ height: `${h}px` }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '0.05em' }}>
                    AUTHORIZED STUDENT PASS
                  </div>
                </div>
              </div>

              {/* Academic Overview Gauge */}
              <div style={{
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
              }}>
                <div className="card" style={{ padding: '16px', background: 'var(--bg-surface)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Attendance Rate
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: attendanceRate >= 75 ? 'var(--success)' : 'var(--warning)' }}>
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
                    <div style={{
                      height: '100%',
                      width: `${attendanceRate}%`,
                      background: attendanceRate >= 75 ? 'var(--success)' : 'var(--warning)',
                    }} />
                  </div>
                </div>

                <div className="card" style={{ padding: '16px', background: 'var(--bg-surface)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '4px' }}>
                    Active Courses
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-light)' }}>
                    {enrollments.length}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Officially Registered
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Enrolled Courses */}
          {activeTab === 'courses' && (
            <div>
              {enrollments.length === 0 ? (
                <div className="empty-state">
                  <IconBookOpen size={32} className="empty-state-icon" />
                  <h3>No Course Enrollments</h3>
                  <p>This student is not currently enrolled in any active course.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Code</th>
                        <th>Batch</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {enrollments.map((e) => (
                        <tr key={e._id || e.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                            {e.course?.courseName || 'Course'}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            {e.course?.courseCode || 'N/A'}
                          </td>
                          <td>
                            <span className="badge badge-info">{e.batch || 'General'}</span>
                          </td>
                          <td>
                            <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                              <span className="badge-dot" />
                              {e.status || 'Active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Attendance */}
          {activeTab === 'attendance' && (
            <div>
              {attendanceRecords.length === 0 ? (
                <div className="empty-state">
                  <IconCheckSquare size={32} className="empty-state-icon" />
                  <h3>No Attendance Records</h3>
                  <p>No class attendance logged yet for this student.</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.slice(0, 15).map((a) => (
                        <tr key={a._id || a.id}>
                          <td>{a.date ? new Date(a.date).toLocaleDateString() : 'N/A'}</td>
                          <td>{a.course?.courseName || a.course?.courseCode || 'General'}</td>
                          <td>
                            <span className={`badge ${
                              a.status === 'Present' ? 'badge-success' :
                              a.status === 'Absent' ? 'badge-danger' :
                              a.status === 'Late' ? 'badge-warning' : 'badge-info'
                            }`}>
                              <span className="badge-dot" />
                              {a.status}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                            {a.remarks || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

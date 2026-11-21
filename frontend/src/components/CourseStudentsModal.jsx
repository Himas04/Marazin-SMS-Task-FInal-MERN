import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { enrollmentsApi } from '../api.js';
import { IconUsers, IconEye } from './Icons.jsx';

export const CourseStudentsModal = ({ course, isOpen, onClose, onViewStudentProfile }) => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && course?._id) {
      loadCourseEnrollments(course._id);
    } else {
      setEnrollments([]);
    }
  }, [isOpen, course]);

  const loadCourseEnrollments = async (courseId) => {
    try {
      setLoading(true);
      const res = await enrollmentsApi.getAll({ course: courseId });
      setEnrollments(res.enrollments || []);
    } catch (err) {
      console.error('Failed to load course enrollments:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Students Enrolled in ${course?.courseName || 'Course'} (${course?.courseCode || ''})`}
      maxWidth="680px"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Close
        </button>
      }
    >
      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading enrolled students...
        </div>
      ) : enrollments.length === 0 ? (
        <div className="empty-state">
          <IconUsers size={32} className="empty-state-icon" />
          <h3>No Students Enrolled</h3>
          <p>No students have been enrolled in this course yet.</p>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: '14px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{enrollments.length}</strong> active student{enrollments.length === 1 ? '' : 's'} registered in this curriculum.
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enr) => {
                  const s = enr.student;
                  if (!s) return null;
                  return (
                    <tr key={enr._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {s.studentId}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.firstName} {s.lastName}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>
                          {s.email}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-info">{enr.batch || 'General'}</span>
                      </td>
                      <td>
                        <span className={`badge ${enr.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          <span className="badge-dot" />
                          {enr.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            onClose();
                            onViewStudentProfile(s._id);
                          }}
                        >
                          <IconEye size={14} /> Profile
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Modal>
  );
};

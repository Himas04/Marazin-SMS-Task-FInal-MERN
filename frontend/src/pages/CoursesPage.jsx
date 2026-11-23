import React, { useState, useEffect } from 'react';
import { coursesApi, enrollmentsApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';
import { CourseStudentsModal } from '../components/CourseStudentsModal.jsx';
import { StudentDossierModal } from '../components/StudentDossierModal.jsx';
import { CourseModulesModal } from '../components/CourseModulesModal.jsx';
import { StudyModuleViewerModal } from '../components/StudyModuleViewerModal.jsx';
import { 
  IconSearch, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconBookOpen,
  IconUsers
} from '../components/Icons.jsx';

const INITIAL_FORM = {
  courseCode: '',
  courseName: '',
  description: '',
  duration: '6 Months',
  fee: '',
  status: 'Active',
};

export const CoursesPage = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'student';
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const [courses, setCourses] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState(null);

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Modals for inspection & learning
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState(null);
  const [selectedCourseForStudy, setSelectedCourseForStudy] = useState(null);

  const { addToast } = useToast();

  const fetchCoursesAndEnrollments = async () => {
    try {
      setLoading(true);
      const [crsRes, enrRes] = await Promise.all([
        coursesApi.getAll({ search, status: statusFilter }),
        isStudent ? enrollmentsApi.getMy().catch(() => ({ enrollments: [] })) : Promise.resolve({ enrollments: [] }),
      ]);

      setCourses(crsRes.courses || []);

      if (isStudent && enrRes.enrollments) {
        const idSet = new Set(
          enrRes.enrollments.map((e) => e.course?._id || e.course)
        );
        setEnrolledCourseIds(idSet);
      }
    } catch (err) {
      addToast(err.message || 'Failed to fetch courses', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoursesAndEnrollments();
  }, [search, statusFilter, isStudent]);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData(INITIAL_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      courseCode: course.courseCode || '',
      courseName: course.courseName || '',
      description: course.description || '',
      duration: course.duration || '6 Months',
      fee: course.fee || '',
      status: course.status || 'Active',
    });
    setIsFormOpen(true);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingCourse) {
        await coursesApi.update(editingCourse._id, formData);
        addToast('Course curriculum updated successfully!', 'success');
      } else {
        await coursesApi.create(formData);
        addToast('New course added to curriculum catalog!', 'success');
      }
      setIsFormOpen(false);
      fetchCoursesAndEnrollments();
    } catch (err) {
      addToast(err.message || 'Failed to save course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCandidate) return;
    setSubmitting(true);
    try {
      await coursesApi.delete(deleteCandidate._id);
      addToast('Course removed from curriculum', 'success');
      setDeleteCandidate(null);
      fetchCoursesAndEnrollments();
    } catch (err) {
      addToast(err.message || 'Failed to delete course', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStudentSelfEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await enrollmentsApi.enrollInCourse(courseId);
      addToast('Successfully enrolled in course! You can now study modules.', 'success');
      setEnrolledCourseIds((prev) => new Set([...prev, courseId]));
    } catch (err) {
      addToast(err.message || 'Failed to enroll in course', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  return (
    <div>
      {/* Action / Search Toolbar */}
      <div className="card toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <IconSearch size={18} className="search-icon" />
            <input
              type="text"
              className="form-input search-input"
              placeholder="Search by code or title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-select"
            style={{ width: '160px' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {isStaffOrAdmin && (
          <button className="btn btn-primary" onClick={handleOpenCreate}>
            <IconPlus size={18} /> Add Course
          </button>
        )}
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading courses...
        </div>
      ) : courses.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <IconBookOpen size={36} className="empty-state-icon" />
            <h3>No courses found</h3>
            <p>Add your first educational course or adjust your filter.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {courses.map((course) => {
            const isEnrolled = enrolledCourseIds.has(course._id);
            const moduleCount = course.modules?.length || 0;
            const hasZoom = course.modules?.some((m) => m.zoomLink);

            return (
              <div 
                key={course._id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  border: isEnrolled ? '1px solid rgba(5, 150, 105, 0.35)' : undefined 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <span className="badge badge-info" style={{ fontFamily: 'var(--font-mono)' }}>
                    {course.courseCode}
                  </span>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {hasZoom && (
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        🎥 Zoom Live
                      </span>
                    )}
                    {isStudent && isEnrolled ? (
                      <span className="badge badge-success">
                        <span className="badge-dot" /> Enrolled
                      </span>
                    ) : (
                      <span className={`badge ${course.status === 'Active' ? 'badge-primary' : 'badge-danger'}`}>
                        {course.status}
                      </span>
                    )}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{course.courseName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', flex: 1, marginBottom: '16px' }}>
                  {course.description || 'Institutional syllabus and coursework module.'}
                </p>

                {/* Modules & Duration Indicator */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '14px',
                  fontSize: '0.8rem',
                  color: 'var(--text-dim)',
                }}>
                  <span>📚 <strong>{moduleCount}</strong> Module{moduleCount === 1 ? '' : 's'}</span>
                  <span>•</span>
                  <span>⏱ {course.duration}</span>
                  {course.fee > 0 && (
                    <>
                      <span>•</span>
                      <span style={{ fontWeight: 700, color: 'var(--primary-dark)' }}>${Number(course.fee).toLocaleString()}</span>
                    </>
                  )}
                </div>

                {/* Action Buttons */}
                <div style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}>
                  {/* Student View Actions */}
                  {isStudent && (
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                      {isEnrolled ? (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, padding: '8px 14px' }}
                          onClick={() => setSelectedCourseForStudy(course)}
                        >
                          <IconBookOpen size={16} /> Study Modules & Live Zoom
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ flex: 1, padding: '8px 14px' }}
                            disabled={enrollingId === course._id}
                            onClick={() => handleStudentSelfEnroll(course._id)}
                          >
                            {enrollingId === course._id ? 'Enrolling...' : '⚡ Enroll in Course'}
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() => setSelectedCourseForStudy(course)}
                            title="Preview Course Curriculum"
                          >
                            Preview
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Staff & Admin View Actions */}
                  {isStaffOrAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        title="Manage Modules & Zoom Sessions"
                        onClick={() => setSelectedCourseForModules(course)}
                      >
                        <IconBookOpen size={14} /> Modules ({moduleCount}) & Zoom
                      </button>

                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          title="View Enrolled Students"
                          onClick={() => setSelectedCourseForStudents(course)}
                        >
                          <IconUsers size={14} /> Students
                        </button>
                        <button className="btn-icon" onClick={() => handleOpenEdit(course)} title="Edit Course">
                          <IconEdit size={16} />
                        </button>
                        <button 
                          className="btn-icon" 
                          onClick={() => setDeleteCandidate(course)} 
                          title="Delete Course" 
                          style={{ color: '#f87171' }}
                        >
                          <IconTrash size={16} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Course Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingCourse ? 'Edit Course Curriculum' : 'Add New Course'}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
              Cancel
            </button>
            <button type="submit" form="course-form" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (editingCourse ? 'Save Changes' : 'Create Course')}
            </button>
          </>
        }
      >
        <form id="course-form" onSubmit={handleSaveCourse}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CS101"
                value={formData.courseCode}
                onChange={(e) => setFormData({ ...formData, courseCode: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Course Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Intro to Computer Science"
                value={formData.courseName}
                onChange={(e) => setFormData({ ...formData, courseName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              placeholder="Outline topics, objectives, and syllabus..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 6 Months, 1 Year"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tuition Fee ($) *</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 1200"
                value={formData.fee}
                onChange={(e) => setFormData({ ...formData, fee: e.target.value })}
                required
                min={0}
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
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title="Confirm Course Deletion"
        maxWidth="450px"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteCandidate(null)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={submitting}>
              {submitting ? 'Deleting...' : 'Delete Course'}
            </button>
          </>
        }
      >
        <p style={{ color: 'var(--text-muted)' }}>
          Are you sure you want to remove{' '}
          <strong style={{ color: 'var(--text-main)' }}>
            {deleteCandidate?.courseName} ({deleteCandidate?.courseCode})
          </strong>?
          Enrolled students might be impacted.
        </p>
      </Modal>

      {/* Admin & Staff: Manage Modules & Zoom Modal */}
      <CourseModulesModal
        course={selectedCourseForModules}
        isOpen={Boolean(selectedCourseForModules)}
        onClose={() => setSelectedCourseForModules(null)}
        onModulesUpdated={fetchCoursesAndEnrollments}
      />

      {/* Student: Study Modules, Live Zoom & Attendance Modal */}
      <StudyModuleViewerModal
        course={selectedCourseForStudy}
        isOpen={Boolean(selectedCourseForStudy)}
        onClose={() => setSelectedCourseForStudy(null)}
      />

      {/* Enrolled Students Modal */}
      <CourseStudentsModal
        course={selectedCourseForStudents}
        isOpen={Boolean(selectedCourseForStudents)}
        onClose={() => setSelectedCourseForStudents(null)}
        onViewStudentProfile={(sId) => setSelectedStudentId(sId)}
      />

      {/* Student Dossier Modal */}
      <StudentDossierModal
        studentId={selectedStudentId}
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />
    </div>
  );
};

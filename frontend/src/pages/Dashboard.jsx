import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { studentsApi, coursesApi, enrollmentsApi, attendanceApi, staffApi } from '../api.js';
import { StudentDossierModal } from '../components/StudentDossierModal.jsx';
import { CourseStudentsModal } from '../components/CourseStudentsModal.jsx';
import { CourseModulesModal } from '../components/CourseModulesModal.jsx';
import { StudyModuleViewerModal } from '../components/StudyModuleViewerModal.jsx';
import { useToast } from '../components/Toast.jsx';
import { 
  IconUsers, 
  IconBookOpen, 
  IconClipboardList, 
  IconCheckSquare, 
  IconPlus, 
  IconGraduationCap, 
  IconEye, 
  IconBriefcase, 
  IconShield 
} from '../components/Icons.jsx';

export const Dashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    enrollments: 0,
    attendanceToday: 0,
    staffCount: 0,
  });

  const [recentStudents, setRecentStudents] = useState([]);
  const [coursesList, setCoursesList] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [studentProfile, setStudentProfile] = useState(null);

  // Modals
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedCourseForStudents, setSelectedCourseForStudents] = useState(null);
  const [selectedCourseForModules, setSelectedCourseForModules] = useState(null);
  const [selectedCourseForStudy, setSelectedCourseForStudy] = useState(null);
  const [enrollingId, setEnrollingId] = useState(null);
  const { addToast } = useToast();

  const handleStudentSelfEnroll = async (courseId) => {
    setEnrollingId(courseId);
    try {
      await enrollmentsApi.enrollInCourse(courseId);
      addToast('Enrolled successfully! Opening course modules...', 'success');
      await fetchDashboardData();
      const enrolledCrs = coursesList.find((c) => c._id === courseId);
      if (enrolledCrs) {
        setSelectedCourseForStudy(enrolledCrs);
      }
    } catch (err) {
      addToast(err.message || 'Failed to enroll in course', 'error');
    } finally {
      setEnrollingId(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];

      if (user?.role === 'student') {
        const [profileRes, coursesRes] = await Promise.all([
          studentsApi.getMyProfile().catch(() => ({ student: null })),
          coursesApi.getAll().catch(() => ({ courses: [] })),
        ]);
        setStudentProfile(profileRes.student);
        setCoursesList(coursesRes.courses || []);
      } else {
        const [studentsRes, coursesRes, enrollmentsRes, attendanceRes, staffRes] = await Promise.all([
          studentsApi.getAll({ limit: 6 }).catch(() => ({ students: [] })),
          coursesApi.getAll().catch(() => ({ courses: [] })),
          enrollmentsApi.getAll().catch(() => ({ enrollments: [] })),
          attendanceApi.getAll({ date: today }).catch(() => ({ attendance: [] })),
          user?.role === 'admin' ? staffApi.getAll().catch(() => ({ staff: [] })) : Promise.resolve({ staff: [] }),
        ]);

        const allStudents = studentsRes.students || [];
        const allCourses = coursesRes.courses || [];
        const allEnrollments = enrollmentsRes.enrollments || [];

        // Count enrollments per course
        const coursesWithCounts = allCourses.map((c) => {
          const count = allEnrollments.filter((e) => {
            const courseId = e.course?._id || e.course;
            return courseId === c._id;
          }).length;
          return { ...c, enrolledCount: count };
        });

        setCoursesList(coursesWithCounts);
        setRecentStudents(allStudents);
        setRecentEnrollments(allEnrollments.slice(0, 6));

        setStats({
          students: studentsRes.pagination?.total || allStudents.length,
          courses: allCourses.length,
          enrollments: allEnrollments.length,
          attendanceToday: attendanceRes.attendance ? attendanceRes.attendance.length : 0,
          staffCount: staffRes.staff ? staffRes.staff.length : 0,
        });
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // STUDENT VIEW
  if (user?.role === 'student') {
    const enrollments = studentProfile?.enrollments || [];
    const attendanceRecords = studentProfile?.attendance || [];
    const presentCount = attendanceRecords.filter((a) => a.status === 'Present').length;
    const attendanceRate = attendanceRecords.length > 0
      ? Math.round((presentCount / attendanceRecords.length) * 100)
      : 100;

    // Set of course IDs the student is already enrolled in
    const enrolledCourseIds = new Set(
      enrollments.map((e) => (e.course?._id || e.course))
    );

    return (
      <div>
        {/* Welcome Banner */}
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
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-info">
                Student ID: {studentProfile?.studentId || user?.studentId || 'STU'}
              </span>
              <span className="badge badge-success">
                <span className="badge-dot" /> Enrolled Scholar
              </span>
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Welcome back, {user?.name}!</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px', maxWidth: '580px' }}>
              Here is your academic overview. Explore your registered courses, check institutional curricula added by faculty, and review attendance records.
            </p>
          </div>

          <button className="btn btn-primary" onClick={() => onNavigate('profile')}>
            <IconGraduationCap size={18} /> My Smart ID & Profile
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div>
              <div className="stat-label">My Enrolled Courses</div>
              <div className="stat-val">{loading ? '-' : enrollments.length}</div>
            </div>
            <div className="stat-icon"><IconBookOpen size={24} /></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Attendance Rate</div>
              <div className="stat-val">{loading ? '-' : `${attendanceRate}%`}</div>
            </div>
            <div className="stat-icon"><IconCheckSquare size={24} /></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Total Classes Logged</div>
              <div className="stat-val">{loading ? '-' : attendanceRecords.length}</div>
            </div>
            <div className="stat-icon"><IconClipboardList size={24} /></div>
          </div>

          <div className="stat-card">
            <div>
              <div className="stat-label">Available Courses in Academy</div>
              <div className="stat-val">{loading ? '-' : coursesList.length}</div>
            </div>
            <div className="stat-icon"><IconGraduationCap size={24} /></div>
          </div>
        </div>

        {/* Section 1: My Enrolled Courses */}
        <div className="card" style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>My Enrolled Courses</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '2px' }}>
                Courses currently registered in your academic program
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('courses')}>
              View All
            </button>
          </div>

          {enrollments.length === 0 ? (
            <div className="empty-state">
              <IconBookOpen size={32} className="empty-state-icon" />
              <h3>No Active Enrollments</h3>
              <p>You have not been assigned to any course batch yet. Contact your advisor or faculty.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '16px' }}>
              {enrollments.map((enr) => {
                const crs = enr.course || {};
                const hasZoom = crs.modules?.some((m) => m.zoomLink);
                const modCount = crs.modules?.length || 0;

                return (
                  <div key={enr._id} style={{
                    background: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span className="badge badge-primary">{crs.courseCode || 'CRS'}</span>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {hasZoom && (
                            <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                              🎥 Live Zoom
                            </span>
                          )}
                          <span className="badge badge-success">
                            <span className="badge-dot" /> {enr.status}
                          </span>
                        </div>
                      </div>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                        {crs.courseName || 'Curriculum Course'}
                      </h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '12px' }}>
                        {crs.description || 'Comprehensive curriculum provided by academy faculty.'}
                      </p>
                    </div>

                    <div>
                      <div style={{
                        paddingTop: '10px',
                        borderTop: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem',
                        color: 'var(--text-dim)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                      }}>
                        <span>📚 {modCount} Modules</span>
                        <span>⏱ {crs.duration || 'Semester'}</span>
                      </div>

                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', padding: '8px 14px' }}
                        onClick={() => setSelectedCourseForStudy(crs)}
                      >
                        <IconBookOpen size={16} /> Study Modules & Live Zoom
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section 2: Available Courses in the Academy (Added by Staff/Admin) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                Available Courses in Institution
              </h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '2px' }}>
                Curricula offered and updated by school faculty & administration
              </p>
            </div>
            <span className="badge badge-info">{coursesList.length} Curricula Available</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '18px' }}>
            {coursesList.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course._id);
              const hasZoom = course.modules?.some((m) => m.zoomLink);
              const modCount = course.modules?.length || 0;

              return (
                <div key={course._id} style={{
                  background: 'var(--bg-surface-elevated)',
                  border: isEnrolled ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s ease',
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--secondary)' }}>
                        {course.courseCode}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {hasZoom && (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            🎥 Live Zoom
                          </span>
                        )}
                        {isEnrolled ? (
                          <span className="badge badge-success">
                            <span className="badge-dot" /> Enrolled
                          </span>
                        ) : (
                          <span className="badge badge-info">Available</span>
                        )}
                      </div>
                    </div>

                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>
                      {course.courseName}
                    </h4>

                    <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: '1.45', marginBottom: '14px' }}>
                      {course.description || 'Specialized syllabus designed to prepare students for real-world academic mastery.'}
                    </p>
                  </div>

                  <div>
                    <div style={{
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.8rem',
                      marginBottom: '12px',
                    }}>
                      <div>
                        <span style={{ color: 'var(--text-dim)' }}>📚 {modCount} Modules • </span>
                        <strong style={{ color: 'var(--text-main)' }}>{course.duration || '6 Months'}</strong>
                      </div>
                      {course.fee > 0 && (
                        <div style={{ fontWeight: 700, color: 'var(--primary-light)' }}>
                          ${course.fee}
                        </div>
                      )}
                    </div>

                    {isEnrolled ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', padding: '7px 12px' }}
                        onClick={() => setSelectedCourseForStudy(course)}
                      >
                        <IconBookOpen size={15} /> Study Modules
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', padding: '7px 12px' }}
                        disabled={enrollingId === course._id}
                        onClick={() => handleStudentSelfEnroll(course._id)}
                      >
                        {enrollingId === course._id ? 'Enrolling...' : '⚡ Enroll in Course'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Modals for Student Study Room */}
        <StudyModuleViewerModal
          course={selectedCourseForStudy}
          isOpen={Boolean(selectedCourseForStudy)}
          onClose={() => setSelectedCourseForStudy(null)}
        />
      </div>
    );
  }

  // STAFF & ADMIN VIEW
  return (
    <div>
      {/* Top Welcome Banner */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className={`badge ${user?.role === 'admin' ? 'badge-primary' : 'badge-success'}`}>
              <IconShield size={12} /> {user?.role === 'admin' ? 'Administrator Workspace' : 'Faculty & Staff Portal'}
            </span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800 }}>Welcome, {user?.name}!</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', maxWidth: '580px' }}>
            {user?.role === 'admin' 
              ? 'Institutional command center. Provision staff and student accounts, supervise courses, and monitor attendance.'
              : 'Supervise enrolled student cohorts, manage class curricula, and log daily classroom attendance.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {user?.role === 'admin' && (
            <button className="btn btn-primary" onClick={() => onNavigate('staff')}>
              <IconUsers size={16} /> Manage Staff
            </button>
          )}
          <button className="btn btn-primary" onClick={() => onNavigate('students')}>
            <IconPlus size={16} /> Add Student
          </button>
          <button className="btn btn-secondary" onClick={() => onNavigate('attendance')}>
            <IconCheckSquare size={16} /> Log Attendance
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div>
            <div className="stat-label">Total Students</div>
            <div className="stat-val">{loading ? '-' : stats.students}</div>
          </div>
          <div className="stat-icon"><IconUsers size={24} /></div>
        </div>

        {user?.role === 'admin' ? (
          <div className="stat-card">
            <div>
              <div className="stat-label">Faculty Staff</div>
              <div className="stat-val">{loading ? '-' : stats.staffCount}</div>
            </div>
            <div className="stat-icon"><IconBriefcase size={24} /></div>
          </div>
        ) : (
          <div className="stat-card">
            <div>
              <div className="stat-label">Active Courses</div>
              <div className="stat-val">{loading ? '-' : stats.courses}</div>
            </div>
            <div className="stat-icon"><IconBookOpen size={24} /></div>
          </div>
        )}

        <div className="stat-card">
          <div>
            <div className="stat-label">Total Enrollments</div>
            <div className="stat-val">{loading ? '-' : stats.enrollments}</div>
          </div>
          <div className="stat-icon"><IconClipboardList size={24} /></div>
        </div>

        <div className="stat-card">
          <div>
            <div className="stat-label">Today's Attendance</div>
            <div className="stat-val">{loading ? '-' : stats.attendanceToday}</div>
          </div>
          <div className="stat-icon"><IconCheckSquare size={24} /></div>
        </div>
      </div>

      {/* Staff & Admin Specific: Course Breakdown with Enrolled Students */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Curriculum & Enrolled Student Rosters</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '2px' }}>
              Inspect student rosters enrolled per course curriculum
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('courses')}>
            Curriculum Center
          </button>
        </div>

        {coursesList.length === 0 ? (
          <div className="empty-state">
            <IconBookOpen size={32} className="empty-state-icon" />
            <h3>No Courses Created Yet</h3>
            <p>Create your first course to begin enrolling students.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {coursesList.map((c) => {
              const hasZoom = c.modules?.some((m) => m.zoomLink);
              const modCount = c.modules?.length || 0;

              return (
                <div key={c._id} style={{
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--secondary)' }}>
                        {c.courseCode}
                      </span>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {hasZoom && (
                          <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                            🎥 Zoom
                          </span>
                        )}
                        <span className="badge badge-info">
                          {c.enrolledCount || 0} Enrolled
                        </span>
                      </div>
                    </div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '6px' }}>{c.courseName}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '14px' }}>
                      {c.description || 'Institutional syllabus and coursework module.'}
                    </p>
                  </div>

                  <div>
                    <div style={{
                      paddingTop: '10px',
                      borderTop: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        📚 <strong>{modCount}</strong> Modules
                      </span>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        ⏱ {c.duration || '6 Months'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}
                        onClick={() => setSelectedCourseForModules(c)}
                      >
                        <IconBookOpen size={14} /> Modules ({modCount})
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        onClick={() => setSelectedCourseForStudents(c)}
                      >
                        <IconUsers size={14} /> Enrolled
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Two-Column: Recent Students with "See Profile" & Recent Enrollments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Recent Students Table with "See Profile" button */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Students</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Click "See Profile" for student dossier & ID</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('students')}>
              All Students
            </button>
          </div>

          {recentStudents.length === 0 ? (
            <div className="empty-state">
              <IconUsers size={32} className="empty-state-icon" />
              <h3>No Students Found</h3>
              <p>Add a student to start building the academy roster.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Profile</th>
                  </tr>
                </thead>
                <tbody>
                  {recentStudents.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{s.studentId}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {s.firstName} {s.lastName}
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 400 }}>{s.email}</div>
                      </td>
                      <td>
                        <span className={`badge ${s.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                          <span className="badge-dot" />
                          {s.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedStudentId(s._id)}
                        >
                          <IconEye size={14} /> See Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Enrollments</h3>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Course registrations in active terms</p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('enrollments')}>
              All Enrollments
            </button>
          </div>

          {recentEnrollments.length === 0 ? (
            <div className="empty-state">
              <IconClipboardList size={32} className="empty-state-icon" />
              <h3>No Enrollments Yet</h3>
              <p>Enroll students into courses to organize cohorts.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Course</th>
                    <th>Batch</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEnrollments.map((e) => (
                    <tr key={e._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {e.student ? `${e.student.firstName} ${e.student.lastName}` : 'Student'}
                      </td>
                      <td>{e.course?.courseName || e.course?.courseCode || 'Course'}</td>
                      <td><span className="badge badge-info">{e.batch}</span></td>
                      <td>
                        <span className={`badge ${e.status === 'Active' ? 'badge-success' : 'badge-warning'}`}>
                          <span className="badge-dot" />
                          {e.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Global Modals for Inspection & Modules Management */}
      <StudentDossierModal
        studentId={selectedStudentId}
        isOpen={Boolean(selectedStudentId)}
        onClose={() => setSelectedStudentId(null)}
      />

      <CourseStudentsModal
        course={selectedCourseForStudents}
        isOpen={Boolean(selectedCourseForStudents)}
        onClose={() => setSelectedCourseForStudents(null)}
        onViewStudentProfile={(sId) => setSelectedStudentId(sId)}
      />

      <CourseModulesModal
        course={selectedCourseForModules}
        isOpen={Boolean(selectedCourseForModules)}
        onClose={() => setSelectedCourseForModules(null)}
        onModulesUpdated={fetchDashboardData}
      />

      <StudyModuleViewerModal
        course={selectedCourseForStudy}
        isOpen={Boolean(selectedCourseForStudy)}
        onClose={() => setSelectedCourseForStudy(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { coursesApi, attendanceApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './Toast.jsx';
import { 
  IconBookOpen, 
  IconCheckSquare, 
  IconCheck, 
  IconGraduationCap 
} from './Icons.jsx';

export const StudyModuleViewerModal = ({ course, isOpen, onClose }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [modules, setModules] = useState([]);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [attendedModules, setAttendedModules] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);

  useEffect(() => {
    if (isOpen && course) {
      loadCourseAndAttendance(course._id);
    } else {
      setModules([]);
      setActiveModuleIndex(0);
      setAttendedModules(new Set());
    }
  }, [isOpen, course]);

  const loadCourseAndAttendance = async (courseId) => {
    try {
      setLoading(true);
      const [crsRes, attRes] = await Promise.all([
        coursesApi.getOne(courseId),
        attendanceApi.getMy().catch(() => ({ attendance: [] })),
      ]);

      const loadedModules = crsRes.course?.modules || [];
      setModules(loadedModules);

      // Find which modules the student has attendance records for in this course
      const attended = new Set();
      (attRes.attendance || []).forEach((rec) => {
        const cId = rec.course?._id || rec.course;
        if (cId === courseId && rec.moduleTitle) {
          attended.add(rec.moduleTitle);
        }
      });
      setAttendedModules(attended);
    } catch (err) {
      console.error('Failed to load study module data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async (moduleTitle) => {
    if (!moduleTitle) return;
    setMarkingAttendance(true);
    try {
      await attendanceApi.markModuleAttendance(course._id, moduleTitle);
      addToast(`Attendance recorded for "${moduleTitle}"!`, 'success');
      setAttendedModules((prev) => new Set([...prev, moduleTitle]));
    } catch (err) {
      addToast(err.message || 'Failed to record attendance', 'error');
    } finally {
      setMarkingAttendance(false);
    }
  };

  if (!isOpen) return null;

  const activeModule = modules[activeModuleIndex] || null;
  const isAttended = activeModule ? attendedModules.has(activeModule.title) : false;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Study Modules: ${course?.courseName || 'Course'} (${course?.courseCode || ''})`}
      maxWidth="940px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Attended <strong>{attendedModules.size}</strong> of <strong>{modules.length}</strong> modules
          </div>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close Study Room
          </button>
        </div>
      }
    >
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading curriculum syllabus and study modules...
        </div>
      ) : modules.length === 0 ? (
        <div className="empty-state">
          <IconBookOpen size={36} className="empty-state-icon" />
          <h3>No Modules Published Yet</h3>
          <p>The faculty instructor has not uploaded lessons or live Zoom links for this curriculum yet.</p>
        </div>
      ) : (
        <div className="study-modal-grid">
          {/* Module Selector Sidebar */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.75)',
            border: '1px solid rgba(128, 0, 32, 0.1)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '480px',
            overflowY: 'auto',
          }}>
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '4px 8px' }}>
              Course Syllabus ({modules.length})
            </div>

            {modules.map((m, idx) => {
              const active = idx === activeModuleIndex;
              const attended = attendedModules.has(m.title);

              return (
                <button
                  key={m._id || idx}
                  type="button"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    textAlign: 'left',
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: active ? 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)' : 'transparent',
                    color: active ? '#fff' : 'var(--text-main)',
                    border: '1px solid',
                    borderColor: active ? 'transparent' : 'rgba(128, 0, 32, 0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                  onClick={() => setActiveModuleIndex(idx)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', opacity: active ? 0.9 : 0.6 }}>
                      Module {idx + 1}
                    </span>
                    {attended ? (
                      <span className={`badge ${active ? 'badge-primary' : 'badge-success'}`} style={{ fontSize: '0.68rem', padding: '2px 6px', background: active ? '#fff' : undefined, color: active ? 'var(--primary)' : undefined }}>
                        ✓ Attended
                      </span>
                    ) : m.zoomLink ? (
                      <span style={{ fontSize: '0.72rem' }}>🎥 Zoom</span>
                    ) : null}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, lineHeight: '1.3' }}>
                    {m.title}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Module Content & Live Session Viewer */}
          {activeModule && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Header Card */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(128, 0, 32, 0.12)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-primary">Module {activeModuleIndex + 1}</span>
                      {activeModule.duration && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 600 }}>
                          ⏱ {activeModule.duration}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {activeModule.title}
                    </h3>
                    {activeModule.description && (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '6px', lineHeight: '1.45' }}>
                        {activeModule.description}
                      </p>
                    )}
                  </div>

                  {/* Attendance Action Badge / Button */}
                  <div>
                    {isAttended ? (
                      <div className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.84rem' }}>
                        <IconCheck size={16} /> Attendance Recorded
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={markingAttendance}
                        onClick={() => handleMarkAttendance(activeModule.title)}
                        style={{ padding: '8px 14px' }}
                      >
                        <IconCheckSquare size={16} /> {markingAttendance ? 'Marking...' : 'Mark Module Attendance'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Zoom Session Box */}
              {activeModule.zoomLink ? (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(128, 0, 32, 0.07) 0%, rgba(159, 18, 57, 0.04) 100%)',
                  border: '1px solid rgba(128, 0, 32, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  boxShadow: 'var(--shadow-sm)',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ fontSize: '1.3rem' }}>🎥</span>
                      <strong style={{ fontSize: '1rem', color: 'var(--primary-dark)' }}>
                        Live Zoom Classroom
                      </strong>
                      <span className="badge badge-success">
                        <span className="badge-dot" /> Live Interactive
                      </span>
                    </div>

                    <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {activeModule.liveSessionTime ? (
                        <span>📅 Scheduled: <strong style={{ color: 'var(--text-main)' }}>{activeModule.liveSessionTime}</strong></span>
                      ) : (
                        <span>Live stream accessible at link below</span>
                      )}
                    </div>

                    {(activeModule.zoomMeetingId || activeModule.zoomPasscode) && (
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', marginTop: '6px', color: 'var(--text-dim)' }}>
                        {activeModule.zoomMeetingId && (
                          <span>Meeting ID: <strong style={{ color: 'var(--text-main)' }}>{activeModule.zoomMeetingId}</strong></span>
                        )}
                        {activeModule.zoomPasscode && (
                          <span>Passcode: <strong style={{ color: 'var(--text-main)' }}>{activeModule.zoomPasscode}</strong></span>
                        )}
                      </div>
                    )}
                  </div>

                  <a
                    href={activeModule.zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    style={{ textDecoration: 'none', padding: '10px 22px', fontSize: '0.92rem' }}
                    onClick={() => {
                      if (!isAttended) {
                        handleMarkAttendance(activeModule.title);
                      }
                    }}
                  >
                    🎥 Join Live Zoom Meeting
                  </a>
                </div>
              ) : (
                <div style={{
                  padding: '12px 16px',
                  background: 'rgba(255, 255, 255, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px dashed rgba(128, 0, 32, 0.15)',
                  fontSize: '0.82rem',
                  color: 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>📖</span>
                  <span>Self-paced curriculum module. Review study material below and mark attendance when complete.</span>
                </div>
              )}

              {/* Study Notes & Lecture Material Content */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.88)',
                border: '1px solid rgba(128, 0, 32, 0.1)',
                borderRadius: 'var(--radius-md)',
                padding: '22px',
                minHeight: '220px',
                boxShadow: 'var(--shadow-sm)',
              }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
                  Lesson Notes & Study Material
                </div>

                {activeModule.content ? (
                  <div style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {activeModule.content}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.88rem' }}>
                    No extended lecture text uploaded for this module yet. Follow the live session or syllabus instructions above.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

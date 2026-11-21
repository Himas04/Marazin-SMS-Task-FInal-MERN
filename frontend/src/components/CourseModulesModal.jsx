import React, { useState, useEffect } from 'react';
import { Modal } from './Modal.jsx';
import { coursesApi } from '../api.js';
import { useToast } from './Toast.jsx';
import { 
  IconBookOpen, 
  IconPlus, 
  IconEdit, 
  IconTrash, 
  IconCheck, 
  IconX 
} from './Icons.jsx';

const INITIAL_MODULE_FORM = {
  title: '',
  description: '',
  content: '',
  duration: '1 Week',
  zoomLink: '',
  zoomMeetingId: '',
  zoomPasscode: '',
  liveSessionTime: '',
  sessionPin: '',
};

export const CourseModulesModal = ({ course, isOpen, onClose, onModulesUpdated }) => {
  const [modules, setModules] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [formData, setFormData] = useState(INITIAL_MODULE_FORM);
  const [submitting, setSubmitting] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (isOpen && course) {
      loadLatestCourse(course._id);
    } else {
      setModules([]);
      setIsFormOpen(false);
    }
  }, [isOpen, course]);

  const loadLatestCourse = async (id) => {
    try {
      const res = await coursesApi.getOne(id);
      setModules(res.course?.modules || []);
    } catch (err) {
      console.error('Failed to load course modules:', err);
    }
  };

  const handleOpenAdd = () => {
    setEditingModule(null);
    setFormData(INITIAL_MODULE_FORM);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (mod) => {
    setEditingModule(mod);
    setFormData({
      title: mod.title || '',
      description: mod.description || '',
      content: mod.content || '',
      duration: mod.duration || '1 Week',
      zoomLink: mod.zoomLink || '',
      zoomMeetingId: mod.zoomMeetingId || '',
      zoomPasscode: mod.zoomPasscode || '',
      liveSessionTime: mod.liveSessionTime || '',
      sessionPin: mod.sessionPin || '',
    });
    setIsFormOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      addToast('Module title is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editingModule) {
        await coursesApi.updateModule(course._id, editingModule._id, formData);
        addToast('Module updated successfully!', 'success');
      } else {
        await coursesApi.addModule(course._id, formData);
        addToast('New module added to course curriculum!', 'success');
      }
      setIsFormOpen(false);
      loadLatestCourse(course._id);
      if (onModulesUpdated) onModulesUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to save module', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('Are you sure you want to remove this module?')) return;
    try {
      await coursesApi.deleteModule(course._id, moduleId);
      addToast('Module removed from course', 'success');
      loadLatestCourse(course._id);
      if (onModulesUpdated) onModulesUpdated();
    } catch (err) {
      addToast(err.message || 'Failed to delete module', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Curriculum Modules & Live Zoom: ${course?.courseName || 'Course'} (${course?.courseCode || ''})`}
      maxWidth="760px"
      footer={
        <button type="button" className="btn btn-primary" onClick={onClose}>
          Done
        </button>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Course has <strong>{modules.length}</strong> study module{modules.length === 1 ? '' : 's'}.
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Modules are available for students to study, review lecture notes, join Zoom live classes, and log attendance.
          </div>
        </div>

        {!isFormOpen && (
          <button className="btn btn-primary btn-sm" onClick={handleOpenAdd}>
            <IconPlus size={16} /> Add Module
          </button>
        )}
      </div>

      {/* Module Add / Edit Form */}
      {isFormOpen && (
        <div className="card" style={{ marginBottom: '22px', border: '1px solid var(--border-hover)', background: 'rgba(255, 255, 255, 0.95)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary-dark)' }}>
              {editingModule ? 'Edit Module' : 'Create New Course Module'}
            </h4>
            <button className="btn-icon" onClick={() => setIsFormOpen(false)} title="Cancel">
              <IconX size={16} />
            </button>
          </div>

          <form onSubmit={handleSaveModule}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Module Title *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Module 1: Introduction to Web Architectures"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Duration</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Week 1 - 2 Hours"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Overview / Summary</label>
              <input
                type="text"
                className="form-input"
                placeholder="Brief summary of learning objectives..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Study Notes & Learning Content</label>
              <textarea
                className="form-textarea"
                placeholder="Full lesson syllabus, lecture notes, study instructions, required reading, external links..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
              />
            </div>

            {/* Live Zoom Session Configuration */}
            <div style={{
              background: 'rgba(128, 0, 32, 0.04)',
              border: '1px solid rgba(128, 0, 32, 0.12)',
              borderRadius: 'var(--radius-md)',
              padding: '16px',
              marginTop: '14px',
              marginBottom: '16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '1.1rem' }}>🎥</span>
                <strong style={{ fontSize: '0.88rem', color: 'var(--primary-dark)' }}>
                  Live Zoom Classroom Setup (Optional)
                </strong>
              </div>

              <div className="form-group" style={{ marginBottom: '12px' }}>
                <label className="form-label">Zoom Meeting Link (URL)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://zoom.us/j/8291048291..."
                  value={formData.zoomLink}
                  onChange={(e) => setFormData({ ...formData, zoomLink: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Meeting ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 849 2039 1029"
                    value={formData.zoomMeetingId}
                    onChange={(e) => setFormData({ ...formData, zoomMeetingId: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Meeting Passcode</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Edu2026"
                    value={formData.zoomPasscode}
                    onChange={(e) => setFormData({ ...formData, zoomPasscode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Scheduled Date / Time</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Every Mon & Wed 10:00 AM"
                    value={formData.liveSessionTime}
                    onChange={(e) => setFormData({ ...formData, liveSessionTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Saving...' : (editingModule ? 'Save Changes' : 'Add Module')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modules List */}
      {modules.length === 0 ? (
        <div className="empty-state">
          <IconBookOpen size={36} className="empty-state-icon" />
          <h3>No Modules Added Yet</h3>
          <p>Click "Add Module" above to build the curriculum and add live Zoom sessions.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map((m, idx) => (
            <div
              key={m._id || idx}
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                border: '1px solid rgba(128, 0, 32, 0.1)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ flex: 1, minWidth: '220px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span className="badge badge-primary">Module {idx + 1}</span>
                  {m.duration && <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>⏱ {m.duration}</span>}
                  {m.zoomLink && (
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      🎥 Live Zoom
                    </span>
                  )}
                </div>
                <h4 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                  {m.title}
                </h4>
                {m.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                    {m.description}
                  </p>
                )}
                {m.zoomLink && (
                  <div style={{ fontSize: '0.76rem', color: 'var(--primary)', marginTop: '4px' }}>
                    📅 {m.liveSessionTime || 'Live Scheduled'} • ID: {m.zoomMeetingId || 'In Link'} {m.zoomPasscode ? `(Pass: ${m.zoomPasscode})` : ''}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  className="btn-icon"
                  title="Edit Module"
                  onClick={() => handleOpenEdit(m)}
                >
                  <IconEdit size={16} />
                </button>
                <button
                  type="button"
                  className="btn-icon"
                  style={{ color: 'var(--danger)' }}
                  title="Delete Module"
                  onClick={() => handleDeleteModule(m._id)}
                >
                  <IconTrash size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

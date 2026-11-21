import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import { IconGraduationCap, IconAlertCircle, IconShield } from '../components/Icons.jsx';

export const AuthPage = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const { login } = useAuth();
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(identifier, password);
      addToast('Signed in successfully!', 'success');
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
      addToast(err.message || 'Authentication failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 20%, rgba(128, 0, 32, 0.08) 0%, transparent 65%), radial-gradient(circle at 85% 80%, rgba(112, 26, 117, 0.05) 0%, transparent 50%), #fcfafb',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 1)',
        outline: '1px solid rgba(128, 0, 32, 0.12)',
        borderRadius: 'var(--radius-xl)',
        padding: '38px 36px',
        boxShadow: '0 25px 60px -10px rgba(128, 0, 32, 0.14), 0 4px 12px rgba(0, 0, 0, 0.03), inset 0 1px 2px rgba(255, 255, 255, 1)',
      }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--primary) 0%, #9f1239 100%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px var(--primary-glow), inset 0 1px 1px rgba(255, 255, 255, 0.4)',
            color: '#fff',
            marginBottom: '14px',
          }}>
            <IconGraduationCap size={32} />
          </div>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 800, 
            letterSpacing: '-0.02em',
            background: 'linear-gradient(135deg, var(--primary-dark) 0%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EduPulse
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px', fontWeight: 500 }}>
            Institutional Portal & Student Management
          </p>
        </div>

        {/* Notice for registration policy */}
        <div style={{
          background: 'rgba(128, 0, 32, 0.04)',
          border: '1px solid rgba(128, 0, 32, 0.12)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          lineHeight: '1.45',
        }}>
          <IconShield size={18} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong style={{ color: 'var(--primary-dark)', display: 'block', marginBottom: '2px' }}>
              Authorized Access Only
            </strong>
            Self-registration is disabled. Staff and student accounts are provisioned exclusively by School Administration.
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.22)',
            color: '#b91c1c',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <IconAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address or Student ID</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. admin@school.edu or STU1001"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '16px', padding: '12px', fontSize: '0.95rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In to Portal'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ width: '100%', marginTop: '10px', fontSize: '0.8rem', padding: '8px 12px' }}
            onClick={() => {
              setIdentifier('admin@school.edu');
              setPassword('admin123');
            }}
          >
            🔑 Fill Demo Admin (admin@school.edu)
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(128, 0, 32, 0.08)',
          textAlign: 'center',
          fontSize: '0.78rem',
          color: 'var(--text-dim)',
        }}>
          <div>Need an account or password reset?</div>
          <div style={{ color: 'var(--text-muted)', marginTop: '2px' }}>
            Contact your school administrative office.
          </div>
        </div>
      </div>
    </div>
  );
};

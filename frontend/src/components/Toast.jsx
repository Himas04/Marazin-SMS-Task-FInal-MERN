import React, { createContext, useContext, useState, useCallback } from 'react';
import { IconCheck, IconAlertCircle, IconX } from './Icons.jsx';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            {toast.type === 'success' && <IconCheck size={18} style={{ color: 'var(--success)' }} />}
            {toast.type === 'error' && <IconAlertCircle size={18} style={{ color: 'var(--danger)' }} />}
            {toast.type === 'info' && <IconAlertCircle size={18} style={{ color: 'var(--primary)' }} />}
            <span style={{ flex: 1 }}>{toast.message}</span>
            <button className="btn-icon" onClick={() => removeToast(toast.id)}>
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

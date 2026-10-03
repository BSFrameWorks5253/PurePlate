import React from 'react';

export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="app-toast-container" id="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`app-toast toast-${toast.type || 'info'}`}
          onClick={() => onDismiss(toast.id)}
        >
          <span className="toast-icon">
            {toast.type === 'success' && '✅'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'warning' && '⚠️'}
            {toast.type === 'info' && 'ℹ️'}
          </span>
          <span className="toast-msg">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

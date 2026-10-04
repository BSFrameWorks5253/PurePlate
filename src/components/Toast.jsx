import React from 'react';

/**
 * Apple Dynamic Island Style Liquid Glass Notifications
 */
export default function Toast({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="dynamic-island-toast-container" id="toast-container">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error' || toast.type === 'danger';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`dynamic-toast-pill toast-${toast.type || 'info'}`}
            onClick={() => onDismiss(toast.id)}
            role="alert"
          >
            <div className="toast-left-col">
              <span className={`toast-pulse-orb ${toast.type || 'info'}`}></span>
              <span className="toast-type-icon">
                {isSuccess && '✅'}
                {isError && '🚨'}
                {isWarning && '⚠️'}
                {!isSuccess && !isError && !isWarning && 'ℹ️'}
              </span>
            </div>

            <div className="toast-content-col">
              <span className="toast-title-text">
                {isSuccess && 'Verification Successful'}
                {isError && 'Alert Notice'}
                {isWarning && 'Safety Warning'}
                {!isSuccess && !isError && !isWarning && 'System Update'}
              </span>
              <p className="toast-message-body">{toast.message}</p>
            </div>

            <button
              className="toast-dismiss-x"
              aria-label="Dismiss notification"
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(toast.id);
              }}
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { useState, useEffect } from "react";
import "../css/alert.css";

/**
 * Reusable Alert Component
 * Displays error, success, warning, or info messages with auto-dismiss
 * 
 * Props:
 * - type: 'error' | 'success' | 'warning' | 'info' (default: 'error')
 * - message: Alert message text
 * - onClose: Callback when alert closes
 * - autoClose: Auto-dismiss after ms (default: 5000, set to 0 to disable)
 * - isVisible: Control visibility from parent
 */

function Alert({ type = "error", message, onClose, autoClose = 5000, isVisible = true }) {
  const [show, setShow] = useState(isVisible);

  useEffect(() => {
    setShow(isVisible);
  }, [isVisible]);

  useEffect(() => {
    if (!show) return;

    if (autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      return () => clearTimeout(timer);
    }
  }, [show, autoClose]);

  const handleClose = () => {
    setShow(false);
    if (onClose) onClose();
  };

  if (!show || !message) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        );
      case "warning":
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case "info":
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
      case "error":
      default:
        return (
          <svg className="alert-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        );
    }
  };

  return (
    <div className={`alert alert-${type} alert-visible`} role="alert" aria-live="assertive">
      <div className="alert-content">
        <div className="alert-icon-wrapper">{getIcon()}</div>
        <div className="alert-message">{message}</div>
        <button
          className="alert-close-btn"
          onClick={handleClose}
          aria-label="Close alert"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div className="alert-progress-bar"></div>
    </div>
  );
}

export default Alert;

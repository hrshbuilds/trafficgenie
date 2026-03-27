import { useState, useEffect } from 'react';
import './alerts.css';

/**
 * New Violation Alert Toast Component
 * Shows a notification when a new violation is detected
 * Auto-dismisses after 5 seconds
 * @param {Object} props - {violation, onDismiss}
 */
export function NewViolationAlert({ violation, onDismiss }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      if (onDismiss) onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!show) return null;

  return (
    <div className="new-violation-toast">
      <div className="toast-icon">{violation?.icon || '🚗'}</div>
      <div className="toast-content">
        <div className="toast-title">🚨 New Violation</div>
        <div className="toast-detail">
          <strong>{violation?.type}</strong> at {violation?.loc}
        </div>
        <div className="toast-confidence">
          Confidence: <strong>{violation?.conf}%</strong>
        </div>
      </div>
      <button 
        className="toast-close" 
        onClick={() => {
          setShow(false);
          if (onDismiss) onDismiss();
        }}
      >
        ✕
      </button>
    </div>
  );
}

export default NewViolationAlert;

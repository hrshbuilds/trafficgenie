import './alerts.css';

/**
 * Live Indicator Component
 * Shows a pulsing indicator that system is live and streaming real-time data
 * @param {Object} props - {isLive, label, additionalInfo}
 */
export function LiveIndicator({ isLive = true, label = 'LIVE', additionalInfo = 'Active' }) {
  return (
    <div className={`live-indicator ${isLive ? 'live' : 'offline'}`}>
      <span className="live-dot animated"></span>
      <span className="live-label">{label}</span>
      {additionalInfo && <span className="live-info">· {additionalInfo}</span>}
    </div>
  );
}

export default LiveIndicator;

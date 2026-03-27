import './violations.css';

/**
 * Risk Badge Component
 * Displays risk level with color-coded indicator
 * Shows severity: Critical (red), High (orange), Medium (yellow)
 */
export function RiskBadge({ risk = 0, size = 'medium', showLabel = true }) {
  const getRiskLevel = () => {
    if (risk > 75) return { level: 'critical', icon: '🔴', label: 'Critical' };
    if (risk > 50) return { level: 'high', icon: '🟠', label: 'High' };
    if (risk > 25) return { level: 'medium', icon: '🟡', label: 'Medium' };
    return { level: 'low', icon: '🟢', label: 'Low' };
  };

  const { level, icon, label } = getRiskLevel();

  return (
    <div className={`risk-badge risk-${level} size-${size}`}>
      <span className="risk-icon">{icon}</span>
      <span className="risk-value">{Math.round(risk)}%</span>
      {showLabel && <span className="risk-label">{label}</span>}
    </div>
  );
}

/**
 * Risk Progress Ring Component
 * Circular progress indicator for risk level
 */
export function RiskRing({ risk = 0, size = 80 }) {
  const getRiskColor = () => {
    if (risk > 75) return '#C62828'; // Red
    if (risk > 50) return '#e85d26'; // Orange
    if (risk > 25) return '#f4a261'; // Yellow
    return '#52b788'; // Green
  };

  const circumference = 2 * Math.PI * (size / 2 - 8);
  const offset = circumference - (risk / 100) * circumference;

  return (
    <div className="risk-ring-container" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="risk-ring">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="6"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 8}
          fill="none"
          stroke={getRiskColor()}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
      <div className="risk-ring-text">
        <div className="risk-ring-value">{Math.round(risk)}%</div>
      </div>
    </div>
  );
}

/**
 * Risk Meter Component
 * Horizontal bar showing risk level
 */
export function RiskMeter({ risk = 0, label = 'Risk Level' }) {
  const getRiskColor = () => {
    if (risk > 75) return '#C62828';
    if (risk > 50) return '#e85d26';
    if (risk > 25) return '#f4a261';
    return '#52b788';
  };

  return (
    <div className="risk-meter">
      <div className="risk-meter-label">{label}</div>
      <div className="risk-meter-bar">
        <div
          className="risk-meter-fill"
          style={{
            width: `${risk}%`,
            backgroundColor: getRiskColor(),
          }}
        />
      </div>
      <div className="risk-meter-value">{Math.round(risk)}%</div>
    </div>
  );
}

export default RiskBadge;

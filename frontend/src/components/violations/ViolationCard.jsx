import { memo, useMemo } from 'react';

/**
 * Optimized Violation Card Component
 * Memoized to prevent unnecessary re-renders
 */
export const ViolationCard = memo(function ViolationCard({ violation, onSelect, showRisk = true }) {
  const riskColor = useMemo(() => {
    const risk = violation?.risk || 0;
    if (risk > 75) return '#C62828';
    if (risk > 50) return '#e85d26';
    if (risk > 25) return '#f4a261';
    return '#52b788';
  }, [violation?.risk]);

  const handleClick = () => {
    if (onSelect) onSelect(violation);
  };

  return (
    <div
      className="v-card"
      onClick={handleClick}
      style={{ cursor: onSelect ? 'pointer' : 'default' }}
    >
      <div className="v-card-header">
        <span className="v-icon">{violation?.icon || '🚗'}</span>
        <span className="v-type">{violation?.type || 'Unknown'}</span>
        {showRisk && (
          <span
            className="v-risk-badge"
            style={{ backgroundColor: `${riskColor}20`, color: riskColor }}
          >
            {Math.round(violation?.risk || 0)}%
          </span>
        )}
      </div>
      <div className="v-info">
        <div className="v-loc">{violation?.loc}</div>
        <div className="v-plate">{violation?.plate}</div>
      </div>
      <div className="v-stats">
        <span className="v-stat">
          <strong>Conf:</strong> {violation?.conf}%
        </span>
        <span className="v-stat">
          <strong>Status:</strong> {violation?.status}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent re-renders if data unchanged
  return (
    prevProps.violation?.id === nextProps.violation?.id &&
    prevProps.violation?.status === nextProps.violation?.status &&
    prevProps.violation?.risk === nextProps.violation?.risk
  );
});

export default ViolationCard;

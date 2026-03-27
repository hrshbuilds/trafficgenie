import { useState } from 'react';
import './TrafficGenie.css';

/**
 * TrafficGenie Component
 * Universal floating AI assistant for officers
 * Available throughout the dashboard for instant insights
 */
export function TrafficGenie({ violations = [], stats = {}, currentPage = 'live' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Build context-aware prompt
      const violationSummary = violations
        .slice(0, 15)
        .map(v => `• ${v.type} at ${v.loc} (${v.conf}% conf, Risk: ${v.risk})`)
        .join('\n');

      const contextString = 
        currentPage === 'heatmap' ? 'Looking at hotspot heatmap' :
        currentPage === 'analytics' ? 'Reviewing analytics dashboard' :
        currentPage === 'challans' ? 'Managing challans' :
        currentPage === 'violation' ? 'Reviewing violation log' :
        'Monitoring live violations';

      const prompt = `You are TrafficGenie, an AI assistant for traffic officers.
Current Context: ${contextString}
Dashboard Stats: ${stats.totalViolations || 0} violations, ${stats.urgentViolations || 0} urgent, Avg Risk: ${stats.averageRisk || 0}%

Recent Violations:
${violationSummary || 'No violations yet'}

Officer's Query: ${query}

Provide a concise, actionable response specific to Indian traffic management. Be brief (2-3 sentences max) and data-driven.`;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      setResponse(data.analysis || data.text || 'No response generated');
    } catch (err) {
      setError(err.message || 'Failed to get response from TrafficGenie');
      console.error('TrafficGenie error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="traffic-genie-button"
        onClick={() => setIsOpen(true)}
        title="Open TrafficGenie assistant"
      >
        <span className="traffic-genie-icon">🧞</span>
        <span className="traffic-genie-label">TrafficGenie</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="traffic-genie-overlay" onClick={() => setIsOpen(false)}>
          <div className="traffic-genie-modal" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="traffic-genie-header">
              <div className="traffic-genie-title-section">
                <span className="traffic-genie-modal-icon">🧞</span>
                <h2>TrafficGenie Assistant</h2>
              </div>
              <button
                className="traffic-genie-close"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="traffic-genie-content">
              {!response && !loading && !error && (
                <div className="traffic-genie-intro">
                  <p>
                    <strong>Hi! I'm TrafficGenie 🧞</strong>
                  </p>
                  <p>Ask me anything about:</p>
                  <ul>
                    <li>📊 Violation patterns and trends</li>
                    <li>🚨 High-risk areas and hotspots</li>
                    <li>📍 Specific zone or ward analysis</li>
                    <li>🎯 Enforcement recommendations</li>
                    <li>📈 Real-time statistics</li>
                  </ul>
                  <p style={{ marginTop: '12px', fontSize: '11px', color: '#999' }}>
                    Context-aware: Based on current page and live data
                  </p>
                </div>
              )}

              {response && (
                <div className="traffic-genie-response">
                  <div className="traffic-genie-response-text">{response}</div>
                </div>
              )}

              {error && (
                <div className="traffic-genie-error">
                  <strong>⚠️ Error:</strong> {error}
                </div>
              )}

              {loading && (
                <div className="traffic-genie-loading">
                  <span className="traffic-genie-spinner"></span>
                  <p>TrafficGenie is thinking...</p>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form className="traffic-genie-form" onSubmit={handleSubmit}>
              <input
                type="text"
                className="traffic-genie-input"
                placeholder="Ask me anything about traffic violations..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <button
                type="submit"
                className="traffic-genie-submit"
                disabled={loading || !query.trim()}
              >
                {loading ? '...' : '→'}
              </button>
            </form>

            {/* Action Buttons */}
            {response && (
              <div className="traffic-genie-actions">
                <button
                  className="traffic-genie-new-query"
                  onClick={() => {
                    setResponse(null);
                    setQuery('');
                  }}
                >
                  ↻ New Query
                </button>
                <button
                  className="traffic-genie-close-btn"
                  onClick={() => setIsOpen(false)}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default TrafficGenie;

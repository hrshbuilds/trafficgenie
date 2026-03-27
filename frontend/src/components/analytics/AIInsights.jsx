import { useState } from 'react';
import './analytics.css';

/**
 * AI Insights Component
 * Uses backend Gemini API to analyze traffic violation patterns
 * Provides actionable insights for traffic management
 */
export function AIInsights({ violations = [] }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);
    setInsights(null);

    try {
      // Format violations for analysis
      const violationSummary = violations
        .slice(0, 20) // Analyze recent 20 violations
        .map(v => `${v.type} at ${v.loc} (Confidence: ${v.conf}%, Risk: ${v.risk}%)`)
        .join('\n');

      const prompt = `Analyze these recent traffic violations and provide actionable insights for traffic management:

${violationSummary}

Provide:
1. Key trends observed
2. High-risk areas
3. Recommendations for enforcement
4. Pattern analysis

Keep response concise and actionable.`;

      // Call backend API
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
      setInsights(data.analysis || data.text || 'Unable to generate insights');
    } catch (err) {
      setError(err.message || 'Failed to generate insights');
      console.error('AIInsights error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <h3>🤖 AI Traffic Analysis</h3>
        <button
          className="ai-insights-btn"
          onClick={generateInsights}
          disabled={loading || violations.length === 0}
        >
          {loading ? '🔄 Analyzing...' : '✨ Get Insights'}
        </button>
      </div>

      {insights && (
        <div className="ai-insights-content">
          <div className="ai-insights-text">{insights}</div>
          <button
            className="ai-insights-close"
            onClick={() => setInsights(null)}
          >
            Clear
          </button>
        </div>
      )}

      {error && (
        <div className="ai-insights-error">
          <strong>⚠️ Error:</strong> {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {!insights && !error && !loading && (
        <div className="ai-insights-empty">
          <p>Click "Get Insights" to analyze recent violations</p>
        </div>
      )}
    </div>
  );
}

export default AIInsights;

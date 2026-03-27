export default function ViolationsFeed() {
  return (
    <section className="feed-section" id="feed">
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div className="feed-grid">
          {/* Active violation card */}
          <div>
            <div className="v-card reveal">
              <div className="v-card-glow"></div>
              <div className="v-badge"><span className="v-icon">🚦</span> Signal Jump · ACTIVE</div>
              <h3>FC Road Chowk — Signal Violation Surge</h3>
              <p>
                23 signal jump violations recorded at FC Road intersection since 9AM.
                Peak hour enforcement alert triggered. Traffic unit deployed.
              </p>
              <div className="conf-meter">
                <span className="conf-label">Model Confidence</span>
                <div className="conf-num">97.4%</div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width: '77%' }}></div></div>
              <div className="cam-pile">
                <span className="cam-chip">CAM-11</span>
                <span className="cam-chip">CAM-12</span>
                <span className="cam-chip">CAM-13</span>
                <span className="cam-more">+4 cameras</span>
              </div>
              <button className="action-btn">📋 View Full Violation Log · लॉग देखें</button>
            </div>
          </div>

          {/* Feature panel */}
          <div className="feed-info-panel">
            <span className="sec-tag reveal">Phase 02 · Enforcement</span>
            <h2 className="sec-title reveal d1">Violations logged. <em>Authorities notified.</em></h2>
            <div className="feature-list reveal d2">
              {[
                { icon: '📸', title: 'Evidence Snapshots', desc: 'Timestamped frame captures for every violation — legally admissible digital evidence.' },
                { icon: '🗺️', title: 'Hotspot Heatmap', desc: 'City-level view of violation clusters by ward, intersection, and peak hours.' },
                { icon: '⚡', title: 'Real-Time Alerts', desc: 'Instant WebSocket notifications to traffic officers with violation type, location & snapshot.' },
                { icon: '📊', title: 'Multi-Violation Detection', desc: 'One model pass detects helmet, signal, triple riding, and lane violations simultaneously.' },
              ].map((f) => (
                <div className="feat-item" key={f.title}>
                  <span className="feat-icon">{f.icon}</span>
                  <div>
                    <h4>{f.title}</h4>
                    <p>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="feat-cta reveal d3">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              View All Violations · सभी उल्लंघन
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
